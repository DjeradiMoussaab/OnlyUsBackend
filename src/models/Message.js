import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["sent", "delivered", "read", "imageSeen"], default: "sent" },
    messageType: { type: String, enum: ["text", "image", "video"], default: "text" },
    isDeleted: { type: Boolean, default: false },
    isOneTime: { type: Boolean, default: false },
    viewedAt: { type: Date, default: null }
})

export const Message = mongoose.model("Message", MessageSchema)
