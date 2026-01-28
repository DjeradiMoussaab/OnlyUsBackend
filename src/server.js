import http from "http"
import { connectDB } from "./config/db.js"
import { env } from "./config/env.js"
import { createApp } from "./app.js"
import { initSocket } from "./sockets/index.js"

const start = async () => {
    await connectDB()

    const app = createApp()
    const server = http.createServer(app)

    initSocket(server)

    server.listen(env.port, () => console.log(`Server running on ${env.port}`))
}

start().catch((err) => {
    console.error(err)
    process.exit(1)
})