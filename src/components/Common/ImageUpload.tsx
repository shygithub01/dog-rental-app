import React, { useState, useRef } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageCropper from './ImageCropper';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageUploaded, 
  currentImageUrl, 
  label = "Upload Dog Photo" 
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { storage, auth } = useFirebase();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    
    // Create preview and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setTempImageUrl(imageUrl);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (imageDataUrl: string) => {
    if (!auth.currentUser) {
      setError('You must be logged in to upload images');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${auth.currentUser.uid}_${timestamp}_cropped.jpg`;
      const storageRef = ref(storage, `dog-images/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('Image uploaded successfully:', snapshot);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadURL);

      // Call the callback with the new image URL
      onImageUploaded(downloadURL);
      setPreviewUrl(downloadURL);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setShowCropper(false);
    uploadImage(croppedImageUrl);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: 'bold',
        color: '#2d3748'
      }}>
        {label}
      </label>

      {/* Image Preview */}
      {previewUrl && (
        <div style={{
          marginBottom: '15px',
          position: 'relative',
          display: 'inline-block'
        }}>
          <img
            src={previewUrl}
            alt="Dog preview"
            style={{
              width: '200px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '2px solid #e2e8f0'
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div style={{
        border: '2px dashed #cbd5e0',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f7fafc',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.borderColor = '#6A32B0'}
      onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e0'}
      onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        {uploading ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📤</div>
            <p style={{ margin: 0, color: '#4a5568' }}>Uploading...</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📷</div>
            <p style={{ margin: '0 0 5px 0', color: '#2d3748', fontWeight: 'bold' }}>
              {previewUrl ? 'Change Photo' : 'Click to Upload Photo'}
            </p>
            <p style={{ margin: 0, color: '#6A32B0', fontSize: '0.9rem' }}>
              JPEG, PNG up to 5MB
            </p>
            <p style={{ margin: '5px 0 0 0', color: '#6A32B0', fontSize: '0.8rem', fontStyle: 'italic' }}>
              ✂️ Crop & position your photo for the perfect fit!
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          color: '#e53e3e',
          marginTop: '10px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Image Quality Tips */}
      {!previewUrl && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ebf8ff',
          borderRadius: '6px',
          border: '1px solid #bee3f8'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#2b6cb0'
          }}>
            <strong>📸 Photo Tips:</strong> Upload any photo and use our cropping tool to position it perfectly! Show your dog's face clearly for the best results.
          </p>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropper
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1.33} // 4:3 ratio for dog photos
        />
      )}
    </div>
  );
};

export default ImageUpload; 