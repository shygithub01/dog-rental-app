import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFirebase } from '../../contexts/FirebaseContext';

interface MultiImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
  label?: string;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ 
  onImagesUploaded, 
  currentImages = [], 
  maxImages = 5,
  label = "Dog Photos"
}) => {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { storage } = useFirebase();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || images.length >= maxImages) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploading(true);
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Create unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const filename = `dogs/${timestamp}_${randomId}_${file.name}`;
        
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      });

      const newImageUrls = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...newImageUrls];
      
      setImages(updatedImages);
      onImagesUploaded(updatedImages);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    try {
      // Try to delete from Firebase Storage
      if (imageUrl.includes('firebase')) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.log('Could not delete image from storage:', error);
      // Continue anyway - the image might not exist in storage
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesUploaded(updatedImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    setImages(updatedImages);
    onImagesUploaded(updatedImages);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      reorderImages(dragIndex, dropIndex);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <label style={{
        display: 'block',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
      }}>
        📸 {label} ({images.length}/{maxImages})
      </label>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#FF6B35' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: images.length >= maxImages ? 'not-allowed' : 'pointer',
          backgroundColor: dragOver ? 'rgba(255, 107, 53, 0.05)' : '#f9fafb',
          transition: 'all 0.2s ease',
          marginBottom: '16px',
          opacity: images.length >= maxImages ? 0.5 : 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
          disabled={images.length >= maxImages}
        />
        
        {uploading ? (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #FF6B35',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ margin: 0, color: '#6b7280' }}>Uploading photos...</p>
          </div>
        ) : images.length >= maxImages ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Maximum {maxImages} photos reached
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>
              {images.length === 0 ? 'Add photos of your dog' : 'Add more photos'}
            </p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              Drag & drop or click to select • Max {maxImages} photos • JPEG, PNG up to 5MB each
            </p>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      {images.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            📷 Photo Gallery {images.length > 1 && '(Drag to reorder)'}
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {images.map((imageUrl, index) => (
              <div
                key={imageUrl}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: index === 0 ? '3px solid #FF6B35' : '2px solid #e2e8f0',
                  cursor: 'grab',
                  transition: 'all 0.2s ease'
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Dog photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Primary Photo Badge */}
                {index === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    backgroundColor: '#FF6B35',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Main
                  </div>
                )}
                
                {/* Photo Number */}
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {index + 1}
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          {images.length > 1 && (
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              💡 The first photo will be the main photo shown on dog cards
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;