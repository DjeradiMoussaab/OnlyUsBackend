import fs from "fs"
import path from "path"
import crypto from "crypto"
import multer from "multer"
import createError from "http-errors"

const messagesDir = path.resolve(process.cwd(), "uploads", "messages")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            fs.mkdirSync(messagesDir, { recursive: true })
            cb(null, messagesDir)
        } catch (e) {
            cb(e)
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase()
        const name = crypto.randomBytes(16).toString("hex")
        cb(null, `${name}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
    if (!allowed.has(file.mimetype)) return cb(createError(400, "Only image files are allowed"))
    cb(null, true)
}

export const uploadMessageImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single("image")
