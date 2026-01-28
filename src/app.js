import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { env } from "./config/env.js"
import routes from "./routes/index.js"
import { errorMiddleware } from "./middlewares/error.middleware.js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const createApp = () => {
    const app = express()

    app.use(helmet())
    app.use(cors({ origin: env.corsOrigin, credentials: true }))
    app.use(express.json({ limit: "2mb" }))
    app.use(cookieParser())
    app.use(morgan("dev"))

    app.use("/api", routes)
    app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))
    app.use(errorMiddleware)

    return app
}
