const db = require("../config/db");

const createAuditLog = async ({
    userId = null,
    action,
    description = null,
    ipAddress = null,
    userAgent = null
}) => {

    try {

        await db.query(
            `
            INSERT INTO audit_logs
            (
                user_id,
                action,
                description,
                ip_address,
                user_agent
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                userId,
                action,
                description,
                ipAddress,
                userAgent
            ]
        );

        console.log(
            `AUDIT LOG CREATED: ${action}`
        );

    } catch (err) {

        console.error(
            "AUDIT LOG ERROR:",
            err
        );

    }

};

module.exports = {
    createAuditLog
};