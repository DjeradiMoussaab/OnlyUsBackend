export const isString = (v) => typeof v === "string" && v.trim().length > 0

export const isBool = (v) => typeof v === "boolean"

export const isValidSex = (v) => ["male", "female", "undefined"].includes(v)

export const isValidUrl = (v) => {
    try {
        new URL(v)
        return true
    } catch {
        return false
    }
}

export const parseDate = (v) => {
    if (v === undefined || v === null || v === "") return undefined
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
}

export const isPlainObject = (v) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
