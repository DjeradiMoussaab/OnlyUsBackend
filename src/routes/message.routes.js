import { Router } from "express"
import * as messageController from "../controllers/message.controller.js"

const router = Router()

router.post("/", messageController.send)

router.get("/conversation/:userId/:otherUserId", messageController.conversation)

router.patch("/:messageId/status", messageController.setStatus)
router.patch("/conversation/:userId/:otherUserId/read", messageController.markRead)

router.post("/:messageId/view-once", messageController.viewOneTime)

router.delete("/:messageId", messageController.remove)

export default router
