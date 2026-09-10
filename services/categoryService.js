
const pool = require("../config/db");

// =====================================================
// GET ALL CATEGORIES
// =====================================================

exports.getAllCategories = async () => {

    const result = await pool.query(
        `
        SELECT
            id,
            name,
            slug,
            created_at
        FROM categories
        ORDER BY name ASC
        `
    );

    return result.rows;
};


// =====================================================
// GET CATEGORY BY SLUG
// =====================================================

exports.getCategoryBySlug = async (slug) => {

    const result = await pool.query(
        `
        SELECT
            id,
            name,
            slug,
            created_at
        FROM categories
        WHERE slug = $1
        `,
        [slug]
    );

    return result.rows[0];
};


// =====================================================
// GET POSTS BY CATEGORY
// =====================================================

exports.getCategoryPosts = async (
    slug,
    limit = 10,
    offset = 0
) => {

    const result = await pool.query(
        `
        SELECT
            p.*,
            c.name AS category_name,
            c.slug AS category_slug
        FROM posts p
        INNER JOIN categories c
            ON p.category_id = c.id
        WHERE c.slug = $1
        ORDER BY p.created_at DESC
        LIMIT $2
        OFFSET $3
        `,
        [slug, limit, offset]
    );

    return result.rows;
};


// =====================================================
// GET TOTAL POSTS IN CATEGORY
// =====================================================

exports.getCategoryPostCount = async (slug) => {

    const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM posts p
        INNER JOIN categories c
            ON p.category_id = c.id
        WHERE c.slug = $1
        `,
        [slug]
    );

    return parseInt(
        result.rows[0].count,
        10
    );
};

