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

/**
 * Deletes a file from Cloudinary given its HTTPS URL.
 * Automatically extracts the public_id and resource_type.
 */
export const deleteFromCloudinary = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return;
  }

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return;

    const pathAfterUpload = parts[1];
    // Remove version prefix (e.g. v1721812345/)
    const cleanPath = pathAfterUpload.replace(/^v\d+\//, '');

    const isRaw = url.includes('/raw/');
    const isVideo = url.includes('/video/');
    const resourceType = isRaw ? 'raw' : isVideo ? 'video' : 'image';

    let publicId = cleanPath;
    if (!isRaw && cleanPath.includes('.')) {
      publicId = cleanPath.substring(0, cleanPath.lastIndexOf('.'));
    }

    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    console.log(`Cloudinary deletion result for [${publicId}]:`, res);
  } catch (err) {
    console.error(`Failed to delete old asset [${url}] from Cloudinary:`, err.message);
  }
};
