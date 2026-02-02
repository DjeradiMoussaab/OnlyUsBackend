import createError from "http-errors"
import mongoose from "mongoose"
import { Message } from "../models/Message.js"

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v)

export const sendMessage = async ({
                                      senderId,
                                      recipientId,
                                      content,
                                      messageType = "text",
                                      isOneTime = false
                                  }) => {
    if (!isObjectId(senderId)) throw createError(400, "senderId is invalid")
    if (!isObjectId(recipientId)) throw createError(400, "recipientId is invalid")
    if (senderId === recipientId) throw createError(400, "cannot send message to yourself")

    const doc = await Message.create({
        senderId,
        recipientId,
        content,
        messageType,
        isOneTime,
        status: "sent"
    })

    return { message: doc }
}

export const getConversation = async ({
                                          userId,
                                          otherUserId,
                                          limit = 30,
                                          before
                                      }) => {
    if (!isObjectId(userId)) throw createError(400, "userId is invalid")
    if (!isObjectId(otherUserId)) throw createError(400, "otherUserId is invalid")

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30))

    const match = {
        isDeleted: false,
        $or: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId }
        ]
    }

    if (before) {
        const d = new Date(before)
        if (Number.isNaN(d.getTime())) throw createError(400, "before must be a valid date")
        match.timestamp = { $lt: d }
    }

    const messages = await Message.find(match)
        .sort({ timestamp: -1 })
        .limit(safeLimit)
        .lean()

    const transformed = messages.map(m => {
        const isSenderRequesting = String(m.senderId) === String(userId)
        const isOneTime = m.isOneTime === true

        if (isOneTime && isSenderRequesting) {
            return {
                ...m,
                status: "blocked",
                content: "",
            }
        }
        return m
    })

    return { messages: transformed }
}

export const getThreads = async ({ userId, limit = 50 }) => {
    if (!isObjectId(userId)) throw createError(400, "userId is invalid")
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50))

    const uid = new mongoose.Types.ObjectId(userId)

    const threads = await Message.aggregate([
        { $match: { isDeleted: false, $or: [{ senderId: uid }, { recipientId: uid }] } },
        {
            $addFields: {
                otherUserId: {
                    $cond: [{ $eq: ["$senderId", uid] }, "$recipientId", "$senderId"]
                }
            }
        },
        { $sort: { timestamp: -1 } },
        {
            $group: {
                _id: "$otherUserId",
                lastMessage: { $first: "$$ROOT" }
            }
        },
        { $sort: { "lastMessage.timestamp": -1 } },
        { $limit: safeLimit }
    ])

    return {
        threads: threads.map((t) => ({
            otherUserId: t._id,
            lastMessage: t.lastMessage
        }))
    }
}

export const updateMessageStatus = async ({ userId, messageId, status }) => {
    if (!isObjectId(userId)) throw createError(400, "userId is invalid")
    if (!isObjectId(messageId)) throw createError(400, "messageId is invalid")

    const allowed = new Set(["delivered", "read", "imageSeen"])
    if (!allowed.has(status)) throw createError(400, "status must be delivered, read, or imageSeen")

    const msg = await Message.findById(messageId)
    if (!msg || msg.isDeleted) throw createError(404, "message not found")

    const isRecipient = String(msg.recipientId) === String(userId)
    if (!isRecipient) throw createError(403, "only recipient can update message status")

    const patch = { status }
    if (status === "read" || status === "imageSeen") patch.viewedAt = new Date()

    const updated = await Message.findByIdAndUpdate(messageId, patch, { new: true })
    return { message: updated }
}

export const markConversationRead = async ({ userId, otherUserId }) => {
    if (!isObjectId(userId)) throw createError(400, "userId is invalid")
    if (!isObjectId(otherUserId)) throw createError(400, "otherUserId is invalid")

    const now = new Date()

    const r = await Message.updateMany(
        {
            isDeleted: false,
            senderId: otherUserId,
            recipientId: userId,
            status: { $in: ["sent", "delivered"] }
        },
        { $set: { status: "read", viewedAt: now } }
    )

    return { updatedCount: r.modifiedCount ?? r.nModified ?? 0 }
}

export const deleteMessage = async ({ userId, messageId }) => {
    if (!isObjectId(userId)) throw createError(400, "userId is invalid")
    if (!isObjectId(messageId)) throw createError(400, "messageId is invalid")

    const msg = await Message.findById(messageId)
    if (!msg || msg.isDeleted) throw createError(404, "message not found")

    const allowed =
        String(msg.senderId) === String(userId) || String(msg.recipientId) === String(userId)
    if (!allowed) throw createError(403, "not allowed to delete this message")

    const updated = await Message.findByIdAndUpdate(
        messageId,
        { isDeleted: true },
        { new: true }
    )

    return { message: updated }
}

export const viewOneTimeMessage = async ({ userId, messageId }) => {
    if (!isObjectId(userId)) throw createError(400, "userId is invalid")
    if (!isObjectId(messageId)) throw createError(400, "messageId is invalid")

    const msg = await Message.findById(messageId)
    if (!msg || msg.isDeleted) throw createError(404, "message not found")

    const isRecipient = String(msg.recipientId) === String(userId)
    if (!isRecipient) throw createError(403, "only recipient can view this message")

    if (!msg.isOneTime) throw createError(400, "message is not one-time")

    const now = new Date()

    const updated = await Message.findOneAndUpdate(
        { _id: messageId, isDeleted: false },
        { $set: { viewedAt: now, status: "imageSeen", isDeleted: true } },
        { new: true }
    )

    if (!updated) throw createError(410, "one-time message already viewed")

    return { message: updated }
}
