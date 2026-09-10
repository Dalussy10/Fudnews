const { body } = require("express-validator");

const userValidator = [

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

    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),

    body("role")
        .trim()
        .isIn([
            "admin",
            "editor",
            "journalist"
        ])
        .withMessage("Invalid user role.")

];

module.exports = userValidator;