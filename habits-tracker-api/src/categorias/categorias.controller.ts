import { Controller, Get } from '@nestjs/common';

import { CategoriaRespuesta, CategoriasService } from './categorias.service';

/** GET /categorias (api-contract.md E-03): catálogo de solo lectura para la app. */
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  listar(): Promise<CategoriaRespuesta[]> {
    return this.categoriasService.listar();
  }
}
