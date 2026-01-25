import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    nickname: { type: String, required: true },
    sex: { type: String, enum: ["male", "female", "undefined"], default: "undefined", required: true },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    profilePicture: { type: String, required: false },
    birthdate: { type: Date, required: false },
    localization: { type: Map, of: String, required: false },
    refreshToken: { type: String, required: false }
}, { timestamps: true })

export const User = mongoose.model("User", UserSchema)
