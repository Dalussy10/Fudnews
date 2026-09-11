
require("dotenv").config();
const pool = require("./config/db");
const express = require("express");
const path = require("path");
const session = require("express-session");
const compression = require("compression");
const flash = require("connect-flash");
const morgan = require("morgan");
const helmet = require("helmet");

if (!process.env.SESSION_SECRET) {

    console.error(
        "SESSION_SECRET is missing from .env"
    );

    process.exit(1);

}
const {
    csrfSynchronisedProtection,
    generateToken
} = require("./middleware/csrf");


const categoryService = require("./services/categoryService");
const errorHandler = require("./middleware/errorHandler");
const postRoutes = require("./routes/postRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();


// ==========================================
// VIEW ENGINE
// ==========================================

app.set("view engine", "ejs");


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(compression());

// ==========================================
// SECURITY HEADERS
// ==========================================

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

// ==========================================
// REQUEST LOGGER
// ==========================================

app.use(
    morgan(
        process.env.NODE_ENV === "production"
            ? "combined"
            : "dev"
    )
);

// ==========================================
// SESSION
// ==========================================

app.set("trust proxy", 1);

app.use(
    session({
        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        name: "fudnews.sid",

        cookie: {
            httpOnly: true,

            secure: process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge: 1000 * 60 * 60 * 8
        }
    })
);
// ==========================================
// FLASH MESSAGES
// ==========================================

app.use(flash());

// ==========================================
// GLOBAL USER
// ==========================================
app.use((req, res, next) => {

    res.locals.currentUser =
        req.session.user || null;

    next();

});
app.use((req, res, next) => {

    res.locals.csrfToken =
        generateToken(req);

    next();

});

app.use((req, res, next) => {

    res.locals.messages = {
        success: req.flash("success"),
        error: req.flash("error")
    };

    next();

});

// ==========================================
// GLOBAL CATEGORIES
// ==========================================

app.use(async (req, res, next) => {

    try {

        res.locals.categories =
            await categoryService.getAllCategories();

    } catch (err) {

        console.error(
            "Category loading error:",
            err
        );

        res.locals.categories = [];

    }

    next();

});



// ==========================================
// ROUTES
// ==========================================

// Posts
app.use("/", postRoutes);



// Categories
app.use("/category", categoryRoutes);


// Admin
app.use("/admin", adminRoutes);


// Comments
app.use("/", commentRoutes);

// ==========================================
// UPLOAD ERROR HANDLER
// ==========================================

app.use(
    require("./middleware/uploadErrorHandler")
);

app.use(
    require("./middleware/errorHandler")
);
// ==========================================
// 404 - PAGE NOT FOUND
// ==========================================

app.use((req, res) => {

    res.status(404).render("404");

});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(errorHandler);

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

pool.query("SELECT NOW()")
    .then(() => {
        console.log("PostgreSQL database connected successfully");
    })
    .catch((err) => {
        console.error(
            "PostgreSQL connection failed:",
            err.message
        );
    });

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const shutdown = async (signal) => {

    console.log(
        `${signal} received. Shutting down...`
    );

    server.close(async () => {

        console.log(
            "HTTP server closed."
        );

        try {

            await pool.end();

            console.log(
                "PostgreSQL pool closed."
            );

            process.exit(0);

        } catch (err) {

            console.error(
                "Error closing PostgreSQL pool:",
                err
            );

            process.exit(1);

        }

    });

};


// ==========================================
// SHUTDOWN SIGNALS
// ==========================================

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

