@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск системы распределения нагрузки
echo ========================================
echo.

echo Проверка Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Docker не установлен!
    echo Скачайте Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo.
echo Проверка, загружены ли образы...
docker image inspect teacher-load-backend >nul 2>&1
if errorlevel 1 (
    echo Образы не найдены. Загрузка из images.tar...
    echo Это займёт 1-2 минуты при первом запуске.
    echo.
    docker load -i images.tar
    if errorlevel 1 (
        echo.
        echo [ОШИБКА] Не удалось загрузить образы.
        echo Проверьте, что файл images.tar находится рядом с START.bat.
        pause
        exit /b 1
    )
    echo.
    echo Образы успешно загружены.
) else (
    echo Образы уже загружены, пропускаем.
)

echo.
echo Запуск контейнеров...
docker compose -p teacher-load up -d

if errorlevel 1 (
    echo.
    echo [ОШИБКА] Не удалось запустить контейнеры.
    echo Проверьте, что Docker Desktop запущен.
    pause
    exit /b 1
)

echo.
echo Ожидание запуска сервисов (15 секунд)...
timeout /t 15 /nobreak >nul

echo.
echo Открытие браузера...
start http://localhost:8080

echo.
echo ========================================
echo   Готово!
echo   Адрес: http://localhost:8080
echo   Логин: admin@example.com
echo   Пароль: admin123
echo ========================================
echo.
echo Для остановки системы запустите STOP.bat
echo.
pause