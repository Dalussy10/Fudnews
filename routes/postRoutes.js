const express = require("express");

const router = express.Router();
const {
    csrfSynchronisedProtection
} = require("../middleware/csrf");

const auth = require("../middleware/auth");
const postController = require("../controllers/postController");
const postValidator = require("../middleware/postValidator");
const validate = require("../middleware/validate");
const { requireRole } = require("../middleware/roles");
const upload = require("../middleware/upload");
const { verifyImageFile } = require("../middleware/upload");


// ===============================
// HOME
// ===============================

router.get(
    "/",
    postController.home
);


// ===============================
// SINGLE POST
// ===============================

router.get(
    "/post/:slug",
    postController.singlePost
);


// ===============================
// COMPOSE
// ===============================

router.get(
    "/compose",
    auth,
    requireRole("admin", "editor", "journalist"),
    postController.composePage
);


router.post(
    "/compose",
    auth,
    requireRole("admin", "editor", "journalist"),
    upload.single("image"),
    verifyImageFile,
    csrfSynchronisedProtection,
    postValidator,
    validate,
    postController.createPost

);
// ===============================
// SEARCH
// ===============================

router.get(
    "/search",
    postController.searchPosts
);  


module.exports = router;



