-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100),
    "correo" VARCHAR(150) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "edad" INTEGER,
    "peso" DECIMAL(5,2),
    "estatura" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_habito" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "descripcion" TEXT,
    "icono" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_habito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habito" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "categoria_habito_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "unidad_medida" VARCHAR(30) NOT NULL,
    "frecuencia" VARCHAR(20) NOT NULL DEFAULT 'diaria',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta" (
    "id" SERIAL NOT NULL,
    "habito_id" INTEGER NOT NULL,
    "valor_objetivo" DECIMAL(8,2) NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_diario" (
    "id" SERIAL NOT NULL,
    "habito_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "valor_registrado" DECIMAL(8,2) NOT NULL,
    "meta_cumplida" BOOLEAN NOT NULL DEFAULT false,
    "notas" VARCHAR(500),
    "cliente_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_diario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_habito_nombre_key" ON "categoria_habito"("nombre");

-- CreateIndex
CREATE INDEX "idx_habito_usuario_activo" ON "habito"("usuario_id", "activo");

-- CreateIndex
CREATE INDEX "idx_meta_habito_activa" ON "meta"("habito_id", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "registro_diario_cliente_id_key" ON "registro_diario"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "registro_diario_habito_fecha_key" ON "registro_diario"("habito_id", "fecha");

-- AddForeignKey
ALTER TABLE "habito" ADD CONSTRAINT "habito_usuario_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habito" ADD CONSTRAINT "habito_categoria_fkey" FOREIGN KEY ("categoria_habito_id") REFERENCES "categoria_habito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_habito_fkey" FOREIGN KEY ("habito_id") REFERENCES "habito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_diario" ADD CONSTRAINT "registro_diario_habito_fkey" FOREIGN KEY ("habito_id") REFERENCES "habito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restricciones CHECK de data-model.md §4. Prisma no las declara en schema.prisma,
-- por eso se escriben a mano: asi la base de datos rechaza el dato aunque el servicio falle.
ALTER TABLE "meta" ADD CONSTRAINT "chk_meta_valor_positivo" CHECK ("valor_objetivo" > 0);
ALTER TABLE "registro_diario" ADD CONSTRAINT "chk_registro_valor_no_negativo" CHECK ("valor_registrado" >= 0);
