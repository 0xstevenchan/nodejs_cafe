@echo off
echo Setting up automated maintenance task...

:: Create the scheduled task
schtasks /create /tn "CafeDB_Maintenance" /tr "node %~dp0autoMaintenance.js" /sc daily /st 00:00 /ru SYSTEM

echo Maintenance task scheduled successfully
echo Task will run daily at midnight
pause
