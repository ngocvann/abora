import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Upload, Loader2 } from 'lucide-react';
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map background types to URLs
  const getBackgroundUrl = (): string => {
    switch (backgroundType) {
      case 'cover':
        return coverUrl ? getImageUrl(coverUrl, 'cover') : '';
      case 'preset_1':
        return '/presets/preset_1.jpg';
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

  }, [isOpen, backgroundType, fontSize, customImage, quoteText, storyTitle, authorName, isCoverLoaded]);

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
        setCustomImage(reader.result);
        setBackgroundType('custom');
      }
    };
    reader.readAsDataURL(file);
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
