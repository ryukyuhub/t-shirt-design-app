import React, { useState } from 'react';
import './App.css';
import DesignCanvas from './components/DesignCanvas';
import Toolbar from './components/Toolbar';

function App() {
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [fontSize, setFontSize] = useState<number>(16);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Tシャツデザインアプリ</h1>
      </header>
      <main className="App-main">
        <Toolbar 
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
        <DesignCanvas 
          selectedColor={selectedColor}
          fontSize={fontSize}
        />
      </main>
    </div>
  );
}

export default App;
