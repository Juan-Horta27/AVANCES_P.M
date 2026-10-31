import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface CategoriaRespuesta {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
}

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  /** El catálogo lo define el centro; aquí solo se consulta (HU-02, M-03). */
  listar(): Promise<CategoriaRespuesta[]> {
    return this.prisma.categoriaHabito.findMany({
      select: { id: true, nombre: true, descripcion: true, icono: true },
      orderBy: { id: 'asc' },
    });
  }
}
