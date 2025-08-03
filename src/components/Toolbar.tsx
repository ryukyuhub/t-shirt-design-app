import React, { useState } from 'react';

interface ToolbarProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  selectedColor, 
  setSelectedColor, 
  fontSize, 
  setFontSize 
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('select');

  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ];

  const exportAsPNG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'tshirt-design.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const exportAsPDF = async () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 180, 225);
      pdf.save('tshirt-design.pdf');
    }
  };

  return (
    <div className="toolbar">

      <div className="tool-section">
        <h3>カラー</h3>
        <div className="color-palette">
          {colors.map(color => (
            <button
              key={color}
              className={`color-button ${selectedColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        />
      </div>

      <div className="tool-section">
        <h3>フォント設定</h3>
        <label>
          サイズ:
          <input
            type="range"
            min="10"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
          <span>{fontSize}px</span>
        </label>
      </div>

      <div className="tool-section">
        <h3>エクスポート</h3>
        <button onClick={exportAsPNG} style={{ marginRight: '0.5rem' }}>PNG保存</button>
        <button onClick={exportAsPDF}>PDF保存</button>
      </div>
    </div>
  );
};

export default Toolbar;