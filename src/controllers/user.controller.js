import createError from "http-errors"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isString } from "../utils/validate.js"
import * as userService from "../services/user.service.js"

export const linkPartner = asyncHandler(async (req, res) => {
    const { partnerPhoneNumber } = req.body || {}
    if (!isString(partnerPhoneNumber)) throw createError(400, "partnerPhoneNumber is required")

    const me = await userService.linkPartnerByPhone(req.userId, partnerPhoneNumber)
    res.json({ user: me })
})

export const getPartner = asyncHandler(async (req, res) => {
    const partner = await userService.getMyPartner(req.userId)
    res.json({ partner })
})

export const unlink = asyncHandler(async (req, res) => {
    await userService.unlinkPartner(req.userId)
    res.json({ ok: true })
})
