// Modelos de dominio — reflejan el schema.prisma del backend.
// En esta version inicial viven solo en memoria (sin API).

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  edad?: number;
  peso?: number;
  estatura?: number;
}

export interface CategoriaHabito {
  id: number;
  nombre: string;
  icono: string;
}

export interface Habito {
  id: number;
  usuarioId: number;
  categoriaHabitoId: number;
  nombre: string;
  descripcion?: string;
  unidadMedida: string;
  frecuencia: Frecuencia;
  activo: boolean;
}

export type Frecuencia = 'diaria' | 'semanal';

export interface Meta {
  id: number;
  habitoId: number;
  valorObjetivo: number;
  descripcion: string;
  activa: boolean;
}

export interface RegistroDiario {
  id: number;
  habitoId: number;
  /** Fecha en formato YYYY-MM-DD (se guarda como texto para evitar lios de zona horaria) */
  fecha: string;
  valorRegistrado: number;
  metaCumplida: boolean;
  notas?: string;
}

export interface Racha {
  habitoId: number;
  rachaActual: number;
  rachaMaxima: number;
}

/** Rutas de la navegacion principal (stack raiz) */
export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Tabs: undefined;
  NuevoRegistro: { habitoId?: number } | undefined;
};

/** Pestañas inferiores */
export type TabParamList = {
  Dashboard: undefined;
  Habitos: undefined;
  Metas: undefined;
  Registros: undefined;
  Historial: undefined;
};
