import createError from "http-errors"
import { User } from "../models/User.js"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js"

export const register = async (input) => {
    const exists = await User.findOne({ phoneNumber: input.phoneNumber })
    if (exists) throw createError(409, "Phone number already in use")

    const user = await User.create({
        phoneNumber: input.phoneNumber,
        nickname: input.nickname,
        sex: input.sex ?? "undefined",
        inChat: input.inChat ?? false,
        profilePicture: input.profilePicture,
        birthdate: input.birthdate,
        localization: input.localization
    })

    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    user.refreshToken = refreshToken
    await user.save()

    return { user, accessToken, refreshToken }
}

export const login = async (phoneNumber) => {
    const user = await User.findOne({ phoneNumber })
    if (!user) throw createError(404, "User not found")

    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    user.refreshToken = refreshToken
    await user.save()

    return { user, accessToken, refreshToken }
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
