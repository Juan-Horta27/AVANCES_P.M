-- Datos semilla: un usuario por rol (guía del proyecto de aula §6; ADR-011) y datos de
-- demostración del paciente, para que el panel del profesional tenga progreso que mostrar.
-- Las contraseñas son DE PRUEBA y solo se guardan como hash bcrypt; están documentadas en el
-- manual de implementación (habits-tracker-infra). Una instalación real debe cambiarlas.
--   paciente@habitos.test    / Paciente123
--   profesional@habitos.test / Profesional123
-- Las fechas de los registros se calculan al aplicar la migración (los últimos días según la
-- hora de Colombia), así la demostración siempre tiene una racha reciente.

INSERT INTO "usuario" ("nombres", "apellidos", "correo", "contrasena", "edad", "peso", "estatura", "rol") VALUES
  ('Carlos', 'Gómez',    'paciente@habitos.test',    '$2a$10$IT6GK0bjdXyDR6D2kblKeuP.Te5GMtmGTVA.3YCdXE9BCWmMCLDka', 28, 72.50, 1.75, 'paciente'),
  ('Laura',  'Martínez', 'profesional@habitos.test', '$2a$10$H.c8ISq/K6iNB/uyFjp7SuWhrD5gB13tVgoGmhDhR4QXvNvRNZw/y', 36, NULL,  NULL, 'profesional')
ON CONFLICT ("correo") DO NOTHING;

-- Hábitos del paciente de prueba, cada uno con su meta activa.
INSERT INTO "habito" ("usuario_id", "categoria_habito_id", "nombre", "descripcion", "unidad_medida")
SELECT u."id", c."id", h.nombre, h.descripcion, h.unidad
FROM (VALUES
  ('Hidratación', 'Beber agua', 'Mantener la hidratación durante la jornada', 'vasos'),
  ('Ejercicio',   'Caminar',    'Caminata ligera al aire libre',             'minutos'),
  ('Sueño',       'Dormir bien', 'Horas de sueño por noche',                 'horas')
) AS h(categoria, nombre, descripcion, unidad)
JOIN "categoria_habito" c ON c."nombre" = h.categoria
JOIN "usuario" u ON u."correo" = 'paciente@habitos.test'
WHERE NOT EXISTS (SELECT 1 FROM "habito" x WHERE x."usuario_id" = u."id");

INSERT INTO "meta" ("habito_id", "valor_objetivo", "descripcion")
SELECT x."id", m.valor, m.descripcion
FROM (VALUES
  ('Beber agua',  8, '8 vasos de agua al día'),
  ('Caminar',     30, '30 minutos de caminata'),
  ('Dormir bien', 7, '7 horas de sueño')
) AS m(nombre, valor, descripcion)
JOIN "habito" x ON x."nombre" = m.nombre
JOIN "usuario" u ON u."id" = x."usuario_id" AND u."correo" = 'paciente@habitos.test'
WHERE NOT EXISTS (SELECT 1 FROM "meta" y WHERE y."habito_id" = x."id");

-- Registros de los últimos días. meta_cumplida se calcula con la misma regla del API
-- (valor >= meta activa) para que los datos sembrados sean coherentes con la lógica real.
INSERT INTO "registro_diario" ("habito_id", "fecha", "valor_registrado", "meta_cumplida", "cliente_id")
SELECT x."id",
       (now() AT TIME ZONE 'America/Bogota')::date - r.dias_atras,
       r.valor,
       r.valor >= m."valor_objetivo",
       gen_random_uuid()
FROM (VALUES
  ('Beber agua', 1, 9), ('Beber agua', 2, 8), ('Beber agua', 3, 10), ('Beber agua', 4, 9),
  ('Beber agua', 5, 5), ('Beber agua', 6, 8), ('Beber agua', 7, 9), ('Beber agua', 8, 8),
  ('Beber agua', 9, 9), ('Beber agua', 10, 6), ('Beber agua', 11, 8), ('Beber agua', 12, 9),
  ('Caminar', 1, 35), ('Caminar', 2, 40), ('Caminar', 3, 20), ('Caminar', 4, 30),
  ('Caminar', 5, 45), ('Caminar', 6, 30), ('Caminar', 8, 25), ('Caminar', 9, 35),
  ('Dormir bien', 1, 7.5), ('Dormir bien', 2, 6), ('Dormir bien', 3, 7), ('Dormir bien', 4, 8),
  ('Dormir bien', 5, 7), ('Dormir bien', 6, 6.5), ('Dormir bien', 7, 7.5)
) AS r(nombre, dias_atras, valor)
JOIN "habito" x ON x."nombre" = r.nombre
JOIN "usuario" u ON u."id" = x."usuario_id" AND u."correo" = 'paciente@habitos.test'
JOIN "meta" m ON m."habito_id" = x."id" AND m."activa"
WHERE NOT EXISTS (SELECT 1 FROM "registro_diario" y WHERE y."habito_id" = x."id");
