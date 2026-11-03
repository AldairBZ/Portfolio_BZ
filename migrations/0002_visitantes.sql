-- Personas únicas sin cookies: una huella anónima (hash con sal secreta) en vez de contar cada visita
ALTER TABLE eventos ADD COLUMN visitante TEXT;
CREATE INDEX IF NOT EXISTS eventos_visitante ON eventos (visitante);

-- La sal se genera una vez en el servidor y nunca sale de la base de datos
CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
