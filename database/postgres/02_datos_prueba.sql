-- =====================================================================
-- Reservas UNAB · Hito 3
-- Datos de prueba. Las fechas de las reservas son relativas a CURRENT_DATE
-- para que siempre queden cerca del día en que se levanta el proyecto.
-- Contraseña de todos los usuarios de prueba: unab2026
-- =====================================================================

INSERT INTO roles (nombre, slug, max_horas_reserva, requiere_aprobacion, es_admin) VALUES
  ('Estudiante',               'estudiante', 2, TRUE,  FALSE),
  ('Docente',                  'docente',    4, FALSE, FALSE),
  ('Organización Estudiantil', 'org',        3, TRUE,  FALSE),
  ('Administrador',            'admin',      8, FALSE, TRUE);

INSERT INTO usuarios (rut, nombre, email, password_hash, rol_id) VALUES
  ('216688392', 'Zaid Isamit Alvial',        'zaid.isamit@reservas-unab.test',  crypt('unab2026', gen_salt('bf', 10)), (SELECT id FROM roles WHERE slug = 'docente')),
  ('219931158', 'Agustin Carmona',           'agustin.carmona@reservas-unab.test', crypt('unab2026', gen_salt('bf', 10)), (SELECT id FROM roles WHERE slug = 'estudiante')),
  ('218348246', 'Jhon Rojas',                'jhon.rojas@reservas-unab.test',   crypt('unab2026', gen_salt('bf', 10)), (SELECT id FROM roles WHERE slug = 'org')),
  ('111111111', 'Coordinación de Espacios',  'espacios@reservas-unab.test',     crypt('unab2026', gen_salt('bf', 10)), (SELECT id FROM roles WHERE slug = 'admin')),
  ('123456785', 'María Pérez (ficticia)',    'maria.perez@reservas-unab.test',  crypt('unab2026', gen_salt('bf', 10)), (SELECT id FROM roles WHERE slug = 'estudiante')),
  ('159876543', 'Pedro Soto (ficticio)',     'pedro.soto@reservas-unab.test',   crypt('unab2026', gen_salt('bf', 10)), (SELECT id FROM roles WHERE slug = 'docente'));

INSERT INTO sedes (id, nombre, ciudad, latitud, longitud, orden) VALUES
  ('santiago',   'Santiago · República', 'Santiago',     -33.4497, -70.6750, 1),
  ('vina',       'Viña del Mar',         'Viña del Mar', -33.0245, -71.5518, 2),
  ('concepcion', 'Concepción',           'Concepción',   -36.8270, -73.0498, 3);

INSERT INTO edificios (sede_id, nombre, direccion, pisos) VALUES
  ('santiago',   'Edificio R1',           'Av. República 252',          4),
  ('santiago',   'Edificio R2',           'Av. República 330',          5),
  ('santiago',   'Campus República',      'Av. República 237',          1),
  ('vina',       'Edificio Los Castaños', 'Los Castaños 1348',          4),
  ('concepcion', 'Edificio Autopista',    'Autopista Concepción 7100',  3),
  ('concepcion', 'Campus Concepción',     'Autopista Concepción 7100',  1);

INSERT INTO tipos_espacio (nombre, icono, color) VALUES
  ('Sala de clases',   'bi-easel2',     'azul'),
  ('Laboratorio',      'bi-pc-display', 'violeta'),
  ('Sala de estudio',  'bi-book',       'verde'),
  ('Sala de reunión',  'bi-people',     'ambar'),
  ('Espacio exterior', 'bi-tree',       'cielo');

INSERT INTO equipamiento (nombre, icono) VALUES
  ('Proyector',            'bi-projector'),
  ('Aire acondicionado',   'bi-snow'),
  ('PCs',                  'bi-pc-display'),
  ('Pizarra',              'bi-easel'),
  ('WiFi',                 'bi-wifi'),
  ('TV',                   'bi-tv'),
  ('Videoconferencia',     'bi-camera-video'),
  ('Escenario',            'bi-music-note-beamed'),
  ('Enchufes exteriores',  'bi-plug'),
  ('Micrófono',            'bi-mic'),
  ('Mesones',              'bi-table'),
  ('Instrumental',         'bi-tools'),
  ('Enchufes',             'bi-plug'),
  ('Mesas',                'bi-table'),
  ('Extractor de gases',   'bi-wind'),
  ('Graderías',            'bi-bar-chart-steps'),
  ('Iluminación',          'bi-lightbulb');

-- Función auxiliar solo para cargar datos de prueba de forma legible
CREATE FUNCTION pg_temp.edificio(p_nombre TEXT) RETURNS INTEGER AS
  $$ SELECT id FROM edificios WHERE nombre = p_nombre $$ LANGUAGE sql;
CREATE FUNCTION pg_temp.tipo(p_nombre TEXT) RETURNS INTEGER AS
  $$ SELECT id FROM tipos_espacio WHERE nombre = p_nombre $$ LANGUAGE sql;

INSERT INTO espacios (codigo, nombre, tipo_id, edificio_id, piso, capacidad, exterior, estado, descripcion) VALUES
  ('R1-101',    'Sala R1-101',                pg_temp.tipo('Sala de clases'),   pg_temp.edificio('Edificio R1'),           1, 40, FALSE, 'disponible', 'Sala de clases con proyector y climatización.'),
  ('R1-201',    'Laboratorio de Computación', pg_temp.tipo('Laboratorio'),      pg_temp.edificio('Edificio R1'),           2, 25, FALSE, 'disponible', '25 equipos con software de desarrollo.'),
  ('R2-101',    'Sala de estudio R2-101',     pg_temp.tipo('Sala de estudio'),  pg_temp.edificio('Edificio R2'),           1,  6, FALSE, 'disponible', NULL),
  ('R2-102',    'Sala de estudio R2-102',     pg_temp.tipo('Sala de estudio'),  pg_temp.edificio('Edificio R2'),           1,  6, FALSE, 'mantencion', 'En mantención: cambio de mobiliario.'),
  ('R2-301',    'Sala de reunión R2-301',     pg_temp.tipo('Sala de reunión'),  pg_temp.edificio('Edificio R2'),           3, 12, FALSE, 'disponible', NULL),
  ('R-PATIO',   'Patio central',              pg_temp.tipo('Espacio exterior'), pg_temp.edificio('Campus República'),      0, 80, TRUE,  'disponible', 'Espacio al aire libre para ferias y actividades.'),
  ('V-101',     'Sala V-101',                 pg_temp.tipo('Sala de clases'),   pg_temp.edificio('Edificio Los Castaños'), 1, 45, FALSE, 'disponible', NULL),
  ('V-205',     'Laboratorio de Física',      pg_temp.tipo('Laboratorio'),      pg_temp.edificio('Edificio Los Castaños'), 2, 20, FALSE, 'disponible', NULL),
  ('V-310',     'Sala de estudio V-310',      pg_temp.tipo('Sala de estudio'),  pg_temp.edificio('Edificio Los Castaños'), 3,  8, FALSE, 'disponible', NULL),
  ('V-TERRAZA', 'Terraza mirador',            pg_temp.tipo('Espacio exterior'), pg_temp.edificio('Edificio Los Castaños'), 4, 30, TRUE,  'disponible', NULL),
  ('C-110',     'Laboratorio de Química',     pg_temp.tipo('Laboratorio'),      pg_temp.edificio('Edificio Autopista'),    1, 22, FALSE, 'disponible', NULL),
  ('C-204',     'Sala de reunión C-204',      pg_temp.tipo('Sala de reunión'),  pg_temp.edificio('Edificio Autopista'),    2, 10, FALSE, 'disponible', NULL),
  ('C-CANCHA',  'Cancha multiuso',            pg_temp.tipo('Espacio exterior'), pg_temp.edificio('Campus Concepción'),     0, 60, TRUE,  'disponible', NULL);

INSERT INTO espacio_equipamiento (espacio_id, equipamiento_id, cantidad)
SELECT e.id, q.id, x.cantidad
FROM (VALUES
  ('R1-101', 'Proyector', 1), ('R1-101', 'Aire acondicionado', 1),
  ('R1-201', 'PCs', 25), ('R1-201', 'Proyector', 1),
  ('R2-101', 'Pizarra', 1), ('R2-101', 'WiFi', 1),
  ('R2-102', 'Pizarra', 1),
  ('R2-301', 'TV', 1), ('R2-301', 'Videoconferencia', 1),
  ('R-PATIO', 'Escenario', 1), ('R-PATIO', 'Enchufes exteriores', 6),
  ('V-101', 'Proyector', 1), ('V-101', 'Micrófono', 2),
  ('V-205', 'Mesones', 6), ('V-205', 'Instrumental', 1),
  ('V-310', 'Pizarra', 1), ('V-310', 'WiFi', 1), ('V-310', 'Enchufes', 8),
  ('V-TERRAZA', 'Mesas', 8), ('V-TERRAZA', 'WiFi', 1),
  ('C-110', 'Mesones', 6), ('C-110', 'Extractor de gases', 2),
  ('C-204', 'Pizarra', 1), ('C-204', 'TV', 1),
  ('C-CANCHA', 'Graderías', 1), ('C-CANCHA', 'Iluminación', 1)
) AS x(codigo, equipo, cantidad)
JOIN espacios e ON e.codigo = x.codigo
JOIN equipamiento q ON q.nombre = x.equipo;

CREATE FUNCTION pg_temp.espacio(p_codigo TEXT) RETURNS INTEGER AS
  $$ SELECT id FROM espacios WHERE codigo = p_codigo $$ LANGUAGE sql;
CREATE FUNCTION pg_temp.usuario(p_rut TEXT) RETURNS INTEGER AS
  $$ SELECT id FROM usuarios WHERE rut = p_rut $$ LANGUAGE sql;

-- Reservas: algunas pasadas (para el historial y los indicadores) y otras futuras
INSERT INTO reservas (espacio_id, usuario_id, fecha, hora_inicio, hora_fin, personas, motivo, estado, motivo_rechazo, revisada_por, revisada_en, cancelada_en, creada_en) VALUES
  -- Pasadas
  (pg_temp.espacio('R1-101'),   pg_temp.usuario('159876543'), CURRENT_DATE - 6, 10, 12, 32, 'Clase de Programación I',            'aprobada',  NULL, NULL, NULL, NULL, now() - interval '10 days'),
  (pg_temp.espacio('R1-201'),   pg_temp.usuario('216688392'), CURRENT_DATE - 5,  9, 12, 22, 'Laboratorio de Bases de Datos',      'aprobada',  NULL, NULL, NULL, NULL, now() - interval '9 days'),
  (pg_temp.espacio('R2-101'),   pg_temp.usuario('219931158'), CURRENT_DATE - 5, 15, 17,  4, 'Estudio para certamen de cálculo',   'aprobada',  NULL, pg_temp.usuario('111111111'), now() - interval '8 days', NULL, now() - interval '8 days'),
  (pg_temp.espacio('R-PATIO'),  pg_temp.usuario('218348246'), CURRENT_DATE - 4, 12, 15, 60, 'Feria de organizaciones estudiantiles', 'aprobada', NULL, pg_temp.usuario('111111111'), now() - interval '7 days', NULL, now() - interval '8 days'),
  (pg_temp.espacio('R2-301'),   pg_temp.usuario('123456785'), CURRENT_DATE - 3, 11, 12,  8, 'Reunión de grupo de investigación',  'rechazada', 'La sala estaba reservada para una reunión de dirección.', pg_temp.usuario('111111111'), now() - interval '5 days', NULL, now() - interval '6 days'),
  (pg_temp.espacio('V-101'),    pg_temp.usuario('216688392'), CURRENT_DATE - 2, 18, 20, 35, 'Taller de programación web',         'aprobada',  NULL, NULL, NULL, NULL, now() - interval '6 days'),
  (pg_temp.espacio('C-110'),    pg_temp.usuario('159876543'), CURRENT_DATE - 2,  9, 12, 18, 'Laboratorio de Química Orgánica',    'aprobada',  NULL, NULL, NULL, NULL, now() - interval '6 days'),
  (pg_temp.espacio('R1-101'),   pg_temp.usuario('216688392'), CURRENT_DATE - 1, 14, 16, 30, 'Ayudantía de Desarrollo Web',        'cancelada', NULL, NULL, NULL, now() - interval '2 days', now() - interval '4 days'),
  (pg_temp.espacio('R2-101'),   pg_temp.usuario('123456785'), CURRENT_DATE - 1, 10, 12,  5, 'Trabajo grupal de estadística',      'aprobada',  NULL, pg_temp.usuario('111111111'), now() - interval '3 days', NULL, now() - interval '4 days'),
  -- Futuras
  (pg_temp.espacio('R1-101'),   pg_temp.usuario('159876543'), CURRENT_DATE + 1, 10, 12, 30, 'Clase regular de Algoritmos',        'aprobada',  NULL, NULL, NULL, NULL, now() - interval '2 days'),
  (pg_temp.espacio('R2-301'),   pg_temp.usuario('216688392'), CURRENT_DATE + 1, 15, 16,  8, 'Reunión de coordinación',            'aprobada',  NULL, NULL, NULL, NULL, now() - interval '2 days'),
  (pg_temp.espacio('C-110'),    pg_temp.usuario('159876543'), CURRENT_DATE + 2,  9, 12, 18, 'Laboratorio de Química General',     'aprobada',  NULL, NULL, NULL, NULL, now() - interval '1 day'),
  (pg_temp.espacio('R-PATIO'),  pg_temp.usuario('218348246'), CURRENT_DATE + 3, 12, 14, 70, 'Feria de carreras',                  'pendiente', NULL, NULL, NULL, NULL, now() - interval '1 day'),
  (pg_temp.espacio('R1-201'),   pg_temp.usuario('219931158'), CURRENT_DATE + 3, 11, 12,  4, 'Estudio para certamen',              'pendiente', NULL, NULL, NULL, NULL, now() - interval '20 hours'),
  (pg_temp.espacio('R2-101'),   pg_temp.usuario('123456785'), CURRENT_DATE + 2, 16, 18,  6, 'Preparación de presentación final',  'pendiente', NULL, NULL, NULL, NULL, now() - interval '5 hours'),
  (pg_temp.espacio('V-101'),    pg_temp.usuario('159876543'), CURRENT_DATE + 4, 18, 20, 35, 'Taller de programación',             'aprobada',  NULL, NULL, NULL, NULL, now() - interval '1 day');
