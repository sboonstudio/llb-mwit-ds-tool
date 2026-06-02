# LearnLab Bridge: Insight Engine v0.3.1 (Documentation)

## Overview
The Insight Engine is a deep telemetry system designed to capture student behavioral data within JupyterLab environments. It uses a non-blocking Syslog-based architecture to ensure performance is not impacted while providing granular visibility into learning patterns.

## Data Collection Components

### 1. Shell Command Tracker (`shell_logger.sh`)
- **Action**: `SHELL_CMD`
- **Captured Data**: Full text of commands executed in the terminal.
- **Context**: Injected via `PROMPT_COMMAND` in the student's `.bashrc`.

### 2. IPython Cell Tracker (`ipython_logger.py`)
- **Action**: `CELL_EXECUTION`
- **Captured Data**: 
  - `code`: The Python code snippet executed.
  - `path`: The path to the active `.ipynb` file.
  - `success`: Boolean status of execution.
  - `error_type`/`error_msg`: Detailed error information if failed.
- **Context**: Registered as an IPython event hook in `profile_default`.

### 3. File Operations Tracker (`file_tracker.py`)
- **Action**: `FILE_OPEN`, `FILE_SAVE`, `FILE_DELETE`
- **Captured Data**: Path to the file and the operation type.
- **Context**: Implemented as a Jupyter Server Extension.

## Infrastructure Architecture
1. **Source**: Student containers send JSON-formatted Syslog messages over UDP (Port 514).
2. **Collector**: `llbridge-log-collector` (Vector.dev) ingests UDP packets, buffers them, and converts them to Batch HTTP POST requests.
3. **Sink**: Web Backend API (`/api/jupyter/report`) authenticates, parses the logs, and stores them in the Prisma/SQLite database.
4. **Visualization**: Admin Insights Dashboard (`/admin/insights`) uses Apache ECharts to render trends, rankings, and error distributions.

## How to Verify
1. Log in as a student and launch JupyterLab.
2. Open a notebook and run any Python code.
3. Open a terminal and run `pip list` or `ls`.
4. Check the `ActivityLog` table in the database or the Admin Dashboard to see the events appear.

---
*Last Updated: 2026-06-02 (Insight Engine v0.3.1)*
