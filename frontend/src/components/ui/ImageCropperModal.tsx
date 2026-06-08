import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropperModal.css';

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ImageCropperModalProps = {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  aspect?: number;
  /**
   * Called with the cropped image file (same name as original, type preserved)
   */
  onCropConfirm: (croppedFile: File) => void;
};

// Helper to convert cropped area to a Blob
const getCroppedImg = async (imageSrc: string, crop: Area): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.src = imageSrc;
    // For cross‑origin images (not needed for local uploads but safe)
    img.crossOrigin = 'anonymous';
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob as Blob);
    }, 'image/jpeg'); // always output JPEG for size efficiency
  });
};

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageFile,
  onClose,
  aspect = 1,
  onCropConfirm,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Generate object URL when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const onCropComplete = useCallback((_: Area, croppedArea: Area) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const croppedFile = new File([blob], imageFile?.name ?? 'cropped.jpg', {
      type: blob.type,
    });
    onCropConfirm(croppedFile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cropper-overlay" onClick={onClose}>
      <div className="cropper-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="cropper-title">Chỉnh kích thước ảnh</h3>
        <div className="cropper-area">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <div className="cropper-controls">
          <label className="zoom-label">Phóng đại:</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
          />
        </div>
        <div className="cropper-actions">
          <button className="btn-cancel" onClick={onClose} type="button">
            Hủy
          </button>
          <button className="btn-confirm" onClick={handleConfirm} type="button">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
