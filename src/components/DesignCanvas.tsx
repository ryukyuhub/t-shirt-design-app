import React, { useRef, useEffect, useState } from 'react';

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  fontSize?: number;
  src?: string;
  shapeType?: 'rectangle' | 'circle';
}

interface DesignCanvasProps {
  selectedColor: string;
  fontSize: number;
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({ selectedColor, fontSize: globalFontSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 500;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw T-shirt outline
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 300, 400);
    
    // Draw elements
    elements.forEach(element => {
      if (element.type === 'text' && element.content) {
        ctx.fillStyle = element.color || '#000';
        ctx.font = `${element.fontSize || 16}px Arial`;
        ctx.fillText(element.content, element.x, element.y);
      } else if (element.type === 'shape') {
        ctx.fillStyle = element.color || '#000';
        if (element.shapeType === 'rectangle') {
          ctx.fillRect(element.x, element.y, element.width || 50, element.height || 50);
        } else if (element.shapeType === 'circle') {
          ctx.beginPath();
          const radius = (element.width || 50) / 2;
          const centerX = element.x + radius;
          const centerY = element.y + radius;
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else if (element.type === 'image' && element.src) {
        const cachedImage = imageCache.get(element.src);
        if (cachedImage && cachedImage.complete) {
          ctx.drawImage(cachedImage, element.x, element.y, element.width || 100, element.height || 100);
        }
      }
      
      // Highlight selected element
      if (element.id === selectedElement) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        if (element.type === 'text') {
          const textWidth = getTextWidth(element.content || '', element.fontSize || 16);
          const textHeight = element.fontSize || 16;
          ctx.strokeRect(element.x - 2, element.y - textHeight - 2, textWidth + 4, textHeight + 4);
        } else if (element.type === 'image') {
          const width = element.width || 100;
          const height = element.height || 100;
          ctx.strokeRect(element.x - 2, element.y - 2, width + 4, height + 4);
          // リサイズハンドルを描画
          drawResizeHandles(ctx, element.x, element.y, width, height);
        } else {
          const width = element.width || 50;
          const height = element.height || 50;
          const isCircle = element.type === 'shape' && element.shapeType === 'circle';
          
          if (isCircle) {
            // 円の場合は円形の選択線を描画
            const radius = width / 2;
            const centerX = element.x + radius;
            const centerY = element.y + radius;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            // 四角形の場合は四角形の選択線を描画
            ctx.strokeRect(element.x - 2, element.y - 2, width + 4, height + 4);
          }
          
          // リサイズハンドルを描画
          drawResizeHandles(ctx, element.x, element.y, width, height, isCircle);
        }
      }
    });
  }, [elements, selectedElement, imageCache]);

  // ESCキーで選択解除
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedElement(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getTextWidth = (text: string, fontSize: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 100;
    ctx.font = `${fontSize}px Arial`;
    return ctx.measureText(text).width;
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isCircle: boolean = false) => {
    const handleSize = 8;
    ctx.fillStyle = '#007bff';
    
    if (isCircle) {
      // 円の場合は円周上の4つの点にハンドル
      const radius = width / 2;
      const centerX = x + radius;
      const centerY = y + radius;
      
      ctx.fillRect(centerX - handleSize/2, y - handleSize/2, handleSize, handleSize); // 上
      ctx.fillRect(x + width - handleSize/2, centerY - handleSize/2, handleSize, handleSize); // 右
      ctx.fillRect(centerX - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // 下
      ctx.fillRect(x - handleSize/2, centerY - handleSize/2, handleSize, handleSize); // 左
    } else {
      // 四隅のハンドル
      ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize); // 左上
      ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize); // 右上
      ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // 左下
      ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // 右下
    }
  };

  const getResizeHandle = (x: number, y: number, element: DesignElement): string | null => {
    if (element.type === 'text') return null; // テキストはリサイズ不可
    
    const width = element.width || (element.type === 'image' ? 100 : 50);
    const height = element.height || (element.type === 'image' ? 100 : 50);
    const handleSize = 8;
    
    if (element.type === 'shape' && element.shapeType === 'circle') {
      // 円の場合のハンドル判定
      const radius = width / 2;
      const centerX = element.x + radius;
      const centerY = element.y + radius;
      
      // 上
      if (x >= centerX - handleSize && x <= centerX + handleSize &&
          y >= element.y - handleSize && y <= element.y + handleSize) {
        return 'n';
      }
      // 右
      if (x >= element.x + width - handleSize && x <= element.x + width + handleSize &&
          y >= centerY - handleSize && y <= centerY + handleSize) {
        return 'e';
      }
      // 下
      if (x >= centerX - handleSize && x <= centerX + handleSize &&
          y >= element.y + height - handleSize && y <= element.y + height + handleSize) {
        return 's';
      }
      // 左
      if (x >= element.x - handleSize && x <= element.x + handleSize &&
          y >= centerY - handleSize && y <= centerY + handleSize) {
        return 'w';
      }
    } else {
      // 四角形の場合の既存のハンドル判定
      if (x >= element.x - handleSize && x <= element.x + handleSize &&
          y >= element.y - handleSize && y <= element.y + handleSize) {
        return 'nw'; // 左上
      }
      if (x >= element.x + width - handleSize && x <= element.x + width + handleSize &&
          y >= element.y - handleSize && y <= element.y + handleSize) {
        return 'ne'; // 右上
      }
      if (x >= element.x - handleSize && x <= element.x + handleSize &&
          y >= element.y + height - handleSize && y <= element.y + height + handleSize) {
        return 'sw'; // 左下
      }
      if (x >= element.x + width - handleSize && x <= element.x + width + handleSize &&
          y >= element.y + height - handleSize && y <= element.y + height + handleSize) {
        return 'se'; // 右下
      }
    }
    
    return null;
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 選択された要素のリサイズハンドルをチェック
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        const handle = getResizeHandle(x, y, element);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          return;
        }
      }
    }

    // Find clicked element with better hit detection
    const clickedElement = elements.find(element => {
      if (element.type === 'text') {
        const textWidth = getTextWidth(element.content || '', element.fontSize || 16);
        const textHeight = element.fontSize || 16;
        const padding = 5;
        return x >= element.x - padding && x <= element.x + textWidth + padding &&
               y >= element.y - textHeight - padding && y <= element.y + padding;
      } else if (element.type === 'image') {
        return x >= element.x && x <= element.x + (element.width || 100) &&
               y >= element.y && y <= element.y + (element.height || 100);
      } else if (element.type === 'shape' && element.shapeType === 'circle') {
        // 円形の当たり判定
        const radius = (element.width || 50) / 2;
        const centerX = element.x + radius;
        const centerY = element.y + radius;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        return distance <= radius;
      } else {
        return x >= element.x && x <= element.x + (element.width || 50) &&
               y >= element.y && y <= element.y + (element.height || 50);
      }
    });

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({ x: x - clickedElement.x, y: y - clickedElement.y });
    } else {
      setSelectedElement(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isResizing && selectedElement && resizeHandle) {
      // リサイズ処理
      setElements(prevElements =>
        prevElements.map(element => {
          if (element.id === selectedElement) {
            const newElement = { ...element };
            const currentWidth = element.width || (element.type === 'image' ? 100 : 50);
            const currentHeight = element.height || (element.type === 'image' ? 100 : 50);

            if (element.type === 'shape' && element.shapeType === 'circle') {
              // 円の場合は正方形を保持してリサイズ
              const centerX = element.x + currentWidth / 2;
              const centerY = element.y + currentHeight / 2;
              let newSize;
              
              switch (resizeHandle) {
                case 'n': // 上
                  newSize = Math.max(20, (centerY - y) * 2);
                  break;
                case 'e': // 右
                  newSize = Math.max(20, (x - centerX) * 2);
                  break;
                case 's': // 下
                  newSize = Math.max(20, (y - centerY) * 2);
                  break;
                case 'w': // 左
                  newSize = Math.max(20, (centerX - x) * 2);
                  break;
                default:
                  newSize = currentWidth;
              }
              
              newElement.width = newSize;
              newElement.height = newSize;
              newElement.x = centerX - newSize / 2;
              newElement.y = centerY - newSize / 2;
            } else {
              // 四角形・画像の場合の既存処理
              switch (resizeHandle) {
                case 'se': // 右下
                  newElement.width = Math.max(20, x - element.x);
                  newElement.height = Math.max(20, y - element.y);
                  break;
                case 'sw': // 左下
                  const newWidth = Math.max(20, element.x + currentWidth - x);
                  newElement.x = element.x + currentWidth - newWidth;
                  newElement.width = newWidth;
                  newElement.height = Math.max(20, y - element.y);
                  break;
                case 'ne': // 右上
                  const newHeight = Math.max(20, element.y + currentHeight - y);
                  newElement.y = element.y + currentHeight - newHeight;
                  newElement.width = Math.max(20, x - element.x);
                  newElement.height = newHeight;
                  break;
                case 'nw': // 左上
                  const newWidthNW = Math.max(20, element.x + currentWidth - x);
                  const newHeightNW = Math.max(20, element.y + currentHeight - y);
                  newElement.x = element.x + currentWidth - newWidthNW;
                  newElement.y = element.y + currentHeight - newHeightNW;
                  newElement.width = newWidthNW;
                  newElement.height = newHeightNW;
                  break;
              }
            }
            return newElement;
          }
          return element;
        })
      );
    } else if (isDragging && selectedElement) {
      // ドラッグ処理
      setElements(prevElements =>
        prevElements.map(element =>
          element.id === selectedElement
            ? { ...element, x: x - dragOffset.x, y: y - dragOffset.y }
            : element
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // マウスダウンで即座に選択処理を行う
    handleCanvasClick(event);
  };

  const addTextElement = (text: string, color: string, fontSize: number) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'text',
      x: 200,
      y: 200,
      content: text,
      color,
      fontSize
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleAddText = () => {
    setShowTextInput(true);
    setInputText('');
  };

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      addTextElement(inputText, selectedColor, globalFontSize);
      setShowTextInput(false);
      setInputText('');
    }
  };

  const handleTextCancel = () => {
    setShowTextInput(false);
    setInputText('');
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        if (imageSrc) {
          // 画像をキャッシュに追加
          const img = new Image();
          img.onload = () => {
            setImageCache(prev => new Map(prev.set(imageSrc, img)));
            // キャンバスを再描画
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // 再描画をトリガー
                setElements(prev => [...prev]);
              }
            }
          };
          img.src = imageSrc;

          // 画像要素を追加
          const newElement: DesignElement = {
            id: Date.now().toString(),
            type: 'image',
            x: 200,
            y: 200,
            width: 100,
            height: 100,
            src: imageSrc
          };
          setElements(prev => [...prev, newElement]);
        }
      };
      reader.readAsDataURL(file);
    }
    // ファイル入力をリセット
    if (event.target) {
      event.target.value = '';
    }
  };

  const addShapeElement = (shapeType: 'rectangle' | 'circle', color: string) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'shape',
      x: 200,
      y: 200,
      width: 50,
      height: 50,
      color,
      shapeType
    };
    setElements(prev => [...prev, newElement]);
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(element => element.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  return (
    <div className="design-canvas-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{ 
          border: '1px solid #ccc', 
          cursor: isResizing ? 'nwse-resize' : (isDragging ? 'grabbing' : 'grab')
        }}
      />
      <div className="canvas-controls">
        <button onClick={handleAddText}>
          テキスト追加
        </button>
        <button onClick={() => addShapeElement('rectangle', selectedColor)}>
          四角形追加
        </button>
        <button onClick={() => addShapeElement('circle', selectedColor)}>
          円追加
        </button>
        <button onClick={handleImageUpload}>
          画像追加
        </button>
        <button onClick={() => setSelectedElement(null)} disabled={!selectedElement}>
          選択解除
        </button>
        <button onClick={deleteSelectedElement} disabled={!selectedElement}>
          削除
        </button>
      </div>
      
      {showTextInput && (
        <div className="text-input-modal">
          <div className="text-input-content">
            <h3>テキストを入力してください</h3>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ここにテキストを入力..."
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
            />
            <div className="text-input-buttons">
              <button onClick={handleTextSubmit} disabled={!inputText.trim()}>
                追加
              </button>
              <button onClick={handleTextCancel}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default DesignCanvas;