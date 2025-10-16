const Response = {
    Success: ({ res, status, message, data }) => {
        return res.status(status).json({
            message: message,
            data: data
        })
    },
    Error: ({ res, status, message, error }) => {
        return res.status(status).json({
            message: message,
            error: error
        })
    }
}
module.exports = Response