import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'wfxpxsje';
const apiKey = process.env.CLOUDINARY_API_KEY || '942376775311374';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'zVn50VQGkiAS55YcQXOok7CFehg';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
