// Arduino Trader LED Display
// Controls 8x12 LED matrix to show portfolio status

#include <Arduino_RouterBridge.h>
#include <Arduino_LED_Matrix.h>
#include <vector>

Arduino_LED_Matrix matrix;

// Draw raw frame data
void draw(std::vector<uint8_t> frame) {
  if (frame.empty()) return;
  matrix.draw(frame.data());
}

// Play animation sequence
void play_animation(std::vector<uint8_t> animation_bytes) {
  if (animation_bytes.empty()) return;
  
  const int BYTES_PER_FRAME = 20;
  int frame_count = animation_bytes.size() / BYTES_PER_FRAME;
  if (frame_count == 0 || frame_count > 50) return;
  
  static uint32_t animation[50][5];
  const uint8_t* data = animation_bytes.data();
  
  for (int i = 0; i < frame_count; i++) {
    for (int j = 0; j < 5; j++) {
      int offset = (i * 5 + j) * 4;
      animation[i][j] = ((uint32_t)data[offset]) |
                        ((uint32_t)data[offset + 1] << 8) |
                        ((uint32_t)data[offset + 2] << 16) |
                        ((uint32_t)data[offset + 3] << 24);
    }
  }
  
  matrix.loadWrapper(animation, frame_count * 5 * sizeof(uint32_t));
  matrix.playSequence(false);
}

void setup() {
  matrix.begin();
  Serial.begin(115200);
  matrix.setGrayscaleBits(8);
  matrix.clear();
  
  Bridge.begin();
  Bridge.provide("draw", draw);
  Bridge.provide("play_animation", play_animation);
}

void loop() {
  delay(200);
}
