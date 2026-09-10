const pool = require("../config/db");

exports.createComment = async (
    postId,
    userId,
    fullname,
    comment
) => {

    const result = await pool.query(
        `
        INSERT INTO comments
        (
            post_id,
            user_id,
            fullname,
            comment
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `,
        [
            postId,
            userId || null,
            fullname,
            comment
        ]
    );

    return result.rows[0];
};


exports.getCommentsByPost = async (postId) => {

    const result = await pool.query(
        `
        SELECT
            c.id,
            c.comment,
            c.created_at,
            COALESCE(c.fullname, u.fullname, 'Anonymous') AS fullname
        FROM comments c
        LEFT JOIN users u
            ON c.user_id = u.id
        WHERE c.post_id = $1
        AND c.approved = true
        ORDER BY c.created_at DESC
        `,
        [postId]
    );

    return result.rows;
};