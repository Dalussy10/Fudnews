const pool = require("../config/db");

const commentService =
    require("../services/commentService");

const postService =
    require("../services/postService");

const {
    createAuditLog
} = require("../services/auditLogService");

exports.createComment = async (req, res) => {

    try {

        const {
            fullname,
            comment
        } = req.body;


        if (!fullname || !comment) {

            return res.status(400).send(
                "Name and comment are required."
            );

        }


        await commentService.createComment(

            req.params.id,

            null,

            fullname,

            comment

        );


        const post =
            await postService.getPostById(
                req.params.id
            );


        if (!post) {

            return res.status(404).send(
                "Post not found"
            );

        }


        res.redirect(
            "/post/" + post.slug
        );


    } catch (err) {

        console.error(
            "COMMENT ERROR:",
            err
        );

        res.status(500).send(
            "Unable to post comment."
        );

    }

};

// ==========================================
// ADMIN - GET ALL COMMENTS
// ==========================================

exports.getAllComments = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                c.id,
                c.comment,
                c.fullname,
                c.approved,
                c.created_at,
                p.id AS post_id,
                p.slug AS post_slug,
                p.title AS post_title

            FROM comments c

            LEFT JOIN posts p
                ON c.post_id = p.id

            ORDER BY c.created_at DESC
        `);

        res.render("admin/comments", {

            comments: result.rows

        });

    } catch (err) {

        console.error(
            "GET COMMENTS ERROR:",
            err
        );

        res.status(500).send(
            "Unable to load comments."
        );

    }

};

// ==========================================
// ADMIN - TOGGLE COMMENT APPROVAL
// ==========================================

exports.toggleApproval = async (req, res) => {

    try {

        // ==========================================
        // GET CURRENT COMMENT STATUS
        // ==========================================

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    fullname,
                    approved
                FROM comments
                WHERE id = $1
                `,
                [req.params.id]
            );


        if (
            result.rows.length === 0
        ) {

            req.flash(
                "error",
                "Comment not found."
            );

            return res.redirect(
                req.get("Referer") ||
                "/admin/comments"
            );

        }


        const comment =
            result.rows[0];


        // ==========================================
        // TOGGLE APPROVAL
        // ==========================================

        const newStatus =
            !comment.approved;


        await pool.query(
            `
            UPDATE comments
            SET approved = $1
            WHERE id = $2
            `,
            [
                newStatus,
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
                newStatus
                    ? "COMMENT_APPROVED"
                    : "COMMENT_UNAPPROVED",

            description:
                `Comment ID ${comment.id} by "${comment.fullname}" was ${
                    newStatus
                        ? "approved"
                        : "unapproved"
                }.`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        res.redirect(
            req.get("Referer") ||
            "/admin/comments"
        );


    } catch (err) {

        console.error(
            "TOGGLE COMMENT ERROR:",
            err
        );

        res.status(500).send(
            "Unable to update comment."
        );

    }

};

// ==========================================
// ADMIN - DELETE COMMENT
// ==========================================

exports.deleteComment = async (req, res) => {

    try {

        // ==========================================
        // GET COMMENT BEFORE DELETION
        // ==========================================

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    fullname,
                    comment
                FROM comments
                WHERE id = $1
                `,
                [req.params.id]
            );


        if (
            result.rows.length === 0
        ) {

            req.flash(
                "error",
                "Comment not found."
            );

            return res.redirect(
                req.get("Referer") ||
                "/admin/comments"
            );

        }


        const deletedComment =
            result.rows[0];


        // ==========================================
        // DELETE COMMENT
        // ==========================================

        await pool.query(
            `
            DELETE FROM comments
            WHERE id = $1
            `,
            [req.params.id]
        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                "COMMENT_DELETED",

            description:
                `Comment ID ${deletedComment.id} by "${deletedComment.fullname}" was deleted.`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        res.redirect(
            req.get("Referer") ||
            "/admin/comments"
        );


    } catch (err) {

        console.error(
            "DELETE COMMENT ERROR:",
            err
        );

        res.status(500).send(
            "Unable to delete comment."
        );

    }

};