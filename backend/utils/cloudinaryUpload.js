import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

/**
 * Uploads a file (from multer local disk storage) to Cloudinary.
 * Deletes the local temporary file and returns the secure HTTPS Cloudinary URL.
 */
export const uploadToCloudinary = async (filePath, folder = 'slaproject') => {
  if (!filePath) return null;

  // If already a URL (e.g. http/https), return as is
  if (typeof filePath === 'string' && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
    return filePath;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto', // Automatically handles images, PDFs, docs
    });

    // Delete local temporary file after successful Cloudinary upload
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn('Could not remove temporary local file:', unlinkErr.message);
      }
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Cleanup temporary local file on upload error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
    throw error;
  }
};
