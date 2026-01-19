import axios from 'axios';
import api from "./api";

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    // 1. Get signature from backend
    const { data: { signature, timestamp, apiKey } } =
      await api.post('/upload/cloudinary-sign');

    const CLOUDINARY_CLOUD_NAME =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error("Cloudinary cloud name not set");
    }

    // 2. Upload to Cloudinary (SIGNED)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp);
    formData.append("folder", "indias-food");

    const uploadUrl = 
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response = await axios.post(uploadUrl, formData);

    return response.data.secure_url;

  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Upload failed");
  }
};
