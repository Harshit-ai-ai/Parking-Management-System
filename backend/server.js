require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/ttyACM0';
const BAUD_RATE = parseInt(process.env.BAUD_RATE) || 9600;

// State of parking spots
// Example: { 'P1': { status: 'occupied', lightValue: 320 }, 'P2': { status: 'empty', lightValue: 800 } }
const parkingSpots = {};

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  // Send current state on connection
  socket.emit('parkingState', parkingSpots);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Setup Serial Port
try {
  const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('open', () => {
    console.log(`Serial port opened: ${SERIAL_PORT} at ${BAUD_RATE} baud.`);
  });

  port.on('error', (err) => {
    console.error('Serial port error: ', err.message);
  });

  parser.on('data', (data) => {
    // Format: SPOT_ID:LIGHT_VALUE (e.g., P1:320)
    const line = data.trim();
    if (!line) return;

    const parts = line.split(':');
    if (parts.length === 2) {
      const spotId = parts[0];
      const lightValue = parseInt(parts[1], 10);

      if (!isNaN(lightValue)) {
        // Threshold logic: If LIGHT_VALUE < 350, mark as 'occupied'. If >= 350, mark as 'empty'.
        const status = lightValue < 350 ? 'occupied' : 'empty';

        let changed = false;
        if (!parkingSpots[spotId] || parkingSpots[spotId].status !== status || parkingSpots[spotId].lightValue !== lightValue) {
          changed = true;
          parkingSpots[spotId] = { status, lightValue };
        }

        if (changed) {
          io.emit('parkingState', parkingSpots);
        }
      }
    }
  });
} catch (err) {
  console.error('Failed to open serial port:', err.message);
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
