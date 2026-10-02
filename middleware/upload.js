
const multer = require("multer");
const path = require("path");
const { fileTypeFromBuffer } = require("file-type");


const uploadDirectory = path.join(
    __dirname,
    "../public/uploads"
);

const storage = multer.memoryStorage();

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
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    if (
        allowedMimeTypes.includes(mimeType) &&
        allowedExtensions.includes(extension)
    ) {
        return cb(null, true);
    }

    return cb(
        new Error("Only JPG, PNG, WEBP and GIF images are allowed."),
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


const verifyImageFile = async (req, res, next) => {
    try {
        
        if (!req.file) {
            return next();
        }

        
        const detectedType = await fileTypeFromBuffer(req.file.buffer);

        const detectedMime = detectedType?.mime;

        const detectedExtension = detectedType
            ? `.${detectedType.ext}`
            : null;

        const validMime =
            allowedMimeTypes.includes(detectedMime);

        const validExtension =
            allowedExtensions.includes(detectedExtension);

        if (!validMime || !validExtension) {
            return res.status(400).send(
                "Invalid image file. The uploaded file content does not match an allowed image type."
            );
        }

        
        if (
            detectedMime !== req.file.mimetype.toLowerCase()
        ) {
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

        next(
            new Error(
                "Unable to validate uploaded image."
            )
        );
    }
};

module.exports = upload;
module.exports.verifyImageFile = verifyImageFile;
