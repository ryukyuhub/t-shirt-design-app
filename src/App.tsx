import React from 'react';
import './App.css';
import DesignCanvas from './components/DesignCanvas';
import Toolbar from './components/Toolbar';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Tシャツデザインアプリ</h1>
      </header>
      <main className="App-main">
        <Toolbar />
        <DesignCanvas />
      </main>
    </div>
  );
}

export default App;
