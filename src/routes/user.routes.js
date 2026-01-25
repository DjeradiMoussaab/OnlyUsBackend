import { Router } from "express"
import { requireAuth } from "../middlewares/auth.middleware.js"
import * as userController from "../controllers/user.controller.js"

const router = Router()

router.post("/partner/link", requireAuth, userController.linkPartner)
router.get("/partner", requireAuth, userController.getPartner)
router.delete("/partner", requireAuth, userController.unlink)

export default router
