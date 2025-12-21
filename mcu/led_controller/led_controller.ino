/*
 * Arduino Trader - LED Controller for Arduino Uno Q
 *
 * Controls the 8x13 blue LED matrix and 4 RGB LEDs
 * Receives JSON commands via serial from the Linux side
 *
 * Commands:
 * - {"cmd":"mode","mode":"idle|health|trading|error"}
 * - {"cmd":"allocation","eu":0.5,"asia":0.3,"us":0.2}
 * - {"cmd":"status","color":[r,g,b]}
 * - {"cmd":"trade","symbol":"AAPL","side":"BUY"}
 * - {"cmd":"scroll","text":"Hello"}
 * - {"cmd":"clear"}
 * - {"cmd":"success"}
 * - {"cmd":"error","message":"..."}
 */

#include <ArduinoJson.h>
#include "Arduino_LED_Matrix.h"

// LED Matrix (8x13 = 104 LEDs, but Arduino LED Matrix lib uses 8x12)
ArduinoLEDMatrix matrix;

// Matrix dimensions
#define MATRIX_ROWS 8
#define MATRIX_COLS 12  // Using 12 of 13 columns

// RGB LED pins (adjust based on actual Uno Q pinout)
#define RGB1_R 2
#define RGB1_G 3
#define RGB1_B 4
#define RGB2_R 5
#define RGB2_G 6
#define RGB2_B 7
#define RGB3_R 8
#define RGB3_G 9
#define RGB3_B 10
#define RGB4_R 11
#define RGB4_G 12
#define RGB4_B 13

// Current state
String currentMode = "idle";
float allocEU = 0.0;
float allocAsia = 0.0;
float allocUS = 0.0;
uint8_t statusColor[3] = {0, 255, 0};  // Green = OK
String scrollText = "";
int scrollPos = 0;

// Animation timing
unsigned long lastUpdate = 0;
const int updateInterval = 100;  // ms
int animFrame = 0;

// Frame buffer for matrix
uint8_t frame[MATRIX_ROWS][MATRIX_COLS];

void setup() {
    Serial.begin(115200);
    while (!Serial) delay(10);

    // Initialize LED matrix
    matrix.begin();

    // Initialize RGB LED pins
    pinMode(RGB1_R, OUTPUT);
    pinMode(RGB1_G, OUTPUT);
    pinMode(RGB1_B, OUTPUT);
    pinMode(RGB2_R, OUTPUT);
    pinMode(RGB2_G, OUTPUT);
    pinMode(RGB2_B, OUTPUT);
    pinMode(RGB3_R, OUTPUT);
    pinMode(RGB3_G, OUTPUT);
    pinMode(RGB3_B, OUTPUT);
    pinMode(RGB4_R, OUTPUT);
    pinMode(RGB4_G, OUTPUT);
    pinMode(RGB4_B, OUTPUT);

    // Initial state
    clearFrame();
    setRGBStatus(0, 255, 0);  // Green = ready

    Serial.println("{\"status\":\"ready\"}");
}

void loop() {
    // Check for serial commands
    if (Serial.available()) {
        String input = Serial.readStringUntil('\n');
        processCommand(input);
    }

    // Update animations
    unsigned long now = millis();
    if (now - lastUpdate >= updateInterval) {
        lastUpdate = now;
        updateDisplay();
        animFrame++;
    }
}

void processCommand(String json) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, json);

    if (error) {
        Serial.println("{\"error\":\"parse_failed\"}");
        return;
    }

    String cmd = doc["cmd"].as<String>();

    if (cmd == "mode") {
        currentMode = doc["mode"].as<String>();
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "allocation") {
        allocEU = doc["eu"].as<float>();
        allocAsia = doc["asia"].as<float>();
        allocUS = doc["us"].as<float>();
        currentMode = "health";
        updateAllocationDisplay();
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "status") {
        statusColor[0] = doc["color"][0];
        statusColor[1] = doc["color"][1];
        statusColor[2] = doc["color"][2];
        setRGBStatus(statusColor[0], statusColor[1], statusColor[2]);
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "trade") {
        String symbol = doc["symbol"].as<String>();
        String side = doc["side"].as<String>();
        showTradeAnimation(symbol, side);
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "scroll") {
        scrollText = doc["text"].as<String>();
        scrollPos = MATRIX_COLS;
        currentMode = "scroll";
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "clear") {
        clearFrame();
        renderFrame();
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "success") {
        showSuccessAnimation();
        Serial.println("{\"ok\":true}");
    }
    else if (cmd == "error") {
        currentMode = "error";
        Serial.println("{\"ok\":true}");
    }
    else {
        Serial.println("{\"error\":\"unknown_cmd\"}");
    }
}

void updateDisplay() {
    if (currentMode == "idle") {
        updateIdleAnimation();
    }
    else if (currentMode == "health") {
        // Static display, no animation needed
    }
    else if (currentMode == "error") {
        updateErrorAnimation();
    }
    else if (currentMode == "scroll") {
        updateScrollAnimation();
    }
}

void updateIdleAnimation() {
    // Subtle breathing effect
    clearFrame();

    int brightness = (sin(animFrame * 0.1) + 1) * 0.5 * 255;

    // Draw a simple wave pattern
    for (int col = 0; col < MATRIX_COLS; col++) {
        int row = 3 + sin((col + animFrame) * 0.5) * 2;
        if (row >= 0 && row < MATRIX_ROWS) {
            frame[row][col] = 1;
        }
    }

    renderFrame();
}

void updateAllocationDisplay() {
    clearFrame();

    // Target lines (dotted) at rows 0-1
    // Actual allocation bars below

    // EU: columns 0-3
    int euHeight = allocEU * MATRIX_ROWS;
    int euTarget = 0.5 * MATRIX_ROWS;
    drawBar(0, euHeight, 0, 3);

    // Asia: columns 5-8
    int asiaHeight = allocAsia * MATRIX_ROWS;
    int asiaTarget = 0.3 * MATRIX_ROWS;
    drawBar(asiaHeight, 0, 5, 8);

    // US: columns 10-11
    int usHeight = allocUS * MATRIX_ROWS;
    int usTarget = 0.2 * MATRIX_ROWS;
    drawBar(usHeight, 0, 10, 11);

    // Update RGB LEDs to show allocation vs target
    setRGBAllocation(1, allocEU, 0.5);   // EU
    setRGBAllocation(2, allocAsia, 0.3); // Asia
    setRGBAllocation(3, allocUS, 0.2);   // US

    renderFrame();
}

void drawBar(int height, int startRow, int startCol, int endCol) {
    for (int row = MATRIX_ROWS - 1; row >= MATRIX_ROWS - height && row >= 0; row--) {
        for (int col = startCol; col <= endCol && col < MATRIX_COLS; col++) {
            frame[row][col] = 1;
        }
    }
}

void updateErrorAnimation() {
    // Blinking pattern
    if ((animFrame / 5) % 2 == 0) {
        // Fill with X pattern
        for (int i = 0; i < MATRIX_ROWS && i < MATRIX_COLS; i++) {
            frame[i][i] = 1;
            frame[i][MATRIX_COLS - 1 - i] = 1;
        }
    } else {
        clearFrame();
    }
    renderFrame();

    // Blink status LED red
    if ((animFrame / 5) % 2 == 0) {
        setRGBStatus(255, 0, 0);
    } else {
        setRGBStatus(0, 0, 0);
    }
}

void updateScrollAnimation() {
    clearFrame();

    // Simple scrolling - just show position indicator
    int pos = scrollPos % MATRIX_COLS;
    for (int row = 0; row < MATRIX_ROWS; row++) {
        frame[row][pos] = 1;
    }

    scrollPos--;
    if (scrollPos < -((int)scrollText.length() * 6)) {
        scrollPos = MATRIX_COLS;
    }

    renderFrame();
}

void showTradeAnimation(String symbol, String side) {
    // Flash animation for trade
    bool isBuy = (side == "BUY");

    for (int i = 0; i < 3; i++) {
        // Fill
        for (int r = 0; r < MATRIX_ROWS; r++) {
            for (int c = 0; c < MATRIX_COLS; c++) {
                frame[r][c] = 1;
            }
        }
        renderFrame();

        if (isBuy) {
            setRGBStatus(0, 255, 0);  // Green for buy
        } else {
            setRGBStatus(255, 0, 0);  // Red for sell
        }

        delay(150);

        clearFrame();
        renderFrame();
        setRGBStatus(0, 0, 0);
        delay(100);
    }

    // Return to health mode
    currentMode = "health";
    updateAllocationDisplay();
}

void showSuccessAnimation() {
    // Checkmark animation
    clearFrame();

    // Draw checkmark
    frame[5][2] = 1;
    frame[6][3] = 1;
    frame[7][4] = 1;
    frame[6][5] = 1;
    frame[5][6] = 1;
    frame[4][7] = 1;
    frame[3][8] = 1;
    frame[2][9] = 1;

    renderFrame();
    setRGBStatus(0, 255, 0);

    delay(2000);

    // Return to previous mode
    if (currentMode != "health") {
        currentMode = "idle";
    }
}

void setRGBStatus(uint8_t r, uint8_t g, uint8_t b) {
    // RGB LED 1: System status
    analogWrite(RGB1_R, r);
    analogWrite(RGB1_G, g);
    analogWrite(RGB1_B, b);
}

void setRGBAllocation(int led, float actual, float target) {
    // LEDs 2-4: Allocation indicators
    // Green if within 5%, yellow if off, red if very off

    float diff = actual - target;
    uint8_t r, g, b;

    if (abs(diff) < 0.05) {
        // On target: green
        r = 0; g = 255; b = 0;
    } else if (diff < 0) {
        // Underweight: yellow/orange
        r = 255; g = 165; b = 0;
    } else {
        // Overweight: blue
        r = 0; g = 100; b = 255;
    }

    // Brightness based on how far from target
    float brightness = min(1.0f, abs(diff) * 5 + 0.3f);
    r *= brightness;
    g *= brightness;
    b *= brightness;

    switch (led) {
        case 1:
            analogWrite(RGB2_R, r);
            analogWrite(RGB2_G, g);
            analogWrite(RGB2_B, b);
            break;
        case 2:
            analogWrite(RGB3_R, r);
            analogWrite(RGB3_G, g);
            analogWrite(RGB3_B, b);
            break;
        case 3:
            analogWrite(RGB4_R, r);
            analogWrite(RGB4_G, g);
            analogWrite(RGB4_B, b);
            break;
    }
}

void clearFrame() {
    for (int r = 0; r < MATRIX_ROWS; r++) {
        for (int c = 0; c < MATRIX_COLS; c++) {
            frame[r][c] = 0;
        }
    }
}

void renderFrame() {
    matrix.renderBitmap(frame, MATRIX_ROWS, MATRIX_COLS);
}
