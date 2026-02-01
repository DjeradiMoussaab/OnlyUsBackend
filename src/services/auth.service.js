import createError from "http-errors"
import mongoose from "mongoose"
import { User } from "../models/User.js"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js"

const partnerNotSetFilter = { $or: [{ partner: { $exists: false } }, { partner: null }] }

export const register = async (input) => {
    const exists = await User.findOne({ phoneNumber: input.phoneNumber })
    if (exists) throw createError(409, "Phone number already in use")

    let partnerUser = null
    if (input.partnerPhoneNumber) {
        partnerUser = await User.findOne({ phoneNumber: input.partnerPhoneNumber })
        if (!partnerUser) throw createError(404, "Partner not found")
        if (partnerUser.partner) throw createError(409, "Partner already has a partner")
    }

    const session = await mongoose.startSession()
    let createdUserId = null

    try {
        await session.withTransaction(async () => {
            const created = await User.create([{
                phoneNumber: input.phoneNumber,
                nickname: input.nickname,
                sex: input.sex ?? "undefined",
                inChat: input.inChat ?? false,
                profilePicture: input.profilePicture,
                birthdate: input.birthdate,
                localization: input.localization
            }], { session })

            createdUserId = created[0]._id

            if (partnerUser) {
                const meUpdate = await User.updateOne(
                    { _id: createdUserId, ...partnerNotSetFilter },
                    { $set: { partner: partnerUser._id } },
                    { session }
                )

                const partnerUpdate = await User.updateOne(
                    { _id: partnerUser._id, ...partnerNotSetFilter },
                    { $set: { partner: createdUserId } },
                    { session }
                )

                if (meUpdate.modifiedCount !== 1 || partnerUpdate.modifiedCount !== 1) {
                    throw createError(409, "Partner link failed, please retry")
                }
            }
        })
    } finally {
        session.endSession()
    }

    const user = await User.findById(createdUserId)
    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    user.refreshToken = refreshToken
    await user.save()

    const populatedUser = await User.findById(user._id).populate("partner")

    return { user: populatedUser, accessToken, refreshToken }
}

export const login = async (phoneNumber) => {
    const user = await User.findOne({ phoneNumber })
    if (!user) throw createError(404, "User not found")

    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    user.refreshToken = refreshToken
    await user.save()

    const populatedUser = await User.findById(user._id).populate("partner")

    return { user: populatedUser, accessToken, refreshToken }
}

export const refresh = async (refreshToken) => {
    let payload
    try {
        payload = verifyRefreshToken(refreshToken)
    } catch {
        throw createError(401, "Invalid refresh token")
    }

    const user = await User.findById(payload.sub)
    if (!user) throw createError(401, "Invalid refresh token")
    if (!user.refreshToken || user.refreshToken !== refreshToken) throw createError(401, "Refresh token mismatch")

    const newAccessToken = signAccessToken(user.id)
    const newRefreshToken = signRefreshToken(user.id)

    user.refreshToken = newRefreshToken
    await user.save()

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export const logout = async (userId) => {
    const user = await User.findById(userId)
    if (!user) return
    user.refreshToken = null
    await user.save()
}
