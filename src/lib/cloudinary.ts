import axios from 'axios';
import api from "./api";

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    // 1. Get signed signature from backend
    const { data: { signature, timestamp } } = await api.post('/upload/cloudinary-sign');

    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary environment variables are not set.");
    }

    // 2. Upload to Cloudinary using the signed signature and upload preset
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // Add upload preset
    formData.append('folder', 'indias-food'); // Optional: specify a folder in Cloudinary

    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary.');
  }
};

