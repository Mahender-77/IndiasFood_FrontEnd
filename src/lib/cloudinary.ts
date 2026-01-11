import axios from 'axios';
import api from "./api";

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    // 1. Get signed signature from backend
    const { data: { signature, timestamp, cloudName, apiKey } } = await api.post('/upload/cloudinary-sign');

    // 2. Upload to Cloudinary using the signed signature
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('folder', 'indias-food'); // Optional: specify a folder in Cloudinary

    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary.');
  }
};

