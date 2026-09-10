const bcrypt = require("bcryptjs");
const pool = require("../config/db");


// ==========================================
// LOGIN USER
// ==========================================

exports.login = async (email, password) => {

    const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    const user = result.rows[0];

    // User does not exist
    if (!user) {
        return null;
    }


    // Check password
    const valid = await bcrypt.compare(
        password,
        user.password
    );

    if (!valid) {
        return null;
    }


    // Check whether account is active
    if (user.is_active === false) {
        return null;
    }


    // Update last login
    await pool.query(
        `
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [user.id]
    );


    return user;

};