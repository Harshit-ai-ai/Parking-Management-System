import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './index.css';

// Configure the Socket.io connection. Adjust port if necessary.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [parkingSpots, setParkingSpots] = useState({});
  const [connected, setConnected] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2">Real-Time Parking Management</h1>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {connected ? 'Connected to Server' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-6 flex justify-between items-center border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-semibold">Parking Lot Map</h2>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]"></div>
              <span className="text-sm">Empty (Available)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]"></div>
              <span className="text-sm">Occupied</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.keys(parkingSpots).length > 0 ? (
            Object.entries(parkingSpots).map(([spotId, data]) => {
              // Threshold logic: 'occupied' is green, 'empty' is red (based on user request)
              const isOccupied = data.status === 'occupied';
              
              return (
                <div 
                  key={spotId} 
                  className={`
                    relative flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-300
                    ${isOccupied 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-red-500 bg-red-500/10'
                    }
                  `}
                >
                  <div className="absolute top-2 right-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse
                      ${isOccupied 
                        ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)]' 
                        : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]'
                      }
                    `}></div>
                  </div>
                  
                  <span className="text-3xl font-bold mb-2">{spotId}</span>
                  <span className="text-sm uppercase tracking-wider font-semibold text-gray-400">
                    {isOccupied ? 'Occupied' : 'Empty'}
                  </span>
                  <span className="text-xs text-gray-500 mt-2">Light: {data.lightValue}</span>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              No parking spot data available. Waiting for Arduino input...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
