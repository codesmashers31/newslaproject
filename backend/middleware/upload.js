import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the upload directory against this file, not the process working
// directory. server.js serves statics from <backend>/uploads, so a relative
// './uploads' would write elsewhere whenever the server is started from a
// directory other than backend/ — the files would save but never be servable.
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'application/pdf': '.pdf',
};

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Image pickers often hand over an extensionless temp filename, so fall
    // back to an extension derived from the MIME type.
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext) {
      ext = MIME_EXTENSIONS[(file.mimetype || '').toLowerCase()] || '';
    }
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const ALLOWED_MIME = new Set([
  // Images. HEIC/HEIF matter because that is the iPhone camera default.
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Some clients send this when they cannot determine a type.
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
]);

/**
 * Accept on MIME type first, falling back to the extension.
 *
 * The previous implementation required BOTH to match one regex, which
 * rejected two very common real-world cases: iPhone HEIC photos (neither
 * matched) and picker temp files with no extension at all (`image/jpeg` with
 * filename `rn_image_picker_lib_temp_abc123`).
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (ALLOWED_MIME.has(mime) || (ext && ALLOWED_EXTENSIONS.has(ext))) {
    return cb(null, true);
  }

  const err = new Error(
    'Unsupported file type. Allowed: images (JPG, PNG, WEBP, GIF, HEIC), PDF, Word and Excel documents.'
  );
  err.status = 400;
  cb(err);
};

const upload = multer({
  storage,
  // Phone photos routinely exceed a few megabytes; the old 2MB ceiling
  // rejected most real camera images while the UI advertised 5MB.
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter,
});

export default upload;
