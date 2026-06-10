import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Upload, Loader2, Move, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { getImageUrl } from '../../utils/image';
import './QuoteGeneratorModal.css';

interface QuoteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  storyTitle: string;
  authorName: string;
  coverUrl?: string | null;
}

type BackgroundType = 'cover' | 'preset_1' | 'preset_2' | 'preset_3' | 'preset_4' | 'preset_5' | 'preset_6' | 'custom';
type FontSize = 'sm' | 'md' | 'lg';

interface CropState {
  offsetX: number; // 0–1 relative offset within the image
  offsetY: number;
  scale: number;   // zoom level >= 1
}

export const QuoteGeneratorModal: React.FC<QuoteGeneratorModalProps> = ({
  isOpen,
  onClose,
  quoteText,
  storyTitle,
  authorName,
  coverUrl
}) => {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('preset_1');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  // Crop state for uploaded custom image
  const [showCropUI, setShowCropUI] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null); // raw uploaded, pre-crop
  const [cropState, setCropState] = useState<CropState>({ offsetX: 0.5, offsetY: 0.5, scale: 1 });
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map background types to URLs
  const getBackgroundUrl = (): string => {
    switch (backgroundType) {
      case 'cover':
        return coverUrl ? getImageUrl(coverUrl, 'cover') : '';
      case 'preset_1':
        return '/presets/preset_1.jpg';  // file is actually a PNG but served at this path
      case 'preset_2':
        return '/presets/preset_2.png';
      case 'preset_3':
        return '/presets/preset_3.jpg';
      case 'preset_4':
        return '/presets/preset_4.jpg';
      case 'preset_5':
        return '/presets/preset_5.jpg';
      case 'preset_6':
        return '/presets/preset_6.jpg';
      case 'custom':
        return customImage || '';
      default:
        return '/presets/preset_1.jpg';
    }
  };

  useEffect(() => {
    if (coverUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(coverUrl, 'cover');
      img.onload = () => setIsCoverLoaded(true);
      img.onerror = () => setIsCoverLoaded(false);
    }
  }, [coverUrl]);

  // Set default background to cover if cover is available and loaded, otherwise preset_1
  useEffect(() => {
    if (isOpen) {
      if (coverUrl && isCoverLoaded) {
        setBackgroundType('cover');
      } else {
        setBackgroundType('preset_1');
      }
    }
  }, [isOpen, coverUrl, isCoverLoaded]);

  // Draw card on Canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 800; // high res 1:1
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Set background color fallback
    ctx.fillStyle = '#0a0d1a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const bgUrl = getBackgroundUrl();

    if (!bgUrl) {
      // Draw plain dark gradient if no image
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
      gradient.addColorStop(0, '#12162e');
      gradient.addColorStop(1, '#080a14');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawOverlayAndText(ctx, canvasSize);
      return;
    }

    const img = new Image();
    // Allow cross-origin for covers fetched from backend
    if (backgroundType === 'cover') {
      img.crossOrigin = 'anonymous';
    }
    img.src = bgUrl;

    img.onload = () => {
      // Draw background center-cropped
      const imageRatio = img.width / img.height;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (imageRatio > 1) {
        sWidth = img.height;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width;
        sy = (img.height - sHeight) / 2;
      }

      // Apply blur filter if background is cover
      if (backgroundType === 'cover') {
        ctx.filter = 'blur(16px)';
        // Draw slightly wider to hide blurred borders
        const padding = 40;
        ctx.drawImage(img, sx, sy, sWidth, sHeight, -padding, -padding, canvasSize + padding * 2, canvasSize + padding * 2);
        ctx.filter = 'none'; // reset filter
      } else {
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvasSize, canvasSize);
      }

      drawOverlayAndText(ctx, canvasSize);
    };

    img.onerror = () => {
      // Draw plain dark gradient fallback on error
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
      gradient.addColorStop(0, '#12162e');
      gradient.addColorStop(1, '#080a14');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawOverlayAndText(ctx, canvasSize);
    };

  }, [isOpen, backgroundType, fontSize, customImage, quoteText, storyTitle, authorName, isCoverLoaded, cropState]);

  // ── Crop UI helpers ──────────────────────────────────────────────────────────
  const handleCropPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffX: cropState.offsetX,
      startOffY: cropState.offsetY,
    };
  }, [cropState]);

  const handleCropPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width;
    const dy = (e.clientY - dragRef.current.startY) / rect.height;
    // Move opposite to drag direction (drag image to pan)
    const newX = Math.max(0, Math.min(1, dragRef.current.startOffX - dx));
    const newY = Math.max(0, Math.min(1, dragRef.current.startOffY - dy));
    setCropState(prev => ({ ...prev, offsetX: newX, offsetY: newY }));
  }, []);

  const handleCropPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleCropWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setCropState(prev => ({ ...prev, scale: Math.max(1, Math.min(4, prev.scale + delta)) }));
  }, []);

  const applyCrop = () => {
    // Render the image with the current cropState to a square canvas and use that as customImage
    if (!pendingImage) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = 800;
    offscreen.height = 800;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      // Compute source rect from cropState
      const displaySize = Math.min(img.width, img.height) / cropState.scale;
      const maxOffX = img.width - displaySize;
      const maxOffY = img.height - displaySize;
      const srcX = cropState.offsetX * maxOffX;
      const srcY = cropState.offsetY * maxOffY;
      ctx.drawImage(img, srcX, srcY, displaySize, displaySize, 0, 0, 800, 800);
      setCustomImage(offscreen.toDataURL('image/jpeg', 0.92));
      setBackgroundType('custom');
      setShowCropUI(false);
      setPendingImage(null);
      setCropState({ offsetX: 0.5, offsetY: 0.5, scale: 1 });
    };
    img.src = pendingImage;
  };

  const drawOverlayAndText = (ctx: CanvasRenderingContext2D, size: number) => {
    // 1. Dark translucent overlay (rgba(0, 0, 0, 0.45) as requested)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(0, 0, size, size);

    // 2. Draw watermark "ABORA" at the top
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 18px "Outfit", "Inter", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('ABORA', size / 2, 70);
    ctx.letterSpacing = 'normal'; // reset

    // 3. Draw a stylized quote mark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.font = 'italic 160px Georgia, serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('“', size / 2, 190);

    // 4. Draw quote text (wrapped and centered)
    let textFontSize = 32;
    let lineHeight = 48;
    if (fontSize === 'sm') {
      textFontSize = 26;
      lineHeight = 40;
    } else if (fontSize === 'lg') {
      textFontSize = 40;
      lineHeight = 60;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `italic 500 ${textFontSize}px "Outfit", "Inter", sans-serif`;
    ctx.textBaseline = 'middle';

    const maxTextWidth = size - 160; // 80px padding on each side
    const lines = wrapText(ctx, `"${quoteText}"`, maxTextWidth);

    // Calculate vertical start position for centering the text block
    const textBlockHeight = lines.length * lineHeight;
    const startY = (size - textBlockHeight) / 2 + 30; // shift down slightly due to top watermark

    lines.forEach((line, index) => {
      ctx.fillText(line, size / 2, startY + (index * lineHeight));
    });

    // 5. Draw divider line above metadata
    const dividerY = size - 150;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size / 2 - 60, dividerY);
    ctx.lineTo(size / 2 + 60, dividerY);
    ctx.stroke();

    // 6. Draw story title
    ctx.font = 'bold 20px "Outfit", "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.fillText(storyTitle, size / 2, dividerY + 24);

    // 7. Draw author name
    ctx.font = '500 16px "Outfit", "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText(authorName, size / 2, dividerY + 54);
  };

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingImage(reader.result);
        setCropState({ offsetX: 0.5, offsetY: 0.5, scale: 1 });
        setShowCropUI(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const sanitizedTitle = storyTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `abora_quote_${sanitizedTitle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
      alert('Không thể tạo ảnh do chính sách bảo mật trình duyệt (CORS). Vui lòng thử lại với một hình nền khác hoặc hình ảnh tự tải lên.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  // ── Crop UI overlay ──────────────────────────────────────────────────────────
  if (showCropUI && pendingImage) {
    return (
      <div className="quote-modal-overlay">
        <div className="crop-ui-panel">
          <div className="crop-ui-header">
            <span>Điều chỉnh ảnh</span>
            <button className="quote-close-btn" onClick={() => { setShowCropUI(false); setPendingImage(null); }}>
              <X size={20} />
            </button>
          </div>

          {/* Crop viewport – square, shows image with current offset/scale */}
          <div
            ref={cropContainerRef}
            className="crop-viewport"
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerLeave={handleCropPointerUp}
            onWheel={handleCropWheel}
            style={{ touchAction: 'none' }}
          >
            <img
              src={pendingImage}
              alt="crop preview"
              draggable={false}
              style={{
                width: `${cropState.scale * 100}%`,
                height: `${cropState.scale * 100}%`,
                objectFit: 'cover',
                position: 'absolute',
                left: `${-cropState.offsetX * (cropState.scale - 1) * 100}%`,
                top: `${-cropState.offsetY * (cropState.scale - 1) * 100}%`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            {/* Crosshair overlay */}
            <div className="crop-crosshair" />
          </div>

          {/* Zoom controls */}
          <div className="crop-zoom-row">
            <button className="crop-zoom-btn" onClick={() => setCropState(p => ({ ...p, scale: Math.max(1, p.scale - 0.2) }))}>
              <ZoomOut size={16} /> Thu nhỏ
            </button>
            <span className="crop-zoom-label">{Math.round(cropState.scale * 100)}%</span>
            <button className="crop-zoom-btn" onClick={() => setCropState(p => ({ ...p, scale: Math.min(4, p.scale + 0.2) }))}>
              <ZoomIn size={16} /> Phóng to
            </button>
          </div>

          <p className="crop-hint"><Move size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Kéo để di chuyển &nbsp;·&nbsp; Cuộn để zoom</p>

          <button className="crop-apply-btn" onClick={applyCrop}>
            <Check size={16} /> Xác nhận
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-modal-overlay" onClick={onClose}>
      <div className="quote-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Left Side: Preview */}
        <div className="quote-preview-section">
          <div className="quote-card-preview-box">
            <canvas 
              ref={canvasRef} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }} 
            />
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="quote-controls-section">
          <div className="quote-controls-header">
            <h3>Tạo Ảnh Trích Dẫn</h3>
            <button className="quote-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="quote-controls-body">
            {/* Background selection */}
            <div className="control-group">
              <span className="control-label">Chọn hình nền</span>
              <div className="presets-grid">
                {coverUrl && (
                  <button 
                    className={`preset-item cover-item ${backgroundType === 'cover' ? 'active' : ''}`}
                    onClick={() => setBackgroundType('cover')}
                    style={{ 
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${getImageUrl(coverUrl, 'cover')})` 
                    }}
                  >
                    Bìa
                  </button>
                )}
                <button 
                  className={`preset-item ${backgroundType === 'preset_1' ? 'active' : ''}`}
                  onClick={() => setBackgroundType('preset_1')}
                  style={{ backgroundImage: `url(/presets/preset_1.jpg)` }}
                />
                <button 
                  className={`preset-item ${backgroundType === 'preset_2' ? 'active' : ''}`}
                  onClick={() => setBackgroundType('preset_2')}
                  style={{ backgroundImage: `url(/presets/preset_2.png)` }}
                />
                <button 
                  className={`preset-item ${backgroundType === 'preset_3' ? 'active' : ''}`}
                  onClick={() => setBackgroundType('preset_3')}
                  style={{ backgroundImage: `url(/presets/preset_3.jpg)` }}
                />
                <button 
                  className={`preset-item ${backgroundType === 'preset_4' ? 'active' : ''}`}
                  onClick={() => setBackgroundType('preset_4')}
                  style={{ backgroundImage: `url(/presets/preset_4.jpg)` }}
                />
                <button 
                  className={`preset-item ${backgroundType === 'preset_5' ? 'active' : ''}`}
                  onClick={() => setBackgroundType('preset_5')}
                  style={{ backgroundImage: `url(/presets/preset_5.jpg)` }}
                />
                <button 
                  className={`preset-item ${backgroundType === 'preset_6' ? 'active' : ''}`}
                  onClick={() => setBackgroundType('preset_6')}
                  style={{ backgroundImage: `url(/presets/preset_6.jpg)` }}
                />
                
                {/* Upload custom image */}
                <button 
                  className={`preset-item upload-item ${backgroundType === 'custom' ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  style={customImage ? { backgroundImage: `url(${customImage})` } : {}}
                >
                  {!customImage && (
                    <>
                      <Upload size={16} />
                      <span style={{ fontSize: '0.6rem', marginTop: '2px' }}>Tải lên</span>
                    </>
                  )}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleCustomImageUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>

            {/* Font size selection */}
            <div className="control-group" style={{ marginTop: '1.25rem' }}>
              <span className="control-label">Cỡ chữ</span>
              <div className="fontsize-controls">
                <button 
                  className={`fontsize-btn ${fontSize === 'sm' ? 'active' : ''}`}
                  onClick={() => setFontSize('sm')}
                >
                  Nhỏ
                </button>
                <button 
                  className={`fontsize-btn ${fontSize === 'md' ? 'active' : ''}`}
                  onClick={() => setFontSize('md')}
                >
                  Vừa
                </button>
                <button 
                  className={`fontsize-btn ${fontSize === 'lg' ? 'active' : ''}`}
                  onClick={() => setFontSize('lg')}
                >
                  Lớn
                </button>
              </div>
            </div>
          </div>

          <button 
            className="download-action-btn" 
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Đang lưu ảnh...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Download size={18} />
                Tải ảnh xuống
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
