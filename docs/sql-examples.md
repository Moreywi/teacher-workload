# Примеры SQL-запросов

## 1. Список преподавателей с компетенциями

```sql
SELECT
    t.id,
    t.full_name,
    GROUP_CONCAT(d.name ORDER BY d.name SEPARATOR ', ') AS disciplines
FROM teachers t
LEFT JOIN competencies c ON c.teacher_id = t.id
LEFT JOIN disciplines d ON d.id = c.discipline_id
GROUP BY t.id, t.full_name
ORDER BY t.full_name;
```

`LEFT JOIN` сохраняет преподавателей без компетенций, `GROUP_CONCAT` агрегирует строки.

---

## 2. Нагрузка каждого преподавателя

```sql
SELECT
    t.id,
    t.full_name,
    COALESCE(SUM(w.pairs), 0) AS total_pairs,
    COALESCE(SUM(w.pairs), 0) * 1.5 AS total_hours
FROM teachers t
LEFT JOIN allocations a ON a.teacher_id = t.id
LEFT JOIN workloads w ON w.id = a.workload_id
GROUP BY t.id, t.full_name
ORDER BY total_pairs DESC;
```

`LEFT JOIN` (преподаватель без нагрузки тоже в выборке), `COALESCE` (0 вместо NULL), вычисляемое поле.

---

## 3. Дисциплины без компетентных преподавателей

```sql
SELECT d.id, d.name
FROM disciplines d
WHERE NOT EXISTS (
    SELECT 1 FROM competencies c
    WHERE c.discipline_id = d.id
);
```

Коррелированный подзапрос с `NOT EXISTS`.

---

## 4. Преподаватели с нагрузкой выше средней

```sql
SELECT
    t.full_name,
    SUM(w.pairs) AS total_pairs
FROM teachers t
JOIN allocations a ON a.teacher_id = t.id
JOIN workloads w ON w.id = a.workload_id
GROUP BY t.id, t.full_name
HAVING SUM(w.pairs) > (
    SELECT AVG(pairs_per_teacher)
    FROM (
        SELECT SUM(w2.pairs) AS pairs_per_teacher
        FROM allocations a2
        JOIN workloads w2 ON w2.id = a2.workload_id
        GROUP BY a2.teacher_id
    ) AS sub
);
```

Агрегация, `HAVING`, подзапрос.

---

## 5. Полная картина назначений (6 таблиц)

```sql
SELECT
    a.id AS allocation_id,
    t.full_name AS teacher,
    d.name AS discipline,
    w.type,
    w.pairs,
    GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS groups_list
FROM allocations a
JOIN teachers t ON t.id = a.teacher_id
JOIN workloads w ON w.id = a.workload_id
JOIN disciplines d ON d.id = w.discipline_id
LEFT JOIN workload_groups wg ON wg.workload_id = w.id
LEFT JOIN `groups` g ON g.id = wg.group_id
GROUP BY a.id, t.full_name, d.name, w.type, w.pairs
ORDER BY t.full_name, d.name;
```

JOIN 6 таблиц, `LEFT JOIN` для workload'ов без групп, агрегация.

---

## 6. Нераспределённые workload'ы

```sql
SELECT
    w.id,
    d.name AS discipline,
    w.type,
    w.pairs
FROM workloads w
JOIN disciplines d ON d.id = w.discipline_id
LEFT JOIN allocations a ON a.workload_id = w.id
WHERE a.id IS NULL;
```

`LEFT JOIN + WHERE IS NULL` как альтернатива `NOT IN`.

---

## 7. Количество workload'ов по типам

```sql
SELECT
    type,
    COUNT(*) AS count,
    SUM(pairs) AS total_pairs
FROM workloads
GROUP BY type;
```

---

## 8. Ранжирование преподавателей по нагрузке

```sql
SELECT
    t.full_name,
    COALESCE(SUM(w.pairs), 0) AS total_pairs,
    RANK() OVER (ORDER BY COALESCE(SUM(w.pairs), 0) DESC) AS rank_position
FROM teachers t
LEFT JOIN allocations a ON a.teacher_id = t.id
LEFT JOIN workloads w ON w.id = a.workload_id
GROUP BY t.id, t.full_name
ORDER BY rank_position;
```

Оконная функция `RANK()` (MySQL 8+).

---

## 9. Представление (VIEW) для нагрузки преподавателей

```sql
CREATE OR REPLACE VIEW v_teacher_load AS
SELECT
    t.id AS teacher_id,
    t.full_name,
    COALESCE(SUM(w.pairs), 0) AS total_pairs,
    COALESCE(SUM(w.pairs), 0) * 1.5 AS total_hours
FROM teachers t
LEFT JOIN allocations a ON a.teacher_id = t.id
LEFT JOIN workloads w ON w.id = a.workload_id
GROUP BY t.id, t.full_name;

-- Использование:
SELECT * FROM v_teacher_load WHERE total_pairs > 100;
```

Создание представления — абстракция сложного запроса.

---

## 10. Транзакция (пример из бэкенда)

```sql
START TRANSACTION;

INSERT INTO workloads (id, discipline_id, type, pairs)
VALUES ('wl_xxx', 'disc_yyy', 'LECTURE', 18);

INSERT INTO workload_groups (workload_id, group_id)
VALUES ('wl_xxx', 'grp_1'), ('wl_xxx', 'grp_2');

COMMIT;
-- или ROLLBACK при ошибке
```

Понимание ACID, атомарность операций.

---

## 11. Учётные данные преподавателей (для админа)

```sql
SELECT
    t.full_name,
    u.email,
    u.initial_password,
    u.role
FROM teachers t
LEFT JOIN users u ON u.teacher_id = t.id
ORDER BY t.full_name;
```

`LEFT JOIN` teachers ↔ users, доступ к паролю для админа.

---

## 12. Сводка по расписанию на семестр

```sql
SELECT
    d.name AS discipline,
    w.type,
    COUNT(s.id) AS pairs_scheduled,
    w.pairs AS pairs_expected
FROM workloads w
JOIN disciplines d ON d.id = w.discipline_id
LEFT JOIN schedule s ON s.workload_id = w.id
GROUP BY w.id, d.name, w.type, w.pairs
HAVING pairs_scheduled < pairs_expected
ORDER BY discipline, w.type;
```

Какие нагрузки не получили полное расписание (аналог `clipped` из отчёта).

---

## Как проверить EXPLAIN

Для любого из запросов можно посмотреть план:

```sql
EXPLAIN SELECT
    t.full_name,
    SUM(w.pairs) AS total_pairs
FROM teachers t
LEFT JOIN allocations a ON a.teacher_id = t.id
LEFT JOIN workloads w ON w.id = a.workload_id
GROUP BY t.id, t.full_name;
```

Результат покажет, какие индексы используются, как MySQL строит план.