-- Catalogo maestro de categorias (HU-02 M-03, data-model.md §10, ADR-008 D-11).
-- Va en una migracion, y no en un script de semilla, porque es parte del esquema: toda base
-- recien creada (desarrollo, pruebas, Docker) debe tenerlo para que se puedan crear habitos.
-- ON CONFLICT hace que aplicarla sobre una base que ya tiene las categorias no duplique nada.
INSERT INTO "categoria_habito" ("nombre", "icono", "descripcion") VALUES
  ('Hidratación',  '💧', 'Consumo de agua durante el día'),
  ('Ejercicio',    '🏃', 'Actividad física y movimiento'),
  ('Alimentación', '🥗', 'Hábitos de nutrición'),
  ('Sueño',        '😴', 'Descanso nocturno'),
  ('Meditación',   '🧘', 'Salud mental y atención plena')
ON CONFLICT ("nombre") DO NOTHING;
