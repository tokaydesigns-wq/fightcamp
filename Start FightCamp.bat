@echo off
rem Starts FightCamp on this computer and opens it in your browser.
rem Keep this window open while you use the app. Close it to stop.
cd /d "%~dp0"
start "" http://localhost:8124
python -m http.server 8124
