#!/bin/bash
#
# Service Selection
# Interactive selection of which services to run on this device
#

select_services() {
    local all_services=("planning" "opportunity" "generator" "coordinator" "evaluator-1" "evaluator-2" "evaluator-3" "scoring" "optimization" "portfolio" "trading" "universe" "gateway")
    local service_ports=("8006" "8008" "8009" "8011" "8010" "8020" "8030" "8004" "8005" "8002" "8003" "8001" "8007")
    local current_services=()

    # If existing install, read current services
    if [ "$INSTALL_TYPE" = "existing" ]; then
        local device_config="/home/arduino/arduino-trader/app/config/device.yaml"
        if [ -f "$device_config" ] && command -v yq &> /dev/null; then
            current_services=($(yq '.device.roles[]' "$device_config" 2>/dev/null))
        fi
    fi

    echo ""
    echo "Which services should run on THIS device?"
    echo ""
    echo "Planning Services (choose one approach):"
    echo "  [1] planning        (HTTP 8006)  Monolithic (legacy/fallback)"
    echo "  [2] opportunity     (HTTP 8008)  Microservice architecture ↓"
    echo "  [3] generator       (HTTP 8009)"
    echo "  [4] coordinator     (HTTP 8011)"
    echo "  [5] evaluator-1     (HTTP 8010)"
    echo "  [6] evaluator-2     (HTTP 8020)"
    echo "  [7] evaluator-3     (HTTP 8030)"
    echo ""
    echo "Core Services:"
    echo "  [8] scoring         (HTTP 8004)"
    echo "  [9] optimization    (HTTP 8005)"
    echo "  [10] portfolio      (HTTP 8002)"
    echo "  [11] trading        (HTTP 8003)"
    echo "  [12] universe       (HTTP 8001)"
    echo ""
    echo "Gateway:"
    echo "  [13] gateway        (HTTP 8007)"
    echo ""
    echo "Currently configured:"

    # Display current status for existing installations
    if [ "$INSTALL_TYPE" = "existing" ]; then
        local device_config="/home/arduino/arduino-trader/app/config/device.yaml"
        if [ -f "$device_config" ] && command -v yq &> /dev/null; then
            current_services=($(yq '.device.roles[]' "$device_config" 2>/dev/null))
            for i in "${!all_services[@]}"; do
                local service="${all_services[$i]}"
                local num=$((i + 1))
                if [[ " ${current_services[@]} " =~ " ${service} " ]]; then
                    echo "  [$num] $service: LOCAL"
                fi
            done
        fi
    else
        echo "  (New installation - no services configured yet)"
    fi
    echo ""

    # Skip individual service display, use grouped display above
    if false; then
        for i in "${!all_services[@]}"; do
        local service="${all_services[$i]}"
        local port="${service_ports[$i]}"
        local num=$((i + 1))
        local status=""

        if [ "$INSTALL_TYPE" = "existing" ]; then
            if [[ " ${current_services[@]} " =~ " ${service} " ]]; then
                status="  Currently: LOCAL"
            else
                status="  Currently: REMOTE"
            fi
        fi

        printf "  [%d] %-15s (HTTP %s)%s\n" "$num" "$service" "$port" "$status"
    done
    fi

    echo ""
    echo "Options:"
    echo "  - Enter numbers (e.g., 1,8,12,13 for Monolithic Planning + Core + Gateway)"
    echo "  - Or: 2,3,4,5,8,9,10,11,12,13 for Microservices (1 evaluator)"
    echo "  - Or: 2,3,4,5,6,7,8,9,10,11,12,13 for Microservices (3 evaluators)"
    echo "  - Enter 'all' for single-device deployment (all 13 services)"
    echo ""
    echo "NOTE: Choose either planning (#1) OR microservices (#2-7), not both"
    echo ""

    # Get user selection
    local selection=""
    while true; do
        read -p "Select: " selection

        if [ "$selection" = "all" ]; then
            SELECTED_SERVICES=("${all_services[@]}")
            echo ""
            print_msg "${GREEN}" "→ Running ALL services on this device (single-device mode)"
            print_msg "${GREEN}" "→ Ports 8001-8011, 8020, 8030 will be used (Gateway also exposed on 8000)"
            break
        else
            # Parse comma-separated numbers
            IFS=',' read -ra numbers <<< "$selection"
            local valid=true
            SELECTED_SERVICES=()

            for num in "${numbers[@]}"; do
                # Trim whitespace
                num=$(echo "$num" | xargs)

                if [[ "$num" =~ ^[1-9]$|^1[0-3]$ ]]; then
                    local idx=$((num - 1))
                    SELECTED_SERVICES+=("${all_services[$idx]}")
                else
                    echo "Invalid selection: $num (must be 1-13)"
                    valid=false
                    break
                fi
            done

            if $valid && [ ${#SELECTED_SERVICES[@]} -gt 0 ]; then
                echo ""
                print_msg "${GREEN}" "→ Selected: ${SELECTED_SERVICES[*]} (${#SELECTED_SERVICES[@]} services)"

                if [ ${#SELECTED_SERVICES[@]} -lt 13 ]; then
                    # Distributed mode
                    local unselected=()
                    for service in "${all_services[@]}"; do
                        if [[ ! " ${SELECTED_SERVICES[@]} " =~ " ${service} " ]]; then
                            unselected+=("$service")
                        fi
                    done
                    print_msg "${YELLOW}" "→ Moving to other devices: ${unselected[*]} (${#unselected[@]} services)"
                    print_msg "${BLUE}" "→ Deployment mode: DISTRIBUTED"
                fi
                break
            else
                echo "Invalid selection. Please try again."
            fi
        fi
    done

    # Validate that gateway is selected if not all services
    if [ ${#SELECTED_SERVICES[@]} -lt 13 ]; then
        if [[ ! " ${SELECTED_SERVICES[@]} " =~ " gateway " ]]; then
            print_warning "Gateway service not selected. At least one device must run the gateway."
            read -p "Continue anyway? [y/N]: " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                select_services  # Restart selection
                return
            fi
        fi
    fi
}
