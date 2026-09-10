
const postService = require("../services/postService");
const categoryService = require("../services/categoryService");
const commentService = require("../services/commentService");

const sanitizeHtml = require("sanitize-html");
const {
    createAuditLog
} = require("../services/auditLogService");

// ==========================================
// HOME
// ==========================================

exports.home = async (req, res) => {

    try {

        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        const limit = 10;

        const offset =
            (page - 1) * limit;


        // Main posts

        const posts =
            await postService.getAllPosts(
                limit,
                offset
            );


        // Sidebar posts

        const sidePosts =
            await postService.getAllPosts(
                5,
                10
            );


        // Trending

        const trending =
            await postService.getTrendingPosts();


        // Featured

        const featured =
            await postService.getFeaturedPosts();


        // Breaking news

        const breaking =
            await postService.getBreakingPosts();


        res.render("Home", {

            posts,

            sidePosts,

            trending,

            featured,

            breaking,

            currentPage: page,

            totalPages: 1

        });


    } catch (err) {

        console.error(
            "Home error:",
            err
        );


        res.render("Home", {

            posts: [],

            sidePosts: [],

            trending: [],

            featured: [],

            breaking: [],

            currentPage: 1,

            totalPages: 1

        });

    }

};


// ==========================================
// COMPOSE PAGE
// ==========================================

exports.composePage = async (req, res) => {

    try {

        const posts =
            await postService.getAllPosts();


        const categories =
            await categoryService.getAllCategories();


        res.render("compose", {

            posts,

            categories,

            old: {},

            errors: []

        });


    } catch (err) {

        console.error(
            "Compose page error:",
            err
        );

        res.redirect("/");

    }

};

// ==========================================
// EDIT PAGE
// ==========================================

exports.editPage = async (req, res) => {

    try {

        const post =
            await postService.getPostById(
                req.params.id
            );

        if (!post) {

            return res.status(404).send(
                "Post not found."
            );

        }

        res.render(
            "admin/edit-post",
            {
                post
            }
        );

    } catch (err) {

        console.error(
            "EDIT PAGE ERROR:",
            err
        );

        res.status(500).send(
            "Unable to load edit page."
        );

    }

};


// ==========================================
// EDIT PAGE
// ==========================================

exports.createPost = async (req, res) => {

    try {

        const imagePath =
            req.file
                ? `/uploads/${req.file.filename}`
                : null;


        await postService.createPost(

            req.body,

            imagePath,

            req.session.user.id

        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user.id,

            action:
                "POST_CREATED",

            description:
                `Post "${req.body.title}" was created.`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        res.redirect("/");


    } catch (err) {

        console.error(
            "Create post error:",
            err
        );

        res.status(500).send(
            err.message
        );

    }

};

// ==========================================
// UPDATE POST
// ==========================================

exports.updatePost = async (req, res) => {

    try {

        const imagePath = req.file
            ? `/uploads/${req.file.filename}`
            : null;


        const cleanContent = sanitizeHtml(
            req.body.content,
            {
                allowedTags:
                    sanitizeHtml.defaults.allowedTags.concat([
                        "img",
                        "h1",
                        "h2",
                        "h3"
                    ]),

                allowedAttributes: {
                    a: ["href", "target"],
                    img: ["src", "alt"]
                }
            }
        );


        req.body.content = cleanContent;


        await postService.updatePost(
            req.params.id,
            req.body,
            imagePath
        );


        // ==========================================
        // AUDIT LOG
        // ==========================================

        await createAuditLog({

            userId:
                req.session.user?.id || null,

            action:
                "POST_UPDATED",

            description:
                `Post ID ${req.params.id} was updated.`,

            ipAddress:
                req.ip,

            userAgent:
                req.get("user-agent")

        });


        res.redirect("/admin/posts");


    } catch (err) {

        console.error(
            "UPDATE POST ERROR:",
            err
        );

        res.status(500).send(
            "Unable to update post."
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

        res.redirect("/");

    } catch (err) {

        console.error(
            "Delete post error:",
            err
        );

        res.status(500).send(
            err.message
        );

    }

};

// ==========================================
// SEARCH
// ==========================================

exports.searchPosts = async (req, res) => {

    try {

        const keyword = req.query.q || "";

        const posts = await postService.searchPosts(keyword);

        // Live search request
        if (req.xhr || req.headers.accept?.includes("application/json")) {

            return res.json(posts);

        }

        // Normal search page
        res.render("search", {

            posts,

            search: keyword

        });

    } catch (err) {

        console.error(
            "Search error:",
            err
        );

        // Return JSON error for live search
        if (
            req.xhr ||
            req.headers.accept?.includes("application/json")
        ) {

            return res.status(500).json([]);

        }

        res.render("search", {

            posts: [],

            search: req.query.q || ""

        });

    }

};

// ==========================================
// SINGLE POST
// ==========================================

exports.singlePost = async (req, res) => {

    try {

        const post =
            await postService.getPostBySlug(
                req.params.slug
            );


        if (!post) {

            return res.redirect("/");

        }


        // Increase view count

        await postService.incrementViews(
            post.id
        );


        // Load comments

        const comments =
            await commentService.getCommentsByPost(
                post.id
            );


        res.render("post", {

            post,

            comments

        });


    } catch (err) {

        console.error(
            "Single post error:",
            err
        );

        res.redirect("/");

    }

};

