-- Seed: 5 usuarios de prueba con rol 'tecnico'.
-- Hash bcrypt reutilizado de seed base (mismo password que demás usuarios demo).
-- Idempotente: ON CONFLICT DO NOTHING por id y por username.

INSERT INTO "users" ("id", "role", "username", "password_hash") VALUES
  ('00000000-0001-0000-0000-000000000101', 'tecnico', 'tecnico1', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000102', 'tecnico', 'tecnico2', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000103', 'tecnico', 'tecnico3', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000104', 'tecnico', 'tecnico4', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe'),
  ('00000000-0001-0000-0000-000000000105', 'tecnico', 'tecnico5', '$2a$10$DMk.G0ukxQGJ1bJFhlh0uOe2TpclY121LEAcYXSd6onBgNd2ZuWDe')
ON CONFLICT DO NOTHING;
