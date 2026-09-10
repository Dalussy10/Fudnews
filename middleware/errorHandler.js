module.exports = (err, req, res, next) => {

    console.error("ERROR:", err);

    const statusCode = err.status || 500;

    // Don't expose internal errors in production
    const message =
        process.env.NODE_ENV === "production"
            ? "Something went wrong. Please try again."
            : err.message || "Something went wrong.";

    // If the request expects JSON
    if (req.headers.accept?.includes("application/json")) {

        return res.status(statusCode).json({
            success: false,
            message
        });

    }

    // Normal browser request
    res.status(statusCode).send(message);

};