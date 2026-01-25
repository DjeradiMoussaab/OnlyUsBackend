import dotenv from "dotenv"
dotenv.config()

const required = (key) => {
    const v = process.env[key]
    if (!v) throw new Error(`Missing env var: ${key}`)
    return v
}

export const env = {
    port: Number(process.env.PORT || 3000),
    mongodbUri: required("MONGODB_URI"),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    jwt: {
        accessSecret: required("JWT_ACCESS_SECRET"),
        refreshSecret: required("JWT_REFRESH_SECRET"),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
    }
}
