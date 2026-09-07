# Parking-Management-System

An enterprise-grade, full-stack IoT solution for real-time parking lot management. This system bridges edge hardware (Arduino + Photoresistors) with a live React web dashboard using Node.js and WebSockets, providing zero-latency updates for parking spot occupancy.

This module is part of the broader **Biometric System** suite and is currently in the active process of commercialization for smart residential societies and corporate campuses.

---

## Architecture & Tech Stack

*   **Hardware (Edge):** Arduino Uno, Photoresistor (LDR) modules, Common-Cathode RGB LEDs.
*   **Backend:** Node.js, Express.js, Socket.io (WebSockets), `serialport` (USB Serial Communication).
*   **Frontend:** React.js, Tailwind CSS, `socket.io-client`.

## Features

*   **Hardware-in-the-Loop:** Direct USB serial communication between the physical parking sensors and the web server.
*   **Live Digital Twin:** A responsive, grid-based React map that visually updates parking spot status in real-time without page reloads.
*   **Edge Visual Indicators:** Physical RGB LEDs at each parking spot change color based on local sensor readings (Green = Occupied, Red = Empty) instantly, independently of network latency.
*   **Configurable Thresholds:** Easily adjustable light-sensitivity thresholds for different indoor/outdoor ambient lighting conditions.

---

## Hardware Setup & Circuit

For a single parking spot (e.g., `P1`), wire the components to your Arduino as follows:

| Component | Arduino Pin | Description |
| :--- | :--- | :--- |
| **Photoresistor (A0)** | `A0` | Analog input for ambient light detection. |
| **RGB LED (Red)** | `9` (PWM) | Red color channel for "Empty" status. |
| **RGB LED (Green)** | `10` (PWM) | Green color channel for "Occupied" status. |
| **RGB LED (Blue)** | `11` (PWM) | Unused in default configuration. |
| **GND / 5V** | `GND` / `5V` | Power for the LDR module and LED common ground. |

**Sensor Logic:** 
When a car parks over the sensor, it blocks the ambient light. 
*   **Light Value < 350:** Spot is **Occupied** → LED turns **GREEN**.
*   **Light Value >= 350:** Spot is **Empty** → LED turns **RED**.

---

## Installation & Setup

### 1. Arduino Configuration
1. Open the Arduino IDE.
2. Paste the provided `C++` hardware sketch.
3. Flash the code to your Arduino Uno.
4. Take note of the COM port (e.g., `COM3` on Windows, `/dev/ttyUSB0` on Linux/Mac).

### 2. Backend Setup (Node.js)
The backend listens to the Arduino via USB and broadcasts changes over WebSockets.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install express socket.io serialport @serialport/parser-readline

# Set your serial port environment variable (Windows example)
export SERIAL_PORT=COM3 

# Start the server
node server.js

3. Frontend Setup (React)
The frontend connects to the backend via Socket.io and renders the live map.
```

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
npm install socket.io-client

# Start the development server
npm run dev
```
