import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Draggable from 'react-draggable';
import './index.css';

// Configure the Socket.io connection. Adjust port if necessary.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [parkingSpots, setParkingSpots] = useState({});
  const [connected, setConnected] = useState(false);
  const [positions, setPositions] = useState(() => JSON.parse(localStorage.getItem('parkingPositions') || '{}'));
  const [manualSpots, setManualSpots] = useState(() => JSON.parse(localStorage.getItem('manualSpots') || '[]'));
  const [newSpotId, setNewSpotId] = useState('');

  // Persist positions and manual spots
  useEffect(() => {
    localStorage.setItem('parkingPositions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('manualSpots', JSON.stringify(manualSpots));
  }, [manualSpots]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('parkingState', (state) => {
      setParkingSpots(state);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDragStop = (spotId, e, data) => {
    setPositions(prev => ({
      ...prev,
      [spotId]: { x: data.x, y: data.y }
    }));
  };

  const handleAddSpot = (e) => {
    e.preventDefault();
    if (newSpotId && !manualSpots.includes(newSpotId)) {
      setManualSpots(prev => [...prev, newSpotId]);
      setNewSpotId('');
    }
  };

  const handleClearMap = () => {
    if (window.confirm("Are you sure you want to reset the map layout?")) {
      setPositions({});
      setManualSpots([]);
    }
  };

  // Merge manual spots and real backend spots
  const allSpots = { ...parkingSpots };
  manualSpots.forEach(spot => {
    if (!allSpots[spot]) {
      allSpots[spot] = { status: 'unknown', lightValue: '-' };
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans overflow-hidden">
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2">Real-Time Parking Management</h1>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {connected ? 'Connected to Server' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl relative min-h-[70vh]">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-700 pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Interactive Parking Map</h2>
            <p className="text-sm text-gray-400">Drag and drop spots to arrange them into a custom layout.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"></div>
                <span className="text-sm">Empty (Light)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]"></div>
                <span className="text-sm">Occupied (No Light)</span>
              </div>
            </div>

            <form onSubmit={handleAddSpot} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Spot ID (e.g., P1)" 
                value={newSpotId}
                onChange={(e) => setNewSpotId(e.target.value.toUpperCase())}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 text-sm transition">
                Add Spot
              </button>
              <button type="button" onClick={handleClearMap} className="bg-red-600 hover:bg-red-700 rounded px-3 py-1 text-sm transition">
                Reset Map
              </button>
            </form>
          </div>
        </div>

        <div className="relative w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          {Object.keys(allSpots).length > 0 ? (
            Object.entries(allSpots).map(([spotId, data]) => {
              // Occupied (car blocks light) -> Red
              // Empty (photodiode receives light) -> Green
              const isOccupied = data.status === 'occupied';
              const isUnknown = data.status === 'unknown';
              
              let borderColor, bgColor, lightColor, lightShadow;

              if (isUnknown) {
                borderColor = 'border-gray-500';
                bgColor = 'bg-gray-500/10';
                lightColor = 'bg-gray-500';
                lightShadow = 'shadow-[0_0_12px_rgba(107,114,128,1)]';
              } else if (isOccupied) {
                borderColor = 'border-red-500';
                bgColor = 'bg-red-500/10';
                lightColor = 'bg-red-500';
                lightShadow = 'shadow-[0_0_12px_rgba(239,68,68,1)]';
              } else {
                borderColor = 'border-green-500';
                bgColor = 'bg-green-500/10';
                lightColor = 'bg-green-500';
                lightShadow = 'shadow-[0_0_12px_rgba(34,197,94,1)]';
              }
              
              const position = positions[spotId] || { x: 0, y: 0 };
              const nodeRef = React.createRef();

              return (
                <Draggable 
                  key={spotId} 
                  nodeRef={nodeRef}
                  position={position} 
                  onStop={(e, dragData) => handleDragStop(spotId, e, dragData)}
                  bounds="parent"
                >
                  <div 
                    ref={nodeRef}
                    className={`
                      absolute w-40 h-28 cursor-move select-none flex flex-col items-center justify-center rounded-lg border-2 transition-colors duration-300
                      ${borderColor} ${bgColor}
                    `}
                    style={{ zIndex: 10 }}
                  >
                    <div className="absolute top-2 right-2">
                      <div className={`w-3 h-3 rounded-full ${isUnknown ? '' : 'animate-pulse'} ${lightColor} ${lightShadow}`}></div>
                    </div>
                    
                    <span className="text-3xl font-bold mb-1">{spotId}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                      {isUnknown ? 'Waiting...' : (isOccupied ? 'Occupied' : 'Empty')}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">Light: {data.lightValue}</span>
                  </div>
                </Draggable>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No parking spot data available. Add a spot manually or wait for Arduino input...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
