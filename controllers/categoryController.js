
const categoryService = require("../services/categoryService");
const postService = require("../services/postService");

exports.singleCategory = async (req, res) => {

    try {

        const slug = req.params.slug;

        // Find the category
        const category =
            await categoryService.getCategoryBySlug(slug);

        if (!category) {

            return res.status(404).render("404");

        }

        // Current page
        const currentPage = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        // Articles per page
        const limit = 10;

        // Calculate database offset
        const offset =
            (currentPage - 1) * limit;

        // Get category posts
        const posts =
            await categoryService.getCategoryPosts(
                slug,
                limit,
                offset
            );

        // Get total category posts
        const postCount =
            await categoryService.getCategoryPostCount(
                slug
            );

        // Calculate total pages
        const totalPages =
            Math.ceil(postCount / limit);

        // Homepage features
        const featured =
            await postService.getFeaturedPosts();

        const breaking =
            await postService.getBreakingPosts();

        const trending =
            await postService.getTrendingPosts();

        res.render("category", {

            posts,

            category: category.name,

            categorySlug: category.slug,

            postCount,

            featured,

            breaking,

            trending,

            currentPage,

            totalPages

        });

    } catch (err) {

        console.error(err);

        res.status(500).send(
            "Error loading category."
        );

    }

};

