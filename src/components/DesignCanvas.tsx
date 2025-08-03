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

const DesignCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');

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
      }
      
      // Highlight selected element
      if (element.id === selectedElement) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(element.x - 5, element.y - 5, (element.width || 50) + 10, (element.height || 20) + 10);
      }
    });
  }, [elements, selectedElement]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked element
    const clickedElement = elements.find(element => {
      return x >= element.x && x <= element.x + (element.width || 50) &&
             y >= element.y - (element.fontSize || 16) && y <= element.y + (element.height || 20);
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
      addTextElement(inputText, '#000', 16);
      setShowTextInput(false);
      setInputText('');
    }
  };

  const handleTextCancel = () => {
    setShowTextInput(false);
    setInputText('');
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
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{ border: '1px solid #ccc', cursor: isDragging ? 'grabbing' : 'grab' }}
      />
      <div className="canvas-controls">
        <button onClick={handleAddText}>
          テキスト追加
        </button>
        <button onClick={() => addShapeElement('rectangle', '#000')}>
          四角形追加
        </button>
        <button onClick={() => addShapeElement('circle', '#000')}>
          円追加
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
    </div>
  );
};

export default DesignCanvas;