import createError from "http-errors"
import { asyncHandler } from "../utils/asyncHandler.js"
import * as authService from "../services/auth.service.js"
import { isString, isBool, isValidSex, isValidUrl, parseDate, isPlainObject } from "../utils/validate.js"

export const register = asyncHandler(async (req, res) => {
    const {
        phoneNumber,
        nickname,
        sex,
        inChat,
        profilePicture,
        birthdate,
        localization,
        partnerPhoneNumber
    } = req.body || {}

    if (!isString(phoneNumber)) throw createError(400, "phoneNumber is required")
    if (!isString(nickname)) throw createError(400, "nickname is required")

    if (sex !== undefined && !isValidSex(sex)) throw createError(400, "sex must be male, female, or undefined")
    if (inChat !== undefined && !isBool(inChat)) throw createError(400, "inChat must be a boolean")

    if (profilePicture !== undefined) {
        if (!isString(profilePicture) || !isValidUrl(profilePicture)) throw createError(400, "profilePicture must be a valid URL")
    }

    const parsedBirthdate = parseDate(birthdate)
    if (parsedBirthdate === null) throw createError(400, "birthdate must be a valid date")

    if (localization !== undefined) {
        if (!isPlainObject(localization)) throw createError(400, "localization must be an object")
        for (const [k, v] of Object.entries(localization)) {
            if (!isString(k) || typeof v !== "string") throw createError(400, "localization values must be strings")
        }
    }

    if (partnerPhoneNumber !== undefined && !isString(partnerPhoneNumber)) {
        throw createError(400, "partnerPhoneNumber must be a string")
    }

    const result = await authService.register({
        phoneNumber,
        nickname,
        sex: sex ?? "undefined",
        inChat: inChat ?? false,
        profilePicture,
        birthdate: parsedBirthdate,
        localization: localization ? new Map(Object.entries(localization)) : undefined,
        partnerPhoneNumber
    })

    res.status(201).json(result)
})

export const login = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body || {}
    if (!isString(phoneNumber)) throw createError(400, "phoneNumber is required")

    const result = await authService.login(phoneNumber)
    res.json(result)
})

export const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {}
    if (!isString(refreshToken) || refreshToken.length < 10) throw createError(400, "refreshToken is required")

    const result = await authService.refresh(refreshToken)
    res.json(result)
})
