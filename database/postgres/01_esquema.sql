-- =====================================================================
-- Reservas UNAB · Hito 3
-- Esquema relacional (PostgreSQL 16)
-- Se ejecuta automáticamente la primera vez que se levanta el contenedor
-- de PostgreSQL (carpeta /docker-entrypoint-initdb.d).
-- =====================================================================

-- btree_gist permite combinar "=" con rangos en una restricción EXCLUDE.
-- La usamos para que la base de datos impida dos reservas activas que se
-- traslapen en el mismo espacio y fecha (doble reserva).
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- pgcrypto se usa solo en los datos de prueba para generar los hash bcrypt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Usuarios y roles
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id                   SERIAL PRIMARY KEY,
  nombre               VARCHAR(40)  NOT NULL UNIQUE,
  slug                 VARCHAR(20)  NOT NULL UNIQUE,
  max_horas_reserva    SMALLINT     NOT NULL CHECK (max_horas_reserva BETWEEN 1 AND 13),
  requiere_aprobacion  BOOLEAN      NOT NULL DEFAULT TRUE,
  es_admin             BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE usuarios (
  id             SERIAL PRIMARY KEY,
  rut            VARCHAR(9)   NOT NULL UNIQUE CHECK (rut ~ '^[0-9]{7,8}[0-9K]$'),
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  rol_id         INTEGER      NOT NULL REFERENCES roles(id),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Infraestructura: sedes, edificios, tipos, espacios y equipamiento
-- ---------------------------------------------------------------------
CREATE TABLE sedes (
  id        VARCHAR(30)  PRIMARY KEY,
  nombre    VARCHAR(80)  NOT NULL UNIQUE,
  ciudad    VARCHAR(60)  NOT NULL,
  latitud   NUMERIC(8,5) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud  NUMERIC(8,5) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  orden     SMALLINT     NOT NULL DEFAULT 0
);

CREATE TABLE edificios (
  id          SERIAL PRIMARY KEY,
  sede_id     VARCHAR(30)  NOT NULL REFERENCES sedes(id),
  nombre      VARCHAR(80)  NOT NULL,
  direccion   VARCHAR(150),
  pisos       SMALLINT     NOT NULL DEFAULT 1 CHECK (pisos BETWEEN 1 AND 50),
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (sede_id, nombre)
);

CREATE TABLE tipos_espacio (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(40) NOT NULL UNIQUE,
  icono   VARCHAR(40) NOT NULL,
  color   VARCHAR(20) NOT NULL
);

CREATE TABLE espacios (
  id           SERIAL PRIMARY KEY,
  codigo       VARCHAR(20)  NOT NULL UNIQUE,
  nombre       VARCHAR(80)  NOT NULL,
  tipo_id      INTEGER      NOT NULL REFERENCES tipos_espacio(id),
  edificio_id  INTEGER      NOT NULL REFERENCES edificios(id),
  piso         SMALLINT     NOT NULL DEFAULT 1 CHECK (piso BETWEEN 0 AND 50),
  capacidad    SMALLINT     NOT NULL CHECK (capacidad BETWEEN 1 AND 500),
  exterior     BOOLEAN      NOT NULL DEFAULT FALSE,
  -- disponible: se puede reservar · mantencion: visible pero no reservable
  -- inactivo: dado de baja (no aparece en el catálogo)
  estado       VARCHAR(15)  NOT NULL DEFAULT 'disponible'
               CHECK (estado IN ('disponible', 'mantencion', 'inactivo')),
  descripcion  VARCHAR(300),
  creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_espacios_edificio ON espacios(edificio_id);
CREATE INDEX idx_espacios_tipo ON espacios(tipo_id);

CREATE TABLE equipamiento (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL UNIQUE,
  icono   VARCHAR(40) NOT NULL DEFAULT 'bi-box'
);

-- Relación N:M entre espacios y equipamiento
CREATE TABLE espacio_equipamiento (
  espacio_id       INTEGER  NOT NULL REFERENCES espacios(id) ON DELETE CASCADE,
  equipamiento_id  INTEGER  NOT NULL REFERENCES equipamiento(id) ON DELETE RESTRICT,
  cantidad         SMALLINT NOT NULL DEFAULT 1 CHECK (cantidad BETWEEN 1 AND 500),
  PRIMARY KEY (espacio_id, equipamiento_id)
);

-- ---------------------------------------------------------------------
-- Reservas
-- ---------------------------------------------------------------------
-- Las horas se guardan como bloques enteros entre 08 y 21:
-- hora_inicio = 10, hora_fin = 12 significa 10:00 – 12:00.
CREATE TABLE reservas (
  id               SERIAL PRIMARY KEY,
  espacio_id       INTEGER      NOT NULL REFERENCES espacios(id) ON DELETE RESTRICT,
  usuario_id       INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha            DATE         NOT NULL,
  hora_inicio      SMALLINT     NOT NULL CHECK (hora_inicio BETWEEN 8 AND 20),
  hora_fin         SMALLINT     NOT NULL CHECK (hora_fin BETWEEN 9 AND 21),
  personas         SMALLINT     NOT NULL CHECK (personas >= 1),
  motivo           VARCHAR(200) NOT NULL CHECK (char_length(motivo) >= 5),
  estado           VARCHAR(10)  NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'cancelada')),
  motivo_rechazo   VARCHAR(200),
  revisada_por     INTEGER      REFERENCES usuarios(id),
  revisada_en      TIMESTAMPTZ,
  cancelada_en     TIMESTAMPTZ,
  creada_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizada_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT reservas_rango_valido CHECK (hora_fin > hora_inicio),
  CONSTRAINT reservas_rechazo_con_motivo
    CHECK (estado <> 'rechazada' OR motivo_rechazo IS NOT NULL),

  -- Regla de negocio principal garantizada por la base de datos:
  -- no pueden existir dos reservas pendientes o aprobadas del mismo
  -- espacio, el mismo día, con horarios que se traslapen.
  CONSTRAINT reservas_sin_traslape EXCLUDE USING gist (
    espacio_id WITH =,
    fecha WITH =,
    int4range(hora_inicio, hora_fin) WITH &&
  ) WHERE (estado IN ('pendiente', 'aprobada'))
);

CREATE INDEX idx_reservas_usuario ON reservas(usuario_id, fecha DESC);
CREATE INDEX idx_reservas_fecha ON reservas(fecha, estado);
