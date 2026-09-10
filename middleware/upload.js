
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fileTypeFromFile } = require("file-type");


const uploadDirectory = path.join(
    __dirname,
    "../public/uploads"
);

// Make sure upload directory exists
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, uploadDirectory);

    },

    filename(req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);

    }

});

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif"
];

const fileFilter = (req, file, cb) => {

    const extension =
        path.extname(file.originalname).toLowerCase();

    const mimeType =
        file.mimetype.toLowerCase();

    if (
        allowedMimeTypes.includes(mimeType) &&
        allowedExtensions.includes(extension)
    ) {

        return cb(null, true);

    }

    return cb(
        new Error(
            "Only JPG, PNG, WEBP and GIF images are allowed."
        ),
        false
    );

};

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }

});

// Verify the actual contents of the uploaded file
const verifyImageFile = async (req, res, next) => {

    try {

        // No file uploaded
        if (!req.file) {
            return next();
        }

        const detectedType =
            await fileTypeFromFile(req.file.path);

        const detectedMime =
            detectedType?.mime;

        const detectedExtension =
            detectedType
                ? `.${detectedType.ext}`
                : null;

        const validMime =
            allowedMimeTypes.includes(detectedMime);

        const validExtension =
            allowedExtensions.includes(detectedExtension);

        if (!validMime || !validExtension) {

            // Delete suspicious upload
            await fs.promises.unlink(req.file.path);

            return res.status(400).send(
                "Invalid image file. The uploaded file content does not match an allowed image type."
            );

        }

        // Make sure the detected content matches
        // what the browser claimed
        if (
            detectedMime !== req.file.mimetype.toLowerCase()
        ) {

            await fs.promises.unlink(req.file.path);

            return res.status(400).send(
                "Invalid image file type."
            );

        }

        next();

    } catch (err) {

        console.error(
            "IMAGE VALIDATION ERROR:",
            err
        );

        // Remove file if validation itself fails
        if (req.file?.path) {

            try {

                await fs.promises.unlink(
                    req.file.path
                );

            } catch (unlinkError) {

                console.error(
                    "UPLOAD CLEANUP ERROR:",
                    unlinkError
                );

            }

        }

        next(
            new Error(
                "Unable to validate uploaded image."
            )
        );

    }

};

module.exports = upload;
module.exports.verifyImageFile = verifyImageFile;
