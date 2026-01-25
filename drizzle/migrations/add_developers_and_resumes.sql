-- Create desarrolladores table
CREATE TABLE IF NOT EXISTS desarrolladores (
  dev_cod SERIAL PRIMARY KEY,
  dev_nombres VARCHAR(255),
  dev_apellidos VARCHAR(255),
  dev_foto VARCHAR(255),
  dev_resumen TEXT
);

-- Add resume column to integrantes table
ALTER TABLE integrantes ADD COLUMN IF NOT EXISTS intg_resumen TEXT;

-- Add photo path and resume columns to tutores table
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS tutor_foto_path VARCHAR(255);
ALTER TABLE tutores ADD COLUMN IF NOT EXISTS tutor_resumen TEXT;

-- Insert initial developer data
INSERT INTO desarrolladores (dev_nombres, dev_apellidos, dev_resumen) VALUES
  ('Raúl Enrique', 'Campomás Giménez', NULL),
  ('Anyul Led', 'Rivas Oropeza', NULL);
