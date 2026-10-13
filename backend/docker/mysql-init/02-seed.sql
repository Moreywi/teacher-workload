SET NAMES utf8mb4;

INSERT INTO `groups` (id, name) VALUES
    ('g-si141', 'СИ-141'),
    ('g-si142', 'СИ-142');

INSERT INTO disciplines (id, name) VALUES
    ('d-arch',        'Архитектуры'),
    ('d-net',         'Компьютерные сети'),
    ('d-evm',         'ЭВМ'),
    ('d-db',          'БД'),
    ('d-c',           'Программирование на C'),
    ('d-python',      'Python'),
    ('d-java',        'Java'),
    ('d-csharp',      'C#'),
    ('d-openscad',    'OpenSCAD'),
    ('d-html',        'HTML'),
    ('d-cert',        'Сертификация'),
    ('d-num',         'Численные методы'),
    ('d-math',        'Математика'),
    ('d-pe',          'Физра');

INSERT INTO teachers (id, full_name) VALUES
    ('t-kovalev',     'Ковалёв'),
    ('t-makarov',     'Макаров'),
    ('t-lebedeva',    'Лебедева'),
    ('t-orlov',       'Орлов'),
    ('t-sokolov',     'Соколов'),
    ('t-vinogradova', 'Виноградова'),
    ('t-tihonova',    'Тихонова'),
    ('t-krylova',     'Крылова');

INSERT INTO competencies (id, teacher_id, discipline_id) VALUES
    ('c-01', 't-kovalev',     'd-arch'),
    ('c-02', 't-kovalev',     'd-net'),
    ('c-03', 't-kovalev',     'd-evm'),
    ('c-04', 't-makarov',     'd-db'),
    ('c-05', 't-makarov',     'd-c'),
    ('c-06', 't-lebedeva',    'd-python'),
    ('c-07', 't-lebedeva',    'd-java'),
    ('c-08', 't-orlov',       'd-csharp'),
    ('c-09', 't-orlov',       'd-openscad'),
    ('c-10', 't-sokolov',     'd-html'),
    ('c-11', 't-sokolov',     'd-java'),
    ('c-12', 't-vinogradova', 'd-cert'),
    ('c-13', 't-vinogradova', 'd-num'),
    ('c-14', 't-tihonova',    'd-math'),
    ('c-15', 't-krylova',     'd-pe');

INSERT INTO audiences (id, name, capacity) VALUES
    ('a-101', '101', 30),
    ('a-102', '102', 25),
    ('a-305', '305', 30),
    ('a-306', '306', 20);

INSERT INTO users (id, email, password_hash, initial_password, role, teacher_id) VALUES
    ('u-admin',       'admin@example.com',       '$argon2id$v=19$m=65536,p=4,t=3$+uWSkOKtgjm+7dy9/8yLJw$X9dYVY2p7HMxnOs0nFakjexTPl7D8VZjZkARJKnCHGU', NULL,         'ADMIN', NULL),
    ('u-kovalev',     'kovalev@example.com',     '$argon2id$v=19$m=65536,p=4,t=3$+PFq71dCgipdbAxGPJoP3g$XPecCjLIZdgXd/h207Ed+IUQbonuf0AueDqjtBWwY/o', 'teacher123', 'STAFF', 't-kovalev'),
    ('u-makarov',     'makarov@example.com',     '$argon2id$v=19$m=65536,p=4,t=3$667DVC51vqTUbnb1ZH7aew$q0kG3BsyXovlllV8U6bF6+sJfPIwquviVRNsE2MRA/4', 'teacher123', 'STAFF', 't-makarov'),
    ('u-lebedeva',    'lebedeva@example.com',    '$argon2id$v=19$m=65536,p=4,t=3$i5I+4A7ZbE+CHAfOGQhy6A$JYMMB7YX96o2xTfxe0g54r5enloDVAXVcPWiJwpNYks', 'teacher123', 'STAFF', 't-lebedeva'),
    ('u-orlov',       'orlov@example.com',       '$argon2id$v=19$m=65536,p=4,t=3$vQfYu080idwp4JnDmGNJQQ$ujEQa3etwcDvlIFZMav64klR87Q1M8qGBIkZVFmfyOc', 'teacher123', 'STAFF', 't-orlov'),
    ('u-sokolov',     'sokolov@example.com',     '$argon2id$v=19$m=65536,p=4,t=3$fWfa4SmXrEj8eXh8azpBLA$9tu5QMi0zQ8cRq/1OkMfm9jsBg7vsDC7qj8649Ywgtw', 'teacher123', 'STAFF', 't-sokolov'),
    ('u-vinogradova', 'vinogradova@example.com', '$argon2id$v=19$m=65536,p=4,t=3$UjhbH7BuWNXTi7R9BYG/7w$f+pU+T66vcXExuH35wXItzeNK4Yke1D5iSjSzCEMrYc', 'teacher123', 'STAFF', 't-vinogradova'),
    ('u-tihonova',    'tihonova@example.com',    '$argon2id$v=19$m=65536,p=4,t=3$5b/K/jbTkRlX0uWP9IbzFQ$LBKjEi90bda3MQ2/wyXIOFzW3k+F7a6ciFU+DOL73Qw', 'teacher123', 'STAFF', 't-tihonova'),
    ('u-krylova',     'krylova@example.com',     '$argon2id$v=19$m=65536,p=4,t=3$3gTBd8iyIgX8UJsntBchWQ$7d11x8N+PvJRJWc9GEt6XkmNvO/rWPBtkDU5SwPbyM8', 'teacher123', 'STAFF', 't-krylova');