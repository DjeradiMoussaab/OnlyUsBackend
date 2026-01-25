import createError from "http-errors"
import { verifyAccessToken } from "../utils/jwt.js"

export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith("Bearer ")) return next(createError(401, "Missing token"))

    const token = header.slice(7)
    try {
        const payload = verifyAccessToken(token)
        req.userId = payload.sub
        next()
    } catch {
        next(createError(401, "Invalid token"))
    }
}

