-- Visitas anónimas: sin IP, sin cookies. La sesión es un número aleatorio que vive solo en la pestaña.
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  sesion TEXT NOT NULL,
  evento TEXT NOT NULL,
  detalle TEXT,
  idioma TEXT,
  referencia TEXT,
  pais TEXT,
  ciudad TEXT,
  red TEXT,
  dispositivo TEXT
);

CREATE INDEX IF NOT EXISTS eventos_fecha ON eventos (fecha);
CREATE INDEX IF NOT EXISTS eventos_sesion ON eventos (sesion);
