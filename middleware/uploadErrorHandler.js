const multer = require("multer");


module.exports = (
    err,
    req,
    res,
    next
) => {

    if (
        err instanceof multer.MulterError
    ) {

        if (
            err.code ===
            "LIMIT_FILE_SIZE"
        ) {

            req.flash(
                "error",
                "Image is too large. Maximum size is 5 MB."
            );

            return res.redirect(
                req.get("Referer") ||
                "/compose"
            );

        }


        req.flash(
            "error",
            "There was a problem uploading the image."
        );

        return res.redirect(
            req.get("Referer") ||
            "/compose"
        );

    }


    if (
        err &&
        err.message &&
        err.message.includes(
            "Only JPG"
        )
    ) {

        req.flash(
            "error",
            err.message
        );

        return res.redirect(
            req.get("Referer") ||
            "/compose"
        );

    }


    next(err);

};