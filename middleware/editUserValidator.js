const { body } = require("express-validator");

const editUserValidator = [

    body("fullname")
        .trim()
        .notEmpty()
        .withMessage("Full name is required.")
        .isLength({ max: 150 })
        .withMessage("Full name is too long."),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Please enter a valid email address.")
        .normalizeEmail(),

    body("role")
        .trim()
        .isIn([
            "admin",
            "editor",
            "journalist"
        ])
        .withMessage("Invalid user role."),

    body("password")
        .optional({ values: "falsy" })
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long.")

];

module.exports = editUserValidator;