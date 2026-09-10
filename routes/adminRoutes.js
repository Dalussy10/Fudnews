const express = require("express");



const {
    loginLimiter
} = require("../middleware/rateLimiter");


const router = express.Router();

const {
    csrfSynchronisedProtection
} = require("../middleware/csrf");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const upload = require("../middleware/upload");

const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const adminController = require("../controllers/adminController");
const userValidator = require("../middleware/userValidator");
const validate = require("../middleware/validate");
const editUserValidator = require("../middleware/editUserValidator");

// ==========================================
// ADMIN LOGIN
// ==========================================

router.get(
    "/login",
    adminController.loginPage
);

router.post(
    "/login",
    loginLimiter,
    csrfSynchronisedProtection,
    adminController.login
);

// ==========================================
// ADMIN LOGOUT
// ==========================================

router.get(
    "/logout",
    adminController.logout
);


// ==========================================
// ADMIN DASHBOARD
// ADMIN ONLY
// ==========================================

router.get(
    "/",
    auth,
    requireRole("admin"),
    adminController.dashboard
);


// ==========================================
// MANAGE POSTS
// ADMIN + EDITOR
// ==========================================

router.get(
    "/posts",
    auth,
    requireRole("admin", "editor"),
    adminController.posts
);


// ==========================================
// FEATURED
// ADMIN ONLY
// ==========================================


router.post(
    "/posts/:id/featured",
    auth,
    requireRole("admin"),
    csrfSynchronisedProtection,
    adminController.toggleFeatured
);



// ==========================================
// BREAKING NEWS
// ADMIN ONLY
// ==========================================

router.post(

    "/posts/:id/breaking",

    auth,

    requireRole("admin"),

    csrfSynchronisedProtection,

    adminController.toggleBreaking

);

// ==========================================
// EDIT POST
// ADMIN + EDITOR
// ==========================================

router.get(

    "/posts/:id/edit",

    auth,

    requireRole("admin", "editor"),

    postController.editPage

);

router.post(
    "/posts/:id/edit",

    auth,

    requireRole("admin", "editor"),

    upload.single("image"),

    csrfSynchronisedProtection,

    postController.updatePost

);

// ==========================================
// DELETE POST
// ADMIN ONLY
// ==========================================


router.post(
    "/posts/:id/delete",
    auth,
    requireRole("admin"),
    csrfSynchronisedProtection,
    adminController.deletePost
);

// ==========================================
// USER MANAGEMENT
// ADMIN ONLY
// ==========================================

// View users
router.get(
    "/users",
    auth,
    requireRole("admin"),
    adminController.users
);


// Create user page
router.get(
    "/users/create",
    auth,
    requireRole("admin"),
    adminController.createUserPage
);


// Create user
router.post(
    "/users/create",
    auth,
    requireRole("admin"),
    userValidator,
    validate,
    csrfSynchronisedProtection,
    adminController.createUser
);

// Edit user page
router.get(
    "/users/:id/edit",
    auth,
    requireRole("admin"),
    adminController.editUserPage
);


// Update user
router.post(
    "/users/:id/edit",
    auth,
    requireRole("admin"),
    editUserValidator,
    validate,
    csrfSynchronisedProtection,
    adminController.updateUser
);

// Change user role
router.post(
    "/users/:id/role",
    auth,
    requireRole("admin"),
    csrfSynchronisedProtection,
    adminController.updateUserRole
);

// Delete user
router.post(
    "/users/:id/delete",
    auth,
    requireRole("admin"),
    csrfSynchronisedProtection,
    adminController.deleteUser
);

module.exports = router;




