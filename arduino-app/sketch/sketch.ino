// Arduino Trader LED Display
// Controls 8x13 LED matrix on Arduino UNO Q

#include <Arduino_RouterBridge.h>
#include <Arduino_LED_Matrix.h>
#include <vector>

Arduino_LED_Matrix matrix;

void draw(std::vector<uint8_t> frame) {
  if (frame.empty() || frame.size() != 104) {
    return;
  }
  matrix.draw(frame.data());
}

void setup() {
  matrix.begin();
  Serial.begin(115200);
  matrix.setGrayscaleBits(8);  // For 0-255 brightness values
  matrix.clear();

  Bridge.begin();
  Bridge.provide("draw", draw);
}

void loop() {
  delay(100);
}
