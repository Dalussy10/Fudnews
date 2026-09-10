const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
    createAuditLog
} = require("../services/auditLogService");

const categoryService = require("../services/categoryService");
const postService = require("../services/postService");
const authService = require("../services/authService");


// ==========================================
// LOGIN PAGE
// ==========================================

exports.loginPage = (req, res) => {

    if (req.session.user) {

        const role = req.session.user.role;

        if (role === "admin") {
            return res.redirect("/admin");
        }

        if (role === "editor") {
            return res.redirect("/admin/posts");
        }

        if (role === "journalist") {
            return res.redirect("/compose");
        }
    }

    res.render("admin-login");
};


// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await authService.login(
            email,
            password
        );

        // ==========================================
        // INVALID LOGIN
        // ==========================================

       if (!user) {

    await createAuditLog({

        action: "LOGIN_FAILED",

        description:
            `Failed login attempt for ${email}`,

        ipAddress:
            req.ip,

        userAgent:
            req.get("user-agent")

    });

    req.flash(
        "error",
        "Invalid email or password."
    );

    return res.redirect(
        "/admin/login"
    );

}

        // ==========================================
        // REGENERATE SESSION
        // ==========================================

        req.session.regenerate(async (err) => {

            if (err) {

                console.error(
                    "SESSION REGENERATION ERROR:",
                    err
                );

                req.flash(
                    "error",
                    "Unable to login. Please try again."
                );

                return res.redirect(
                    "/admin/login"
                );

            }

            // ==========================================
            // CREATE NEW SESSION
            // ==========================================

            req.session.user = {

                id: user.id,

                fullname: user.fullname,

                email: user.email,

                role: user.role

            };

            await createAuditLog({

    userId: user.id,

    action: "LOGIN_SUCCESS",

    description:
        "User successfully logged in.",

    ipAddress:
        req.ip,

    userAgent:
        req.get("user-agent")

});

            // ==========================================
            // SAVE SESSION BEFORE REDIRECT
            // ==========================================

            req.session.save((err) => {

                if (err) {

                    console.error(
                        "SESSION SAVE ERROR:",
                        err
                    );

                    return res.status(500).send(
                        "Unable to create secure session."
                    );

                }

                // ==========================================
                // ROLE-BASED REDIRECT
                // ==========================================

                if (user.role === "admin") {

                    return res.redirect(
                        "/admin"
                    );

                }

                if (user.role === "editor") {

                    return res.redirect(
                        "/admin/posts"
                    );

                }

                if (user.role === "journalist") {

                    return res.redirect(
                        "/compose"
                    );

                }

                // ==========================================
                // INVALID ROLE
                // ==========================================

                req.session.destroy(() => {

                    req.flash(
                        "error",
                        "Your account does not have a valid role."
                    );

                    return res.redirect(
                        "/admin/login"
                    );

                });

            });

        });

    } catch (err) {

        console.error(
            "LOGIN ERROR:",
            err
        );

        req.flash(
            "error",
            "Unable to login. Please try again."
        );

        return res.redirect(
            "/admin/login"
        );

    }

};

// ==========================================
// LOGOUT
// ==========================================

exports.logout = (req, res) => {

    const user = req.session.user;

    req.session.destroy(async (err) => {

        if (err) {

            console.error(
                "LOGOUT ERROR:",
                err
            );

            return res.status(500).send(
                "Unable to logout."
            );

        }

        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId: user?.id || null,

            action: "LOGOUT",

            description:
                "User successfully logged out.",

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });

        // ==========================================
        // CLEAR SESSION COOKIE
        // ==========================================

        res.clearCookie(
            "fudnews.sid",
            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "lax"
            }
        );

        return res.redirect(
            "/admin/login"
        );

    });

};


// ==========================================
// ADMIN DASHBOARD
// ADMIN ONLY
// ==========================================

exports.dashboard = async (req, res) => {

    try {

        // Total posts

        const totalPosts =
            await postService.getTotalPosts();


        // Comment statistics

        const commentsResult =
            await pool.query(`
                SELECT
                    COUNT(*) AS total_comments,

                    COUNT(*) FILTER (
                        WHERE approved = true
                    ) AS approved_comments,

                    COUNT(*) FILTER (
                        WHERE approved = false
                    ) AS pending_comments

                FROM comments
            `);


        const commentStats =
            commentsResult.rows[0];


        // Total users

        const usersResult =
            await pool.query(`
                SELECT COUNT(*) AS total_users
                FROM users
            `);


        const totalUsers =
            Number(
                usersResult.rows[0].total_users
            );


        // Total views

        const viewsResult =
            await pool.query(`
                SELECT
                    COALESCE(
                        SUM(views),
                        0
                    ) AS total_views
                FROM posts
            `);


        const totalViews =
            Number(
                viewsResult.rows[0].total_views
            );


        // Recent posts

        const recentResult =
            await pool.query(`
                SELECT
                    p.*,
                    c.name AS category_name

                FROM posts p

                LEFT JOIN categories c
                    ON p.category_id = c.id

                ORDER BY p.created_at DESC

                LIMIT 10
            `);


        const recentPosts =
            recentResult.rows;


        // Recent comments

        const recentCommentsResult =
            await pool.query(`
                SELECT
                    c.id,
                    c.comment,
                    c.fullname,
                    c.approved,
                    c.created_at,

                    p.slug AS post_slug,
                    p.title AS post_title

                FROM comments c

                LEFT JOIN posts p
                    ON c.post_id = p.id

                ORDER BY c.created_at DESC

                LIMIT 5
            `);


        const recentComments =
            recentCommentsResult.rows;


        // Recent users

        const recentUsersResult =
            await pool.query(`
                SELECT
                    id,
                    fullname,
                    email,
                    role

                FROM users

                ORDER BY id DESC

                LIMIT 5
            `);


        const recentUsers =
            recentUsersResult.rows;


        res.render(
            "admin",
            {
                totalPosts,
                totalUsers,
                totalViews,
                commentStats,
                recentPosts,
                recentComments,
                recentUsers,
                admin: req.session.user
            }
        );


    } catch (err) {

        console.error(
            "ADMIN DASHBOARD ERROR:",
            err
        );

        res.status(500).send(
            "Error loading admin dashboard"
        );
    }

};


// ==========================================
// MANAGE POSTS
// ADMIN + EDITOR
// ==========================================

exports.posts = async (req, res) => {

    try {

        const search =
            req.query.search || "";


        const category =
            req.query.category || "";


        const page = Math.max(
            parseInt(
                req.query.page,
                10
            ) || 1,
            1
        );


        const limit = 10;


        const offset =
            (page - 1) * limit;


        // Categories

        const categories =
            await categoryService
                .getAllCategories();


        // Filters

        const whereConditions = [];

        const values = [];


        if (search) {

            values.push(
                `%${search}%`
            );


            whereConditions.push(`
                (
                    p.title ILIKE $${values.length}
                    OR p.content ILIKE $${values.length}
                    OR p.author ILIKE $${values.length}
                )
            `);
        }


        if (category) {

            values.push(category);


            whereConditions.push(
                `p.category_id = $${values.length}`
            );
        }


        const whereClause =
            whereConditions.length
                ? `WHERE ${whereConditions.join(" AND ")}`
                : "";


        // Count

        const countResult =
            await pool.query(
                `
                SELECT COUNT(*)
                FROM posts p
                ${whereClause}
                `,
                values
            );


        const totalPosts =
            parseInt(
                countResult.rows[0].count,
                10
            );


        const totalPages =
            Math.ceil(
                totalPosts / limit
            );


        // Posts

        const postValues = [
            ...values,
            limit,
            offset
        ];


        const result =
            await pool.query(
                `
                SELECT
                    p.*,
                    c.name AS category_name

                FROM posts p

                LEFT JOIN categories c
                    ON p.category_id = c.id

                ${whereClause}

                ORDER BY p.created_at DESC

                LIMIT $${postValues.length - 1}

                OFFSET $${postValues.length}
                `,
                postValues
            );


        res.render(
            "admin/posts",
            {
                posts: result.rows,
                search,
                category,
                categories,
                currentPage: page,
                totalPages,
                totalPosts
            }
        );


    } catch (err) {

        console.error(
            "ADMIN POSTS ERROR:",
            err
        );

        res.status(500).send(
            "Error loading posts"
        );
    }

};


// ==========================================
// TOGGLE FEATURED
// ==========================================

exports.toggleFeatured = async (req, res) => {

    try {

        // ==========================================
        // GET CURRENT FEATURED STATUS
        // ==========================================

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    title,
                    featured
                FROM posts
                WHERE id = $1
                `,
                [req.params.id]
            );


        if (
            result.rows.length === 0
        ) {

            req.flash(
                "error",
                "Post not found."
            );

            return res.redirect(
                req.get("Referer") ||
                "/admin/posts"
            );
        }


        const post =
            result.rows[0];


        // ==========================================
        // DETERMINE NEW STATUS
        // ==========================================

        const newStatus =
            !post.featured;


        // ==========================================
        // UPDATE FEATURED STATUS
        // ==========================================

        await postService.toggleFeatured(
            req.params.id
        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                newStatus
                    ? "POST_FEATURED"
                    : "POST_UNFEATURED",

            description:
                `Post "${post.title}" was ${
                    newStatus
                        ? "marked as featured"
                        : "removed from featured"
                }.`,


            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        res.redirect(
            req.get("Referer") ||
            "/admin/posts"
        );


    } catch (err) {

        console.error(
            "TOGGLE FEATURED ERROR:",
            err
        );

        res.status(500).send(
            "Unable to update featured status."
        );
    }

};

// ==========================================
// TOGGLE BREAKING
// ==========================================

exports.toggleBreaking = async (req, res) => {

    try {

        // ==========================================
        // GET CURRENT BREAKING STATUS
        // ==========================================

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    title,
                    breaking
                FROM posts
                WHERE id = $1
                `,
                [req.params.id]
            );


        if (
            result.rows.length === 0
        ) {

            req.flash(
                "error",
                "Post not found."
            );

            return res.redirect(
                req.get("Referer") ||
                "/admin/posts"
            );
        }


        const post =
            result.rows[0];


        // ==========================================
        // DETERMINE NEW STATUS
        // ==========================================

        const newStatus =
            !post.breaking;


        // ==========================================
        // UPDATE BREAKING STATUS
        // ==========================================

        await postService.toggleBreaking(
            req.params.id
        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                newStatus
                    ? "POST_BREAKING"
                    : "POST_NOT_BREAKING",

            description:
                `Post "${post.title}" was ${
                    newStatus
                        ? "marked as breaking news"
                        : "removed from breaking news"
                }.`,


            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        res.redirect(
            req.get("Referer") ||
            "/admin/posts"
        );


    } catch (err) {

        console.error(
            "TOGGLE BREAKING ERROR:",
            err
        );

        res.status(500).send(
            "Unable to update breaking news status."
        );
    }

};


// ==========================================
// DELETE POST
// ==========================================

exports.deletePost = async (req, res) => {

    try {

        await postService.deletePost(
            req.params.id
        );

        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                "POST_DELETED",

            description:
                `Post ID ${req.params.id} was deleted.`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });

        res.redirect(
            "/admin"
        );

    } catch (err) {

        console.error(
            "DELETE POST ERROR:",
            err
        );

        res.status(500).send(
            "Unable to delete post."
        );

    }

};

// ==========================================
// USERS
// ==========================================

exports.users = async (req, res) => {

    try {

        const result =
            await pool.query(`
                SELECT
                    id,
                    fullname,
                    email,
                    role

                FROM users

                ORDER BY id ASC
            `);


        res.render(
            "admin/users",
            {
                users: result.rows,
                admin: req.session.user
            }
        );


    } catch (err) {

        console.error(
            "GET USERS ERROR:",
            err
        );

        res.status(500).send(
            "Unable to load users."
        );
    }

};


// ==========================================
// CREATE USER PAGE
// ==========================================

exports.createUserPage = (req, res) => {

    res.render(
        "admin/create-user",
        {
            admin: req.session.user
        }
    );

};


// ==========================================
// CREATE USER
// ==========================================

exports.createUser = async (req, res) => {

    try {

        const {
            fullname,
            email,
            password,
            role
        } = req.body;


        if (
            !fullname ||
            !email ||
            !password ||
            !role
        ) {

            req.flash(
                "error",
                "All fields are required."
            );

            return res.redirect(
                "/admin/users/create"
            );
        }


        // Only these roles can be
        // created from this form

        if (
            ![
                "editor",
                "journalist"
            ].includes(role)
        ) {

            req.flash(
                "error",
                "Invalid user role."
            );

            return res.redirect(
                "/admin/users/create"
            );
        }


        const existingUser =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE email = $1
                `,
                [email]
            );


        if (
            existingUser.rows.length > 0
        ) {

            req.flash(
                "error",
                "A user with that email already exists."
            );

            return res.redirect(
                "/admin/users/create"
            );
        }


        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        const newUser =
            await pool.query(
                `
                INSERT INTO users
                (
                    fullname,
                    email,
                    password,
                    role
                )

                VALUES
                ($1, $2, $3, $4)

                RETURNING id
                `,
                [
                    fullname,
                    email,
                    hashedPassword,
                    role
                ]
            );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                "USER_CREATED",

            description:
                `User "${email}" was created with role "${role}".`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        req.flash(
            "success",
            "User created successfully."
        );


        res.redirect(
            "/admin/users"
        );


    } catch (err) {

        console.error(
            "CREATE USER ERROR:",
            err
        );


        if (err.code === "23505") {

            req.flash(
                "error",
                "A user with that email already exists."
            );

            return res.redirect(
                "/admin/users/create"
            );
        }


        res.status(500).send(
            "Unable to create user."
        );
    }

};


// ==========================================
// EDIT USER PAGE
// ==========================================

exports.editUserPage = async (req, res) => {

    try {

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    fullname,
                    email,
                    role

                FROM users

                WHERE id = $1
                `,
                [req.params.id]
            );


        const user =
            result.rows[0];


        if (!user) {

            return res.status(404).send(
                "User not found."
            );
        }


        res.render(
            "admin/edit-user",
            {
                user,
                admin: req.session.user
            }
        );


    } catch (err) {

        console.error(
            "EDIT USER PAGE ERROR:",
            err
        );

        res.status(500).send(
            "Unable to load user."
        );
    }

};


// ==========================================
// UPDATE USER
// ==========================================

exports.updateUser = async (req, res) => {

    try {

        const {
            fullname,
            email,
            role,
            password
        } = req.body;


        if (
            !fullname ||
            !email ||
            !role
        ) {

            req.flash(
                "error",
                "Full name, email and role are required."
            );

            return res.redirect(
                `/admin/users/${req.params.id}/edit`
            );
        }


        if (
            ![
                "admin",
                "editor",
                "journalist"
            ].includes(role)
        ) {

            req.flash(
                "error",
                "Invalid role."
            );

            return res.redirect(
                `/admin/users/${req.params.id}/edit`
            );
        }


        // Prevent current admin
        // from removing their own admin role

        if (
            Number(req.params.id) ===
            Number(req.session.user.id)
        ) {

            if (role !== "admin") {

                return res.status(403).send(
                    "You cannot remove your own admin role."
                );
            }
        }


        // Check duplicate email

        const emailCheck =
            await pool.query(
                `
                SELECT id
                FROM users

                WHERE email = $1
                AND id != $2
                `,
                [
                    email,
                    req.params.id
                ]
            );


        if (
            emailCheck.rows.length > 0
        ) {

            req.flash(
                "error",
                "That email is already being used."
            );

            return res.redirect(
                `/admin/users/${req.params.id}/edit`
            );
        }


        // Password changed

        if (
            password &&
            password.trim() !== ""
        ) {

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            await pool.query(
                `
                UPDATE users

                SET
                    fullname = $1,
                    email = $2,
                    role = $3,
                    password = $4

                WHERE id = $5
                `,
                [
                    fullname,
                    email,
                    role,
                    hashedPassword,
                    req.params.id
                ]
            );


        } else {

            // Password unchanged

            await pool.query(
                `
                UPDATE users

                SET
                    fullname = $1,
                    email = $2,
                    role = $3

                WHERE id = $4
                `,
                [
                    fullname,
                    email,
                    role,
                    req.params.id
                ]
            );
        }


        req.flash(
            "success",
            "User updated successfully."
        );


        res.redirect(
            "/admin/users"
        );


    } catch (err) {

        console.error(
            "UPDATE USER ERROR:",
            err
        );


        if (err.code === "23505") {

            req.flash(
                "error",
                "That email is already being used."
            );

            return res.redirect(
                `/admin/users/${req.params.id}/edit`
            );
        }


        res.status(500).send(
            "Unable to update user."
        );
    }

};


// ==========================================
// CHANGE USER ROLE
// ==========================================

exports.updateUserRole = async (req, res) => {

    try {

        const {
            role
        } = req.body;


        if (
            ![
                "admin",
                "editor",
                "journalist"
            ].includes(role)
        ) {

            return res.status(400).send(
                "Invalid role."
            );
        }


        if (
            Number(req.params.id) ===
            Number(req.session.user.id) &&
            role !== "admin"
        ) {

            return res.status(403).send(
                "You cannot remove your own admin role."
            );
        }


        // ==========================================
        // GET CURRENT ROLE
        // ==========================================

        const currentUser =
            await pool.query(
                `
                SELECT
                    id,
                    fullname,
                    email,
                    role
                FROM users
                WHERE id = $1
                `,
                [
                    req.params.id
                ]
            );


        if (
            currentUser.rows.length === 0
        ) {

            return res.status(404).send(
                "User not found."
            );

        }


        const oldRole =
            currentUser.rows[0].role;


        // ==========================================
        // UPDATE ROLE
        // ==========================================

        await pool.query(
            `
            UPDATE users

            SET role = $1

            WHERE id = $2
            `,
            [
                role,
                req.params.id
            ]
        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                "ROLE_CHANGED",

            description:
                `Role for user "${currentUser.rows[0].email}" changed from "${oldRole}" to "${role}".`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        req.flash(
            "success",
            "User role updated successfully."
        );


        res.redirect(
            "/admin/users"
        );


    } catch (err) {

        console.error(
            "UPDATE USER ROLE ERROR:",
            err
        );

        res.status(500).send(
            "Unable to update user role."
        );
    }

};


// ==========================================
// DELETE USER
// ==========================================

exports.deleteUser = async (req, res) => {

    try {

        const userId =
            Number(req.params.id);


        // Prevent deleting yourself

        if (
            userId ===
            Number(req.session.user.id)
        ) {

            req.flash(
                "error",
                "You cannot delete your own account."
            );

            return res.redirect(
                "/admin/users"
            );
        }


        // ==========================================
        // GET USER BEFORE DELETION
        // ==========================================

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    fullname,
                    email,
                    role
                FROM users
                WHERE id = $1
                `,
                [userId]
            );


        if (
            result.rows.length === 0
        ) {

            req.flash(
                "error",
                "User not found."
            );

            return res.redirect(
                "/admin/users"
            );
        }


        const deletedUser =
            result.rows[0];


        // ==========================================
        // DELETE USER
        // ==========================================

        await pool.query(
            `
            DELETE FROM users
            WHERE id = $1
            `,
            [userId]
        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                "USER_DELETED",

            description:
                `User "${deletedUser.email}" with role "${deletedUser.role}" was deleted.`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        req.flash(
            "success",
            "User deleted successfully."
        );


        res.redirect(
            "/admin/users"
        );


    } catch (err) {

        console.error(
            "DELETE USER ERROR:",
            err
        );

        res.status(500).send(
            "Unable to delete user."
        );
    }

};