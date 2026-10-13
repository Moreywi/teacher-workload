@echo off
chcp 65001 >nul
echo Остановка системы...
docker compose down
echo.
echo Готово. Данные сохранены.
timeout /t 3 /nobreak >nul