import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height ratio
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  imageUrl, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 1.33 // 4:3 ratio for dog photos
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 320, height: 240 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageStart, setImageStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);
        
        // Set initial crop to center of image
        const containerWidth = 400; // Fixed container width
        const containerHeight = 300; // Fixed container height
        const cropWidth = containerWidth * 0.8;
        const cropHeight = cropWidth / aspectRatio;
        
        setCrop({
          x: (containerWidth - cropWidth) / 2,
          y: (containerHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight
        });
      };
    }
  }, [imageUrl, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setImageStart({ x: imagePosition.x, y: imagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    const newX = imageStart.x + deltaX;
    const newY = imageStart.y + deltaY;
    
    // Constrain image movement to keep crop area filled
    const maxX = 0;
    const minX = -(400 - crop.width);
    const maxY = 0;
    const minY = -(300 - crop.height);
    
    setImagePosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropComplete = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Set canvas size to crop dimensions
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Calculate source coordinates based on crop position and image position
    const scaleX = img.naturalWidth / 400; // 400 is container width
    const scaleY = img.naturalHeight / 300; // 300 is container height
    
    const sourceX = (crop.x - imagePosition.x) * scaleX;
    const sourceY = (crop.y - imagePosition.y) * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // Draw the cropped image
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, crop.width, crop.height
    );

    // Convert to data URL
    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: '#2d3748',
          textAlign: 'center'
        }}>
          Crop Your Dog's Photo
        </h3>
        
        <p style={{
          margin: '0 0 20px 0',
          color: '#FF6B35',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          Drag the image to position it. Show your dog's face clearly in the crop area.
        </p>

        <div style={{
          position: 'relative',
          width: '400px',
          height: '300px',
          margin: '0 auto 20px auto',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f7fafc'
        }}>
          <div style={{
            position: 'absolute',
            left: imagePosition.x,
            top: imagePosition.y,
            width: '400px',
            height: '300px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageLoaded ? 'block' : 'none',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
              draggable={false}
            />
          </div>
          
          {/* Crop overlay */}
          <div style={{
            position: 'absolute',
            left: crop.x,
            top: crop.y,
            width: crop.width,
            height: crop.height,
            border: '2px solid #4299e1',
            backgroundColor: 'rgba(66, 153, 225, 0.1)',
            pointerEvents: 'none',
            zIndex: 10
          }} />
          
          {/* Corner handles */}
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                backgroundColor: '#4299e1',
                border: '2px solid white',
                borderRadius: '50%',
                left: i % 2 === 0 ? crop.x - 6 : crop.x + crop.width - 6,
                top: i < 2 ? crop.y - 6 : crop.y + crop.height - 6,
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 20
              }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Apply Crop
          </button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default ImageCropper; 