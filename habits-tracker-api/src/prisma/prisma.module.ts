import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Global: cualquier módulo de dominio puede inyectar PrismaService sin importarlo. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
