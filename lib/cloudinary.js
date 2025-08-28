import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
// Exporting the configured cloudinary instance for use in other parts of the application
// This allows for easy access to Cloudinary's features like uploading images, videos, etc.