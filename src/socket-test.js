import { io } from "socket.io-client"

const socket = io("http://localhost:3000", {
    auth: { userId: "69762433ca4d60d2dd79d657" }
})

socket.on("connect", () => {
    console.log("connected", socket.id)

    socket.emit(
        "message:send",
        {
            recipientId: "697627b086f36a2d2c86d1e1",
            content: "Hello from socket test",
            messageType: "text"
        },
        (ack) => {
            console.log("ACK:", ack)
        }
    )
})

socket.on("message:new", (msg) => {
    console.log("NEW MESSAGE:", msg)
})

socket.on("message:status", (data) => {
    console.log("STATUS:", data)
})
