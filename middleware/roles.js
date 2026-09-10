const {
    createAuditLog
} = require("../services/auditLogService");


exports.requireRole = (...roles) => {

    return async (req, res, next) => {

        // ==========================================
        // NOT LOGGED IN
        // ==========================================

        if (
            !req.session ||
            !req.session.user
        ) {

            req.flash(
                "error",
                "Please login first."
            );

            return res.redirect(
                "/admin/login"
            );

        }


        // ==========================================
        // ROLE NOT ALLOWED
        // ==========================================

        if (
            !roles.includes(
                req.session.user.role
            )
        ) {

            await createAuditLog({

                userId:
                    req.session.user.id,

                action:
                    "UNAUTHORIZED_ACCESS",

                description:
                    `User with role "${req.session.user.role}" attempted to access a route requiring: ${roles.join(", ")}`,

                ipAddress:
                    req.ip,

                userAgent:
                    req.get("user-agent")

            });

            return res.status(403).send(
                "Access Denied"
            );

        }


        // ==========================================
        // AUTHORIZED
        // ==========================================

        next();

    };

};