#!/bin/bash
# Shell Logger for LearnLab Bridge
# Sends bash commands to the centralized log collector

LOG_SERVER=${LLBRIDGE_LOG_HOST:-llbridge-log-collector}
LOG_PORT=${LLBRIDGE_LOG_PORT:-514}

# Function to send logs via UDP
send_log() {
    local msg="$1"
    # Basic Syslog format: <PRI>TIMESTAMP HOST TAG: MSG
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local host=$(hostname)
    local syslog_msg="<14>1 $timestamp $host llbridge-shell $$ - - $msg"
    
    # Use /dev/udp for lightweight sending if available
    (echo "$syslog_msg" > /dev/udp/$LOG_SERVER/$LOG_PORT) 2>/dev/null
}

# Trap every command execution
log_command() {
    local cmd=$(history 1 | sed 's/^[ ]*[0-9]*[ ]*//')
    if [ "$cmd" != "$LAST_LOGGED_CMD" ]; then
        send_log "{\"event\": \"SHELL_CMD\", \"cmd\": \"$cmd\"}"
        export LAST_LOGGED_CMD="$cmd"
    fi
}

# Set PROMPT_COMMAND to run log_command before every prompt
export PROMPT_COMMAND="log_command; $PROMPT_COMMAND"
