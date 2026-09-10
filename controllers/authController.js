const authService =
require("../services/authService");

exports.login = async (req, res) => {

    const user =
        await authService.login(
            req.body.email,
            req.body.password
        );

    if (!user) {

        req.flash(
            "error",
            "Invalid credentials."
        );

        return res.redirect(
            "/admin/login"
        );

    }

    req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
};

res.redirect("/admin");

};