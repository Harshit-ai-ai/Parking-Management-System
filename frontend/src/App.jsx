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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8 font-sans overflow-hidden">
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">
          Smart Parking Control
        </h1>
        <div className="flex items-center space-x-3 bg-gray-800/60 px-4 py-2 rounded-full border border-gray-700 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
            <span className="text-sm font-medium text-gray-300">
              {connected ? 'System Online' : 'System Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-700 relative min-h-[75vh] flex flex-col">
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-700 pb-5 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Lot Map Editor</h2>
            <p className="text-sm text-gray-400">Add spots and drag them onto the asphalt to build your layout.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex space-x-5 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
                <span className="text-sm font-medium text-gray-300">Empty</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"></div>
                <span className="text-sm font-medium text-gray-300">Occupied</span>
              </div>
            </div>

            <form onSubmit={handleAddSpot} className="flex gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Spot ID (e.g. P1)" 
                value={newSpotId}
                onChange={(e) => setNewSpotId(e.target.value.toUpperCase())}
                className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-32 sm:w-40"
              />
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all active:scale-95">
                Add Spot
              </button>
              <button type="button" onClick={handleClearMap} className="bg-gray-700 hover:bg-red-600 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-95 text-gray-200 hover:text-white border border-gray-600 hover:border-red-500">
                Reset Map
              </button>
            </form>
          </div>
        </div>

        <div 
          className="relative w-full flex-grow min-h-[600px] rounded-xl border-4 border-gray-600 overflow-hidden shadow-inner"
          style={{
            backgroundColor: '#2d3748',
            backgroundImage: `radial-gradient(#4a5568 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        >
          {Object.keys(allSpots).length > 0 ? (
            Object.entries(allSpots).map(([spotId, data]) => {
              // Occupied (car blocks light) -> Red
              // Empty (photodiode receives light) -> Green
              // Unknown -> Default to Green
              const isOccupied = data.status === 'occupied';
              const isUnknown = data.status === 'unknown';
              
              // Color logic requested by user: default green, red when occupied
              const isRed = isOccupied;
              
              let borderColor = 'border-white';
              let bgColor = isRed ? 'bg-red-900/60' : 'bg-gray-800/80';
              let lightColor = isRed ? 'bg-red-500' : 'bg-green-500';
              let lightShadow = isRed ? 'shadow-[0_0_18px_rgba(239,68,68,1)]' : 'shadow-[0_0_18px_rgba(34,197,94,1)]';
              
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
                      absolute w-36 h-48 cursor-move select-none flex flex-col items-center justify-center rounded-sm 
                      border-l-4 border-r-4 border-b-4 border-t-0 border-dashed border-gray-300
                      hover:border-solid hover:border-yellow-400 transition-colors duration-200
                      ${bgColor} backdrop-blur-sm shadow-xl
                    `}
                    style={{ zIndex: 10 }}
                  >
                    {/* Parking Line Marker */}
                    <div className="absolute top-0 w-full h-1 bg-gray-500/50"></div>
                    
                    {/* The Sensor Light */}
                    <div className="absolute top-4">
                      <div className={`w-5 h-5 rounded-full border-2 border-gray-800 animate-pulse ${lightColor} ${lightShadow}`}></div>
                    </div>
                    
                    <span className="text-4xl font-extrabold text-white mt-4 drop-shadow-md tracking-tighter">{spotId}</span>
                    
                    <div className="mt-auto mb-4 flex flex-col items-center">
                      <span className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest font-bold ${isRed ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {isRed ? 'Occupied' : 'Empty'}
                      </span>
                      {!isUnknown && (
                        <span className="text-[10px] text-gray-400 font-mono mt-1 bg-black/40 px-2 py-0.5 rounded">
                          L: {data.lightValue}
                        </span>
                      )}
                    </div>
                  </div>
                </Draggable>
              );
            })
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400/80">
              <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
              <p className="text-xl font-medium">Your parking lot is empty</p>
              <p className="text-sm mt-2">Add a spot to start building your layout</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
