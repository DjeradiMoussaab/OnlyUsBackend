import createError from "http-errors"
import { asyncHandler } from "../utils/asyncHandler.js"
import * as messageService from "../services/message.service.js"
import { isString, isBool } from "../utils/validate.js"

const isValidMessageType = (v) => v === "text" || v === "image" || v === "video"

export const send = asyncHandler(async (req, res) => {
    const {
        senderId,
        recipientId,
        content,
        messageType,
        isOneTime
    } = req.body || {}

    if (!isString(senderId)) throw createError(400, "senderId is required")
    if (!isString(recipientId)) throw createError(400, "recipientId is required")
    if (!isString(content) || content.trim().length === 0) throw createError(400, "content is required")

    if (messageType !== undefined && !isValidMessageType(messageType)) {
        throw createError(400, "messageType must be text, image, or video")
    }

    if (isOneTime !== undefined && !isBool(isOneTime)) {
        throw createError(400, "isOneTime must be a boolean")
    }

    const result = await messageService.sendMessage({
        senderId,
        recipientId,
        content: content.trim(),
        messageType: messageType ?? "text",
        isOneTime: isOneTime ?? false
    })

    res.status(201).json(result)
})

export const conversation = asyncHandler(async (req, res) => {
    const { userId, otherUserId } = req.params
    const { limit, before } = req.query || {}

    if (!isString(userId)) throw createError(400, "userId is required")
    if (!isString(otherUserId)) throw createError(400, "otherUserId is required")

    const result = await messageService.getConversation({
        userId,
        otherUserId,
        limit,
        before
    })

    res.json(result)
})

export const setStatus = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const { userId, status } = req.body || {}

    if (!isString(messageId)) throw createError(400, "messageId is required")
    if (!isString(userId)) throw createError(400, "userId is required")
    if (!isString(status)) throw createError(400, "status is required")

    const result = await messageService.updateMessageStatus({
        userId,
        messageId,
        status
    })

    res.json(result)
})

export const markRead = asyncHandler(async (req, res) => {
    const { userId, otherUserId } = req.params
    if (!isString(userId)) throw createError(400, "userId is required")
    if (!isString(otherUserId)) throw createError(400, "otherUserId is required")

    const result = await messageService.markConversationRead({ userId, otherUserId })
    res.json(result)
})

export const remove = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const { userId } = req.body || {}

    if (!isString(messageId)) throw createError(400, "messageId is required")
    if (!isString(userId)) throw createError(400, "userId is required")

    const result = await messageService.deleteMessage({ userId, messageId })
    res.json(result)
})

export const viewOneTime = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const { userId } = req.body || {}

    if (!isString(messageId)) throw createError(400, "messageId is required")
    if (!isString(userId)) throw createError(400, "userId is required")

    const result = await messageService.viewOneTimeMessage({ userId, messageId })
    res.json(result)
})
