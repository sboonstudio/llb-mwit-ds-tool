#!/bin/bash
# Shell Logger for LearnLab Bridge
# Sends bash commands to the centralized log collector

LOG_SERVER=${LLBRIDGE_LOG_HOST:-llbridge-log-collector}
LOG_PORT=${LLBRIDGE_LOG_PORT:-514}
USER=${JUPYTERHUB_USER:-unknown}

# Function to escape string for JSON
json_escape() {
    printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

# Function to send logs via UDP
send_log() {
    local msg="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local host=$(hostname)
    # Syslog format
    local syslog_msg="<14>1 $timestamp $host llbridge-shell $$ - - $msg"
    
    # Use /dev/udp for lightweight sending
    (echo "$syslog_msg" > /dev/udp/$LOG_SERVER/$LOG_PORT) 2>/dev/null
}

# Trap every command execution
log_command() {
    # Get last command from history
    local cmd=$(history 1 | sed 's/^[ ]*[0-9]*[ ]*//')
    
    # Avoid logging the same command multiple times if prompt redraws
    if [ "$cmd" != "$LAST_LOGGED_CMD" ] && [ -n "$cmd" ]; then
        local escaped_cmd=$(json_escape "$cmd")
        send_log "{\"event\": \"SHELL_CMD\", \"user\": \"$USER\", \"cmd\": $escaped_cmd}"
        export LAST_LOGGED_CMD="$cmd"
    fi
}

# Send session start event
send_log "{\"event\": \"SHELL_START\", \"user\": \"$USER\"}"

# Set PROMPT_COMMAND to run log_command before every prompt
export PROMPT_COMMAND="log_command; $PROMPT_COMMAND"
