import { connectDB } from "./config/db.js"
import { env } from "./config/env.js"
import { createApp } from "./app.js"

const start = async () => {
    await connectDB()
    const app = createApp()
    app.listen(env.port, () => console.log(`Server running on ${env.port}`))
}

start().catch((err) => {
    console.error(err)
    process.exit(1)
})
