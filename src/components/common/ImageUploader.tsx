import React, { useCallback, useState, useEffect } from 'react';
import {useDropzone} from 'react-dropzone';
import { X, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  existingImages?: string[];
  onImagesChange: (images: File[]) => void;
  onExistingImageRemove?: (imageUrl: string) => void;
  maxFiles?: number;
  disabled?: boolean; // Add a disabled prop
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  existingImages = [],
  onImagesChange,
  onExistingImageRemove,
  maxFiles = 5,
  disabled = false, // Default to false
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Create URL for new files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup URLs when component unmounts or files change
    return () => newPreviews.forEach(URL.revokeObjectURL);
  }, [files]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onImagesChange(newFiles);
  }, [files, onImagesChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: maxFiles - existingImages.length,
    disabled: disabled, // Disable dropzone if disabled prop is true
  });

  const removeNewImage = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onImagesChange(updatedFiles);
  };

  const handleExistingImageRemove = (imageUrl: string) => {
    if (onExistingImageRemove) {
      onExistingImageRemove(imageUrl);
    }
  };

  const displayedImages = [
    ...existingImages.map(url => ({ src: url, isNew: false })),
    ...previews.map(url => ({ src: url, isNew: true })),
  ];

  const canAddMoreFiles = (files.length + existingImages.length) < maxFiles && !disabled;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-gray-400 bg-gray-50",
          !canAddMoreFiles && "opacity-50 cursor-not-allowed",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        )}
      >
        <input {...getInputProps()} disabled={!canAddMoreFiles || disabled} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {disabled
            ? "Image upload is disabled"
            : isDragActive
            ? "Drop the images here ..."
            : "Drag 'n' drop some images here, or click to select files"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Max {maxFiles} files (PNG, JPG, GIF up to 5MB each)
        </p>
        {(!canAddMoreFiles && !disabled) && (
          <p className="text-sm text-red-500 mt-2">Maximum {maxFiles} images reached.</p>
        )}
      </div>

      {(displayedImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedImages.map((image, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
              <img src={image.src} alt="Product preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => (image.isNew ? removeNewImage(index - existingImages.length) : handleExistingImageRemove(image.src))}
                disabled={disabled} // Disable remove button
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

