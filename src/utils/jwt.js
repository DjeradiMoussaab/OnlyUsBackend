import jwt from "jsonwebtoken"
import { env } from "../config/env.js"

export const signAccessToken = (userId) =>
    jwt.sign({ sub: userId }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn })

export const signRefreshToken = (userId) =>
    jwt.sign({ sub: userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn })

export const verifyAccessToken = (token) =>
    jwt.verify(token, env.jwt.accessSecret)

export const verifyRefreshToken = (token) =>
    jwt.verify(token, env.jwt.refreshSecret)
