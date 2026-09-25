import multer from 'multer';
import AppError from '../utils/appError.js';


const storage = multer.memoryStorage();  // store file in RAM buffer

// Strict MIME type filter for images
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Invalid file type. Only images (JPEG, PNG, WEBP) are allowed for thumbnails.', 422),
            false
        );
    }
};

// Export configured Multer middleware with a 2MB limit
export const uploadThumbnail = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
    }
});