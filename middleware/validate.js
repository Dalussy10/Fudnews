const { validationResult } = require("express-validator");
const postService = require("../services/postService");
const categoryService = require("../services/categoryService");

module.exports = async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        const posts = await postService.getAllPosts();

        const categories = await categoryService.getAllCategories();

        return res.status(400).render("compose", {
            errors: errors.array(),
            old: req.body,
            posts,
            categories
        });

    }

    next();

};