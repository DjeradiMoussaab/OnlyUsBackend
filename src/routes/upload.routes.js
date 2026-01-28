import { Router } from "express"
import { uploadMessageImage } from "../controllers/upload.controller.js"
import { uploadMessageImage as uploadMessageImageMiddleware } from "../middlewares/upload.middleware.js"

const router = Router()

router.post("/message-image", uploadMessageImageMiddleware, uploadMessageImage)

export default router
