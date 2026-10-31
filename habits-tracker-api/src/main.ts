import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function arrancar(): Promise<void> {
  // bodyParser: false porque configurarApp registra el suyo con el límite del contrato.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configurarApp(app);
  app.enableShutdownHooks();

  const puerto = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(puerto);
}

void arrancar();
