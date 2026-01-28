import createError from "http-errors"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isString } from "../utils/validate.js"

export const uploadMessageImage = asyncHandler(async (req, res) => {
    if (!req.file) throw createError(400, "image file is required")

    const baseUrl = isString(process.env.PUBLIC_BASE_URL)
        ? process.env.PUBLIC_BASE_URL
        : `${req.protocol}://${req.get("host")}`

    const url = `${baseUrl}/uploads/messages/${req.file.filename}`

    res.status(201).json({
        url,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
    })
})
