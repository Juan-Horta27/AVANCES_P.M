import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles';
import { CategoriasModule } from './categorias/categorias.module';
import { validarEntorno } from './config/validar-entorno';
import { HabitosModule } from './habitos/habitos.module';
import { MetasModule } from './metas/metas.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegistrosModule } from './registros/registros.module';
import { ReportesModule } from './reportes/reportes.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    PrismaModule,
    AuthModule,
    CategoriasModule,
    HabitosModule,
    MetasModule,
    RegistrosModule,
    ReportesModule,
    UsuariosModule,
  ],
  // Guardias globales, en este orden: primero el token (401) y luego el rol (403).
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
