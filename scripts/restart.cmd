@echo off
REM LearnLab Bridge - Restart Wrapper for Windows CMD
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart.ps1" %*
