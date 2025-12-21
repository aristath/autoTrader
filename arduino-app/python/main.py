# Arduino Trader LED Display
# Fetches portfolio data and displays status on LED matrix

from arduino.app_utils import App, Bridge, FrameDesigner, Logger
import time
import requests

logger = Logger("trader-display")
designer = FrameDesigner()

# Matrix dimensions: 8 rows x 12 cols
ROWS = 8
COLS = 12

# API endpoint
API_URL = "http://172.17.0.1:8000"

def create_allocation_bars(eu_pct, asia_pct, us_pct):
    """Create vertical bars showing geographic allocation.
    
    EU (blue): cols 0-3
    Asia (green): cols 4-7  
    US (red): cols 8-11
    """
    frame = [[0] * COLS for _ in range(ROWS)]
    
    # Calculate bar heights (0-8 rows)
    eu_height = int(eu_pct * ROWS)
    asia_height = int(asia_pct * ROWS)
    us_height = int(us_pct * ROWS)
    
    # Fill bars from bottom up
    for row in range(ROWS):
        inv_row = ROWS - 1 - row  # Invert for bottom-up
        
        # EU bar (cols 0-3)
        if row < eu_height:
            for col in range(4):
                frame[inv_row][col] = 200
        
        # Asia bar (cols 4-7)
        if row < asia_height:
            for col in range(4, 8):
                frame[inv_row][col] = 200
        
        # US bar (cols 8-11)
        if row < us_height:
            for col in range(8, 12):
                frame[inv_row][col] = 200
    
    return frame

def create_error_frame():
    """Create X pattern for error state."""
    frame = [[0] * COLS for _ in range(ROWS)]
    
    for i in range(min(ROWS, COLS)):
        if i < ROWS and i < COLS:
            frame[i][i] = 255
        if i < ROWS and (COLS - 1 - i) >= 0:
            frame[i][COLS - 1 - i] = 255
    
    return frame

def create_idle_wave(offset):
    """Create subtle wave animation for idle state."""
    frame = [[0] * COLS for _ in range(ROWS)]
    
    import math
    for col in range(COLS):
        wave_height = int(3 + 2 * math.sin((col + offset) * 0.5))
        for row in range(ROWS - wave_height, ROWS):
            if 0 <= row < ROWS:
                frame[row][col] = 80
    
    return frame

def frame_to_bytes(frame):
    """Convert 2D frame array to bytes for LED matrix."""
    # Flatten row by row
    flat = []
    for row in frame:
        flat.extend(row)
    return bytes(flat)

def fetch_portfolio_data():
    """Fetch allocation data from trading API."""
    try:
        resp = requests.get(f"{API_URL}/api/portfolio/summary", timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.warning(f"Failed to fetch portfolio: {e}")
    return None

def fetch_status():
    """Fetch system status."""
    try:
        resp = requests.get(f"{API_URL}/api/status", timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.warning(f"Failed to fetch status: {e}")
    return None

wave_offset = 0
last_update = 0
UPDATE_INTERVAL = 30  # seconds

def loop():
    global wave_offset, last_update
    
    current_time = time.time()
    
    # Update portfolio data periodically
    if current_time - last_update > UPDATE_INTERVAL:
        last_update = current_time
        
        status = fetch_status()
        if status and status.get("status") == "healthy":
            portfolio = fetch_portfolio_data()
            
            if portfolio:
                # Show allocation bars
                eu = portfolio.get("geo_eu_pct", 0) / 100
                asia = portfolio.get("geo_asia_pct", 0) / 100
                us = portfolio.get("geo_us_pct", 0) / 100
                
                frame = create_allocation_bars(eu, asia, us)
                Bridge.call("draw", frame_to_bytes(frame))
                logger.info(f"Updated display: EU={eu:.0%} Asia={asia:.0%} US={us:.0%}")
                return
        
        # Show error if API not reachable
        frame = create_error_frame()
        Bridge.call("draw", frame_to_bytes(frame))
        logger.warning("API not reachable, showing error")
        return
    
    # Idle animation between updates
    wave_offset += 1
    frame = create_idle_wave(wave_offset)
    Bridge.call("draw", frame_to_bytes(frame))
    time.sleep(0.2)

logger.info("Arduino Trader LED Display started")
App.run(user_loop=loop)
