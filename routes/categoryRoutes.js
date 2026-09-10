
const express = require("express");

const router = express.Router();

const categoryController =
    require("../controllers/categoryController");

router.get(
    "/:slug",
    categoryController.singleCategory
);

module.exports = router;

