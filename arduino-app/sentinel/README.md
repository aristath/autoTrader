# Sentinel UNO Q application

This directory contains the current 8x5 NeoPixel soroban display application.
The Linux side polls Sentinel, sends `[value, return_pct, recommendations,
broker_connected]` through `Bridge.call("hm.u", ...)`, and reports bridge health
back to Sentinel.

The canonical architecture, display encoding, environment variables, watchdog
behavior, and file map are documented in
[`docs/hardware-led.md`](../../docs/hardware-led.md).

The older 8x13 treemap/orbital experiments are separate firmware and are not
the protocol implemented by this application.
