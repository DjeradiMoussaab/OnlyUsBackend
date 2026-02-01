import createError from "http-errors"
import mongoose from "mongoose"
import { User } from "../models/User.js"

const partnerNotSetFilter = { $or: [{ partner: { $exists: false } }, { partner: null }] }

export const linkPartnerByPhone = async (myUserId, partnerPhoneNumber) => {
    const me = await User.findById(myUserId)
    if (!me) throw createError(404, "User not found")
    if (me.partner) throw createError(409, "You already have a partner")

    const partner = await User.findOne({ phoneNumber: partnerPhoneNumber })
    if (!partner) throw createError(404, "Partner not found")
    if (String(partner._id) === String(me._id)) throw createError(400, "You cannot partner with yourself")
    if (partner.partner) throw createError(409, "Partner already has a partner")

    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            await User.updateOne({ _id: me._id, ...partnerNotSetFilter }, { $set: { partner: partner._id } }, { session })
            await User.updateOne({ _id: partner._id, ...partnerNotSetFilter }, { $set: { partner: me._id } }, { session })
        })
    } finally {
        session.endSession()
    }

    const updatedMe = await User.findById(me._id).populate("partner")
    return updatedMe
}

export const getMyPartner = async (myUserId) => {
    const me = await User.findById(myUserId).populate("partner")
    if (!me) throw createError(404, "User not found")
    return me.partner || null
}

export const unlinkPartner = async (myUserId) => {
    const me = await User.findById(myUserId)
    if (!me) throw createError(404, "User not found")
    if (!me.partner) return

    const partnerId = me.partner

    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            await User.updateOne({ _id: me._id }, { $unset: { partner: "" } }, { session })
            await User.updateOne({ _id: partnerId }, { $unset: { partner: "" } }, { session })
        })
    } finally {
        session.endSession()
    }
}
