#!/bin/bash
# Monitor planner status and trades

SSH_CMD="sshpass -p 'aristath' ssh -o StrictHostKeyChecking=no arduino@192.168.1.11"
LOG_FILE="/home/arduino/arduino-trader/data/logs/arduino-trader.log"

echo "=== Monitoring Planner Status ==="
echo "Timestamp: $(date)"

# Check for errors
echo ""
echo "--- Recent Errors ---"
$SSH_CMD "tail -200 $LOG_FILE | grep -iE 'error|exception|traceback|failed.*evaluate' | tail -10"

# Check planner batch status
echo ""
echo "--- Planner Batch Status ---"
$SSH_CMD "tail -100 $LOG_FILE | grep -iE 'planner.*batch|generated.*sequences|inserted.*sequences|evaluated' | tail -10"

# Check event-based trading
echo ""
echo "--- Event-Based Trading Status ---"
$SSH_CMD "tail -100 $LOG_FILE | grep -iE 'event.*based.*trading|waiting.*planning|all.*sequences.*evaluated|trade.*execut|executing.*trade' | tail -10"

# Check service status
echo ""
echo "--- Service Status ---"
$SSH_CMD "ps aux | grep uvicorn | grep -v grep | head -1"

echo ""
echo "=== End of Status Check ==="
echo ""
