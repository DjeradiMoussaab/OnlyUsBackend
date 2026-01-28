import { Server } from "socket.io"
import createError from "http-errors"
import { isString } from "../utils/validate.js"
import * as messageService from "../services/message.service.js"

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: true, credentials: true }
    })

    io.use((socket, next) => {
        const userId = socket.handshake.auth?.userId
        if (!isString(userId)) return next(createError(401, "userId is required"))
        socket.userId = userId
        next()
    })

    io.on("connection", (socket) => {
        const userId = socket.userId
        socket.join(`user:${userId}`)
        console.log("socket connected", socket.id)
        console.log("socket userId:", socket.userId)
        socket.on("message:send", async (payload, ack) => {
            try {
                const { recipientId, content, messageType, isOneTime } = payload || {}

                const result = await messageService.sendMessage({
                    senderId: userId,
                    recipientId,
                    content,
                    messageType,
                    isOneTime
                })

                const msg = result.message

                io.to(`user:${userId}`).emit("message:new", msg)
                io.to(`user:${recipientId}`).emit("message:new", msg)

                ack?.({ ok: true, message: msg })
            } catch (e) {
                ack?.({ ok: false, error: e.message })
            }
        })

        socket.on("message:delivered", async (payload, ack) => {
            try {
                const { messageId } = payload || {}
                const result = await messageService.updateMessageStatus({
                    userId,
                    messageId,
                    status: "delivered"
                })
                const msg = result.message
                io.to(`user:${msg.senderId}`).emit("message:status", { messageId: msg._id, status: msg.status, viewedAt: msg.viewedAt })
                io.to(`user:${msg.recipientId}`).emit("message:status", { messageId: msg._id, status: msg.status, viewedAt: msg.viewedAt })
                ack?.({ ok: true })
            } catch (e) {
                ack?.({ ok: false, error: e.message })
            }
        })

        socket.on("message:read", async (payload, ack) => {
            try {
                const { messageId } = payload || {}
                const result = await messageService.updateMessageStatus({
                    userId,
                    messageId,
                    status: "read"
                })
                const msg = result.message
                io.to(`user:${msg.senderId}`).emit("message:status", { messageId: msg._id, status: msg.status, viewedAt: msg.viewedAt })
                io.to(`user:${msg.recipientId}`).emit("message:status", { messageId: msg._id, status: msg.status, viewedAt: msg.viewedAt })
                ack?.({ ok: true })
            } catch (e) {
                ack?.({ ok: false, error: e.message })
            }
        })

        socket.on("conversation:read", async (payload, ack) => {
            try {
                const { otherUserId } = payload || {}
                const result = await messageService.markConversationRead({ userId, otherUserId })
                io.to(`user:${otherUserId}`).emit("conversation:read", { by: userId, updatedCount: result.updatedCount })
                ack?.({ ok: true, updatedCount: result.updatedCount })
            } catch (e) {
                ack?.({ ok: false, error: e.message })
            }
        })

        socket.on("typing:start", (payload) => {
            const { to } = payload || {}
            if (!isString(to)) return
            io.to(`user:${to}`).emit("typing:start", { from: userId })
        })

        socket.on("typing:stop", (payload) => {
            const { to } = payload || {}
            if (!isString(to)) return
            io.to(`user:${to}`).emit("typing:stop", { from: userId })
        })
    })

    return io
}
