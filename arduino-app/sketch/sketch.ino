// Arduino Trader LED Display
// I2C-based communication with Linux MPU (bypasses Docker/Router Bridge)
// MCU acts as I2C slave, receives commands from MPU Python script

#include <Wire.h>
#include "ArduinoGraphics.h"
#include "Arduino_LED_Matrix.h"
#include <vector>
#include <algorithm>

ArduinoLEDMatrix matrix;

// I2C slave address
#define I2C_SLAVE_ADDR 0x08

// Command codes
#define CMD_SCROLL_TEXT 0x01
#define CMD_DRAW 0x02
#define CMD_SET_RGB3 0x03
#define CMD_SET_RGB4 0x04
#define CMD_PRINT_TEXT 0x05

// RGB LED pins (active-low: HIGH = OFF, LOW = ON)
// LED3: LED_BUILTIN (R), LED_BUILTIN+1 (G), LED_BUILTIN+2 (B)
// LED4: LED_BUILTIN+3 (R), LED_BUILTIN+4 (G), LED_BUILTIN+5 (B)

// Command buffer
#define MAX_TEXT_LEN 255
String text_buffer = "";
int int_buffer[3] = {0, 0, 0};
int cmd_received = 0;

// Set RGB LED 3 color (active-low, digital only)
void setRGB3(uint8_t r, uint8_t g, uint8_t b) {
  digitalWrite(LED_BUILTIN, r > 0 ? LOW : HIGH);
  digitalWrite(LED_BUILTIN + 1, g > 0 ? LOW : HIGH);
  digitalWrite(LED_BUILTIN + 2, b > 0 ? LOW : HIGH);
}

// Set RGB LED 4 color (active-low, digital only)
void setRGB4(uint8_t r, uint8_t g, uint8_t b) {
  digitalWrite(LED_BUILTIN + 3, r > 0 ? LOW : HIGH);
  digitalWrite(LED_BUILTIN + 4, g > 0 ? LOW : HIGH);
  digitalWrite(LED_BUILTIN + 5, b > 0 ? LOW : HIGH);
}

// Scroll text across LED matrix
void scrollText(String text, int speed) {
  matrix.textScrollSpeed(speed);
  matrix.textFont(Font_5x7);
  uint32_t color = 0xFFFFFF;  // White
  matrix.beginText(13, 1, color);
  matrix.print(text);
  matrix.endText(SCROLL_LEFT);
}

// Display static text at position
void printText(String text, int x, int y) {
  matrix.textFont(Font_5x7);
  matrix.beginText(x, y, 0xFFFFFF);
  matrix.print(text);
  matrix.endText();
}

// Draw frame to LED matrix (104 bytes = 8 rows * 13 cols)
void drawFrame(uint8_t* frame_data, int len) {
  if (len != 104) return;  // Must be 8x13 = 104 bytes
  matrix.draw(frame_data);
}

// I2C receive event handler
void receiveEvent(int numBytes) {
  if (numBytes == 0) return;

  // Read command byte
  cmd_received = Wire.read();
  numBytes--;

  switch (cmd_received) {
    case CMD_SCROLL_TEXT: {
      // Format: [CMD] [len_byte] [text_bytes...] [speed_low] [speed_high]
      if (Wire.available() >= 3) {  // Need at least: len, 1 byte text, 2 bytes speed
        int text_len = Wire.read();
        // Limit text_len to prevent buffer overflow
        text_len = min(text_len, MAX_TEXT_LEN);
        // Ensure we leave 2 bytes for speed
        int available_for_text = Wire.available() - 2;
        if (available_for_text > 0) {
          text_len = min(text_len, available_for_text);
          text_buffer = "";
          for (int i = 0; i < text_len; i++) {
            text_buffer += (char)Wire.read();
          }
        } else {
          text_buffer = "";
        }
        // Read speed (2 bytes, little-endian)
        int speed = 50;  // default
        if (Wire.available() >= 2) {
          speed = Wire.read();
          speed |= Wire.read() << 8;
        }
        scrollText(text_buffer, speed);
      }
      break;
    }

    case CMD_DRAW: {
      // Format: [CMD] [104 bytes of frame data]
      uint8_t frame_data[104];
      int idx = 0;
      while (Wire.available() > 0 && idx < 104) {
        frame_data[idx++] = Wire.read();
      }
      if (idx == 104) {
        drawFrame(frame_data, 104);
      }
      break;
    }

    case CMD_SET_RGB3: {
      // Format: [CMD] [R] [G] [B]
      if (Wire.available() >= 3) {
        int r = Wire.read();
        int g = Wire.read();
        int b = Wire.read();
        setRGB3(r, g, b);
      }
      break;
    }

    case CMD_SET_RGB4: {
      // Format: [CMD] [R] [G] [B]
      if (Wire.available() >= 3) {
        int r = Wire.read();
        int g = Wire.read();
        int b = Wire.read();
        setRGB4(r, g, b);
      }
      break;
    }

    case CMD_PRINT_TEXT: {
      // Format: [CMD] [len_byte] [text_bytes...] [x] [y]
      if (Wire.available() >= 3) {  // Need at least: len, 1 byte text, x, y
        int text_len = Wire.read();
        // Limit text_len to prevent buffer overflow
        text_len = min(text_len, MAX_TEXT_LEN);
        // Ensure we leave 2 bytes for x, y
        int available_for_text = Wire.available() - 2;
        if (available_for_text > 0) {
          text_len = min(text_len, available_for_text);
          text_buffer = "";
          for (int i = 0; i < text_len; i++) {
            text_buffer += (char)Wire.read();
          }
        } else {
          text_buffer = "";
        }
        // Read x, y
        int x = 0, y = 1;
        if (Wire.available() >= 2) {
          x = Wire.read();
          y = Wire.read();
        }
        printText(text_buffer, x, y);
      }
      break;
    }
  }

  // Consume any remaining bytes
  while (Wire.available()) {
    Wire.read();
  }
}

// I2C request event handler (not used, but required)
void requestEvent() {
  // Not used - MPU only sends commands, doesn't request data
  Wire.write(0);
}

void setup() {
  // Initialize LED matrix
  matrix.begin();
  matrix.textFont(Font_5x7);
  matrix.setGrayscaleBits(8);
  matrix.clear();

  // Initialize RGB LED 3 & 4 pins
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_BUILTIN + 1, OUTPUT);
  pinMode(LED_BUILTIN + 2, OUTPUT);
  pinMode(LED_BUILTIN + 3, OUTPUT);
  pinMode(LED_BUILTIN + 4, OUTPUT);
  pinMode(LED_BUILTIN + 5, OUTPUT);

  // Start with LEDs off (active-low: HIGH = OFF)
  setRGB3(0, 0, 0);
  setRGB4(0, 0, 0);

  // Initialize I2C as slave
  Wire.begin(I2C_SLAVE_ADDR);
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);

  Serial.begin(115200);
  Serial.println("I2C LED Display ready");
}

void loop() {
  delay(100);
}
