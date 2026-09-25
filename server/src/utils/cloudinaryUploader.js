import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import AppError from './appError.js';


/**
 * Streams an in-memory buffer to Cloudinaryand returns the secure HTTPS asset URL.
 * @param {Buffer} buffer - File buffer in RAM
 * @param {Object} options - Cloudinary upload options (folder, resource_type, transformations)
 * @returns {Promise<string>} - Resolves with the secure HTTPS URL
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'rook_lms',
                ...options,
            },
            (error, result) => {
                if (error) {
                    return reject(new AppError(`Cloudinary upload faile: ${error.message}`, 502));
                }
                resolve(result.secure_url);
            }
        );

        // Convert the memory buffer to readable stream and pipe to Cloudinary
        Readable.from(buffer).pipe(uploadStream);
    });
};