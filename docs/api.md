# REST API

Base URL: `http://localhost:3000`

Все защищённые эндпоинты требуют:

```
Authorization: Bearer <JWT>
```

## Аутентификация

### POST /auth/login

**Request:**
```json
{ "email": "admin@example.com", "password": "admin123" }
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "ADMIN",
    "teacherId": null
  }
}
```

### GET /auth/me

Текущий пользователь.

### POST /auth/change-password

**Request:**
```json
{ "oldPassword": "teacher123", "newPassword": "newpass123" }
```

**Response 200:**
```json
{ "ok": true }
```

**Ошибки:**
- `400 Неверный текущий пароль`
- `400 Пароль минимум 6 символов`
- `401 Требуется авторизация`

При смене пароля поле `initial_password` в БД обновляется на новый пароль — администратор всегда видит актуальный.

---

## Преподаватели

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/teachers` | Список с компетенциями, email и паролем |
| POST | `/teachers` | Создать |
| PATCH | `/teachers/:id` | Обновить |
| DELETE | `/teachers/:id` | Удалить |
| PUT | `/teachers/:id/competencies` | Заменить компетенции |

**GET /teachers — ответ:**
```json
[
  {
    "id": "...",
    "fullName": "Ковалёв",
    "maxPairs": null,
    "email": "kovalev@example.com",
    "initialPassword": "teacher123",
    "disciplineIds": ["disc1", "disc2"],
    "disciplineNames": ["Компьютерные сети", "ЭВМ"]
  }
]
```

**POST /teachers — тело:**
```json
{ "fullName": "Иванов Иван Иванович", "maxPairs": 500 }
```

**POST /teachers — ответ:**
```json
{
  "id": "...",
  "fullName": "Иванов Иван Иванович",
  "maxPairs": 500,
  "email": "ivanov@example.com",
  "initialPassword": "d8ke7wtu",
  "disciplineIds": [],
  "disciplineNames": []
}
```

При создании преподавателя система генерирует email (транслит фамилии + `@example.com`) и пароль (8 символов). Пароль сохраняется в `password_hash` (argon2) и в `initial_password` (открытый, для админа).

**PUT /teachers/:id/competencies — тело:**
```json
{ "disciplineIds": ["disc1", "disc2"] }
```

---

## Дисциплины

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/disciplines` | Список |
| POST | `/disciplines` | Создать |
| PATCH | `/disciplines/:id` | Переименовать |
| DELETE | `/disciplines/:id` | Удалить |

---

## Группы

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/groups` | Список групп |

---

## Аудитории

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/audiences` | Список |
| POST | `/audiences` | Создать |
| DELETE | `/audiences/:id` | Удалить |

**POST /audiences — тело:**
```json
{ "name": "405", "capacity": 25 }
```

---

## Workload'ы

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/workloads` | Список |
| POST | `/workloads` | Создать вручную |
| POST | `/workloads/generate` | Перегенерировать всё |
| PATCH | `/workloads/:id` | Изменить |
| DELETE | `/workloads/:id` | Удалить |

**POST /workloads — тело:**
```json
{
  "disciplineId": "...",
  "type": "LECTURE",
  "pairs": 18,
  "groupIds": ["g1", "g2"]
}
```

---

## Назначения

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/allocations` | Снимок |
| POST | `/allocations/run` | Запустить алгоритм |
| PATCH | `/allocations/:workloadId` | Ручная правка |
| DELETE | `/allocations/manual` | Сбросить ручные |

**GET /allocations — структура:**
```json
{
  "allocations": [],
  "workloads": [],
  "unassigned": [],
  "loadByTeacher": { "teacherId": 162 },
  "teachers": [],
  "disciplines": [],
  "groups": [],
  "competencies": []
}
```

---

## Расписание

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/schedule` | Список пар (с фильтрами) |
| GET | `/schedule/grid` | Сетка на неделю |
| POST | `/schedule` | Создать пару |
| POST | `/schedule/generate` | Автогенерация |
| PATCH | `/schedule/:id` | Изменить |
| DELETE | `/schedule/:id` | Удалить |

### GET /schedule — query-параметры

- `groupId` — фильтр по группе
- `teacherId` — фильтр по преподавателю
- `from`, `to` — диапазон дат (YYYY-MM-DD)

### GET /schedule/grid — query-параметры

- `weekStart` — начало недели (YYYY-MM-DD, понедельник)

**Response:**
```json
{
  "weekStart": "2026-09-07",
  "weekEnd": "2026-09-13",
  "groups": [{ "id": "...", "name": "СИ-141" }],
  "cells": [
    {
      "id": "...",
      "workloadId": "...",
      "date": "2026-09-07",
      "day": 1,
      "pair": 1,
      "groupId": "...",
      "disciplineName": "Архитектуры",
      "type": "LECTURE",
      "teacherName": "Ковалёв",
      "audienceId": "a-101",
      "audienceName": "101"
    }
  ]
}
```

### POST /schedule — тело

```json
{
  "workloadId": "...",
  "date": "2026-11-15",
  "pairNumber": 2,
  "audienceId": "a-101",
  "teacherId": null
}
```

**Возвращает 400 при конфликте:**
- `Преподаватель уже занят в это время`
- `Группа уже занята в это время`
- `Аудитория уже занята в это время`

### POST /schedule/generate

Автогенерация расписания на весь семестр.

**Период:** 01.09.2026 — 26.12.2026.

**Response:**
```json
{
  "created": 690,
  "skipped": 0,
  "totalWorkloads": 41,
  "clipped": [
    {
      "workloadId": "...",
      "disciplineName": "Java",
      "type": "PRACTICE",
      "groupNames": ["СИ-142"],
      "wanted": 18,
      "created": 16
    }
  ]
}
```

`clipped` — список нагрузок, которые не удалось расставить полностью. Пустой массив — всё хорошо.

---

## Моя нагрузка (STAFF)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/me/workload` | Нагрузка текущего пользователя |

---

## Служебные

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список эндпоинтов |
| GET | `/health` | Проверка живости |