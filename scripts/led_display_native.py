#!/usr/bin/env python3
"""Native LED Display Script for Arduino Uno Q.

Polls the FastAPI application for display text and sends it to the MCU via I2C.
Runs as a systemd service, replacing the Docker-based Arduino App framework implementation.
Bypasses Docker and Router Bridge by using direct I2C communication.
"""

import logging
import sys
import time
from pathlib import Path
from typing import Optional

import requests

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings  # noqa: E402

# Configure logging
log_dir = settings.data_dir / "logs"
log_dir.mkdir(parents=True, exist_ok=True)

file_handler = logging.FileHandler(log_dir / "led-display.log")
file_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)

console_handler = logging.StreamHandler()
console_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
)

logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler],
)

logger = logging.getLogger(__name__)

# Configuration
API_URL = "http://localhost:8000"
POLL_INTERVAL = 1.0  # Poll every 1 second (optimized)
API_RETRY_DELAY = 5.0  # Retry API connection after 5 seconds
DEFAULT_TICKER_SPEED = 50  # ms per scroll step

# Try to import I2C client
try:
    # Import from scripts directory
    import importlib.util

    i2c_client_path = Path(__file__).parent / "i2c_led_client.py"
    spec = importlib.util.spec_from_file_location("i2c_led_client", i2c_client_path)
    if spec and spec.loader:
        i2c_client_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(i2c_client_module)
        scroll_text = i2c_client_module.scroll_text
        set_rgb3 = i2c_client_module.set_rgb3
        set_rgb4 = i2c_client_module.set_rgb4
        I2C_AVAILABLE = True
    else:
        raise ImportError("Failed to load i2c_led_client module")
except ImportError as e:
    logger.warning(f"I2C client not available: {e}")
    I2C_AVAILABLE = False
    scroll_text = None
    set_rgb3 = None
    set_rgb4 = None
except Exception as e:
    logger.error(f"Failed to initialize I2C client: {e}")
    I2C_AVAILABLE = False
    scroll_text = None
    set_rgb3 = None
    set_rgb4 = None

_session = requests.Session()
_last_text = ""
_last_text_speed = 0
_last_led3 = None
_last_led4 = None


def set_text(text: str, speed: int = DEFAULT_TICKER_SPEED) -> bool:
    """Send text to MCU for scrolling via I2C.

    Args:
        text: Text to scroll (ASCII only, Euro symbol will be replaced)
        speed: Milliseconds per scroll step (lower = faster)

    Returns:
        True if successful, False otherwise
    """
    if not I2C_AVAILABLE:
        logger.error("I2C client not available")
        return False

    if not text:
        return True  # Empty text is valid

    try:
        return scroll_text(text, speed)
    except Exception as e:
        logger.error(f"Failed to set text via I2C: {e}")
        return False


def fetch_display_data() -> Optional[dict]:
    """Fetch display state from API. Returns None on error."""
    try:
        # Fetch full display state which includes ticker_text and ticker_speed
        response = _session.get(f"{API_URL}/api/status/led/display", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"API returned status {response.status_code}")
            return None
    except requests.exceptions.ConnectionError:
        logger.warning("API connection failed, will retry")
        return None
    except requests.exceptions.Timeout:
        logger.warning("API request timed out")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching display data: {e}")
        return None


def _process_display_data(data: dict) -> None:
    """Process display data and update MCU if changed."""
    global _last_text, _last_text_speed, _last_led3, _last_led4

    # Get ticker text from display state
    ticker_text = data.get("ticker_text", "")
    ticker_speed = data.get("ticker_speed", DEFAULT_TICKER_SPEED)

    # Handle different display modes
    mode = data.get("mode", "normal")
    error_message = data.get("error_message")
    activity_message = data.get("activity_message")
    led3 = data.get("led3", [0, 0, 0])
    led4 = data.get("led4", [0, 0, 0])

    # Update RGB LEDs (only if changed - optimization)
    led3_tuple = tuple(led3)
    if _last_led3 != led3_tuple and I2C_AVAILABLE and set_rgb3:
        set_rgb3(led3[0], led3[1], led3[2])
        _last_led3 = led3_tuple

    led4_tuple = tuple(led4)
    if _last_led4 != led4_tuple and I2C_AVAILABLE and set_rgb4:
        set_rgb4(led4[0], led4[1], led4[2])
        _last_led4 = led4_tuple

    # Determine what text to display (priority: error > activity > ticker)
    if mode == "error" and error_message:
        display_text = error_message
    elif activity_message:
        display_text = activity_message
    elif ticker_text:
        display_text = ticker_text
    else:
        display_text = ""

    # Update text only if changed (optimization)
    if display_text != _last_text or ticker_speed != _last_text_speed:
        logger.info(f"Updating display text: {display_text[:50]}...")
        if set_text(display_text, speed=ticker_speed):
            _last_text = display_text
            _last_text_speed = ticker_speed
        else:
            logger.error("Failed to update display text")


def main_loop():
    """Main loop - fetch display text from API, update MCU via I2C."""
    global _last_text

    logger.info("Starting LED display native script (I2C mode)")
    logger.info(f"API URL: {API_URL}")

    if not I2C_AVAILABLE:
        logger.error("I2C client not available. Exiting.")
        logger.error("Make sure smbus2 is installed: pip install smbus2")
        logger.error("Make sure user is in i2c group: sudo usermod -aG i2c $USER")
        sys.exit(1)

    # Test I2C connection
    try:
        if scroll_text("TEST", 50):
            logger.info("I2C connection test successful")
        else:
            logger.error("I2C connection test failed")
            sys.exit(1)
    except Exception as e:
        logger.error(f"I2C connection test failed: {e}")
        logger.error("Make sure the MCU sketch is uploaded and I2C is working")
        sys.exit(1)

    consecutive_errors = 0
    max_consecutive_errors = 10

    while True:
        try:
            # Fetch data from API
            data = fetch_display_data()

            if data is None:
                # API unavailable - show error on display
                if _last_text != "API OFFLINE":
                    set_text("API OFFLINE", speed=DEFAULT_TICKER_SPEED)
                    _last_text = "API OFFLINE"
                consecutive_errors += 1
                if consecutive_errors >= max_consecutive_errors:
                    logger.error("Too many consecutive API errors, exiting")
                    sys.exit(1)
                time.sleep(API_RETRY_DELAY)
                continue

            consecutive_errors = 0
            _process_display_data(data)

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Received interrupt signal, shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        main_loop()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
