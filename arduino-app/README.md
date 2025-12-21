# Arduino Trader LED Display

This Arduino App displays portfolio allocation status on the Arduino Uno Q's 8x12 LED matrix.

## Description

The app fetches portfolio data from the Arduino Trader API and visualizes geographic allocation (EU/Asia/US) as vertical bars on the LED matrix. It runs continuously, updating the display every 30 seconds.

## Display Modes

- **Idle**: Subtle wave animation scrolling across the matrix
- **Portfolio**: Three vertical bar sections showing EU/Asia/US allocation percentages
- **Error**: X pattern when the trading API is unreachable

## How It Works

```
Trading API (FastAPI) → Python Script → Router Bridge → STM32 MCU → LED Matrix
```

1. Python script fetches `/api/portfolio/summary` from the trading API
2. Calculates bar heights based on allocation percentages
3. Sends frame data to STM32 via Router Bridge
4. STM32 renders the frame on the LED matrix

## Installation

```bash
# Copy app to ArduinoApps folder
cp -r arduino-app /home/arduino/ArduinoApps/trader-display

# Start the app
arduino-app-cli app start user:trader-display
```

## Commands

```bash
# View logs
arduino-app-cli app logs user:trader-display

# Restart
arduino-app-cli app restart user:trader-display

# Stop
arduino-app-cli app stop user:trader-display
```

## Files

- `python/main.py` - Fetches API data and generates LED frames
- `sketch/sketch.ino` - STM32 sketch for LED matrix control
- `app.yaml` - App configuration

## Requirements

- Arduino Uno Q with Arduino App framework
- Arduino Trader API running on port 8000
