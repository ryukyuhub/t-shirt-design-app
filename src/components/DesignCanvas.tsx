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
          ctx.arc(element.x, element.y, (element.width || 50) / 2, 0, 2 * Math.PI);
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
          ctx.strokeRect(element.x - 2, element.y - 2, (element.width || 100) + 4, (element.height || 100) + 4);
        } else {
          ctx.strokeRect(element.x - 2, element.y - 2, (element.width || 50) + 4, (element.height || 50) + 4);
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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log('Click at:', x, y); // デバッグ用

    // Find clicked element with better hit detection
    const clickedElement = elements.find(element => {
      if (element.type === 'text') {
        const textWidth = getTextWidth(element.content || '', element.fontSize || 16);
        const textHeight = element.fontSize || 16;
        const padding = 5; // 余白を少し減らす
        const hit = x >= element.x - padding && x <= element.x + textWidth + padding &&
                   y >= element.y - textHeight - padding && y <= element.y + padding;
        console.log('Text element hit test:', element.content, hit, {
          elementX: element.x,
          elementY: element.y,
          textWidth,
          textHeight,
          clickX: x,
          clickY: y
        }); // デバッグ用
        return hit;
      } else if (element.type === 'image') {
        const hit = x >= element.x && x <= element.x + (element.width || 100) &&
                   y >= element.y && y <= element.y + (element.height || 100);
        console.log('Image element hit test:', hit); // デバッグ用
        return hit;
      } else {
        const hit = x >= element.x && x <= element.x + (element.width || 50) &&
                   y >= element.y && y <= element.y + (element.height || 50);
        console.log('Shape element hit test:', element.shapeType, hit); // デバッグ用
        return hit;
      }
    });

    console.log('Clicked element:', clickedElement); // デバッグ用

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({ x: x - clickedElement.x, y: y - clickedElement.y });
    } else {
      console.log('No element clicked, clearing selection'); // デバッグ用
      setSelectedElement(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setElements(prevElements =>
      prevElements.map(element =>
        element.id === selectedElement
          ? { ...element, x: x - dragOffset.x, y: y - dragOffset.y }
          : element
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
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
        style={{ border: '1px solid #ccc', cursor: isDragging ? 'grabbing' : 'grab' }}
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