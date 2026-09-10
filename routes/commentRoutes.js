const express = require("express");

const router = express.Router();

const {
    csrfSynchronisedProtection
} = require("../middleware/csrf");

const auth =
    require("../middleware/auth");

const { requireRole } =
    require("../middleware/roles");

const commentController =
    require("../controllers/commentController");


// ==========================================
// PUBLIC - CREATE COMMENT
// ==========================================

router.post(
    "/post/:id/comment",
    csrfSynchronisedProtection,
    commentController.createComment
);


// ==========================================
// ADMIN - VIEW COMMENTS
// ==========================================

router.get(
    "/admin/comments",
    auth,
    requireRole("admin"),
    commentController.getAllComments
);


// ==========================================
// ADMIN - APPROVE / UNAPPROVE
// ==========================================
router.post(
    "/admin/comments/:id/toggle",
    auth,
    requireRole("admin"),
    csrfSynchronisedProtection,
    commentController.toggleApproval
);

// ==========================================
// ADMIN - DELETE COMMENT
// ==========================================

router.post(
    "/admin/comments/:id/delete",
    auth,
    requireRole("admin"),
    csrfSynchronisedProtection,
    commentController.deleteComment
);



module.exports = router;

