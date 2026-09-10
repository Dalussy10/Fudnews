module.exports = (req, res, next) => {

    if (
        !req.session ||
        !req.session.user ||
        !req.session.user.id ||
        !req.session.user.role
    ) {

        req.flash(
            "error",
            "Please login first."
        );

        return res.redirect(
            "/admin/login"
        );

    }

    next();

};