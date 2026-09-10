
const pool = require("../config/db");
const slugify = require("slugify");

// =====================================================
// GET ALL POSTS
// =====================================================

exports.getAllPosts = async (limit = 100, offset = 0) => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON p.category_id = c.id
        ORDER BY p.created_at DESC
        LIMIT $1
        OFFSET $2
        `,
        [limit, offset]
    );

    return result.rows;
};


// =====================================================
// GET POST BY ID
// =====================================================

exports.getPostById = async (id) => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON p.category_id = c.id
        WHERE p.id = $1
        `,
        [id]
    );

    return result.rows[0];
};


// =====================================================
// GET POST BY SLUG
// =====================================================

exports.getPostBySlug = async (slug) => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON p.category_id = c.id
        WHERE p.slug = $1
        `,
        [slug]
    );

    return result.rows[0];
};


// =====================================================
// CREATE POST
// =====================================================
exports.createPost = async (
    post,
    imagePath,
    authorId
) => {

    const slug = slugify(post.title, {
        lower: true,
        strict: true
    });

    const featured = post.featured === "true";
    const breaking = post.breaking === "true";

    const result = await pool.query(
        `
        INSERT INTO posts
        (
            title,
            category_id,
            author_id,
            author,
            content,
            image,
            slug,
            featured,
            breaking
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            post.title,
            post.category_id,
            authorId,
            post.author || "Fudnews",
            post.content,
            imagePath,
            slug,
            featured,
            breaking
        ]
    );

    return result.rows[0];
};

// =====================================================
// UPDATE POST
// =====================================================

exports.updatePost = async (
    id,
    post,
    imagePath
) => {

    const slug = slugify(post.title, {
        lower: true,
        strict: true
    });


const featured = post.featured === "true";
const breaking = post.breaking === "true";

    const result = await pool.query(
        `
        UPDATE posts
        SET
            title = $1,
            slug = $2,
            category_id = $3,
            content = $4,
            image = COALESCE($5, image),
            featured = $6,
            breaking = $7
        WHERE id = $8
        RETURNING *
        `,
        [
            post.title,
            slug,
            post.category_id,
            post.content,
            imagePath,
            featured,
            breaking,
            id
        ]
    );

    return result.rows[0];
};
// =====================================================
// DELETE POST
// =====================================================

exports.deletePost = async (id) => {

    await pool.query(
        `
        DELETE FROM posts
        WHERE id = $1
        `,
        [id]
    );

};


// =====================================================
// SEARCH POSTS
// =====================================================

exports.searchPosts = async (keyword) => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON c.id = p.category_id
        WHERE
            p.title ILIKE $1
            OR p.content ILIKE $1
            OR p.author ILIKE $1
        ORDER BY p.created_at DESC
        `,
        [`%${keyword}%`]
    );

    return result.rows;
};


// =====================================================
// INCREMENT POST VIEWS
// =====================================================

exports.incrementViews = async (id) => {

    await pool.query(
        `
        UPDATE posts
        SET views = views + 1
        WHERE id = $1
        `,
        [id]
    );

};


// =====================================================
// GET TRENDING POSTS
// =====================================================

exports.getTrendingPosts = async () => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON p.category_id = c.id
        ORDER BY
            p.views DESC,
            p.created_at DESC
        LIMIT 5
        `
    );

    return result.rows;
};


// =====================================================
// GET FEATURED POSTS
// =====================================================

exports.getFeaturedPosts = async () => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON p.category_id = c.id
        WHERE p.featured = true
        ORDER BY p.created_at DESC
        LIMIT 5
        `
    );

    return result.rows;
};


// =====================================================
// GET BREAKING POSTS
// =====================================================

exports.getBreakingPosts = async () => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c
            ON p.category_id = c.id
        WHERE p.breaking = true
        ORDER BY p.created_at DESC
        LIMIT 5
        `
    );

    return result.rows;
};


// =====================================================
// GET TOTAL NUMBER OF POSTS
// =====================================================

exports.getTotalPosts = async () => {

    const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM posts
        `
    );

    return parseInt(
        result.rows[0].count,
        10
    );

};

// =====================================================
// TOGGLE FEATURED
// =====================================================

exports.toggleFeatured = async (id) => {

    const result = await pool.query(
        `
        UPDATE posts
        SET featured = NOT featured
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};


// =====================================================
// TOGGLE BREAKING NEWS
// =====================================================

exports.toggleBreaking = async (id) => {

    const result = await pool.query(
        `
        UPDATE posts
        SET breaking = NOT breaking
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};
