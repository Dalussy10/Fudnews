const { body } = require("express-validator");

module.exports = [

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 5, max: 200 }),

    body("content")
        .trim()
        .notEmpty()
        .withMessage("Content is required"),

   body("category_id")
    .notEmpty()
    .withMessage("Category is required")
    .isInt()
    .withMessage("Invalid category"),

    body("author")
        .optional()
        .trim()
        .isLength({ max: 100 })

];