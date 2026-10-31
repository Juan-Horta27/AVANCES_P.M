// Modelos de dominio del cliente. Reflejan las respuestas del API (api-contract.md, ADR-008 D-28),
// que a su vez salen del schema.prisma del backend. Los opcionales llegan como `null`.

/** Roles del sistema (ADR-011): el paciente registra sus hábitos; el profesional consulta su progreso. */
export type Rol = 'paciente' | 'profesional';

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string;
  edad: number | null;
  peso: number | null;
  estatura: number | null;
  rol: Rol;
}

/** Datos para crear una cuenta (POST /auth/register). La contraseña nunca se guarda en el cliente. */
export interface DatosNuevaCuenta {
  nombres: string;
  apellidos?: string;
  correo: string;
  contrasena: string;
  edad?: number;
  peso?: number;
  estatura?: number;
}

export interface CategoriaHabito {
  id: number;
  nombre: string;
  icono: string | null;
}

export interface Habito {
  id: number;
  categoriaHabitoId: number;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  frecuencia: Frecuencia;
  /** false = archivado: tiene historial y no se muestra en listas ni selectores (ADR-008, D-10). */
  activo: boolean;
}

export type Frecuencia = 'diaria' | 'semanal';

export interface Meta {
  id: number;
  habitoId: number;
  valorObjetivo: number;
  descripcion: string | null;
  activa: boolean;
}

export interface RegistroDiario {
  id: number;
  habitoId: number;
  /** Fecha en formato YYYY-MM-DD (se guarda como texto para evitar lios de zona horaria) */
  fecha: string;
  valorRegistrado: number;
  metaCumplida: boolean;
  notas: string | null;
}

export interface Racha {
  habitoId: number;
  rachaActual: number;
  rachaMaxima: number;
}

/** Adherencia de un hábito del paciente en un rango (GET /reportes/progreso). */
export interface ProgresoHabito {
  habitoId: number;
  nombre: string;
  categoria: string;
  icono: string | null;
  unidadMedida: string;
  activo: boolean;
  metaActiva: number | null;
  diasEvaluados: number;
  diasCumplidos: number;
  porcentajeAdherencia: number;
  rachaMaxima: number;
}

export interface ReporteProgreso {
  paciente: Usuario;
  fechaInicio: string;
  fechaFin: string;
  habitos: ProgresoHabito[];
  totales: { diasEvaluados: number; diasCumplidos: number; porcentajeAdherencia: number };
}

/** Rutas de la navegacion principal (stack raiz). Cada rol monta las suyas (ADR-011). */
export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  // Paciente
  Tabs: undefined;
  NuevoRegistro: { habitoId?: number; registroId?: number } | undefined;
  // Profesional
  Pacientes: undefined;
  ProgresoPaciente: { usuarioId: number; nombre: string };
};

/** Pestañas inferiores */
export type TabParamList = {
  Dashboard: undefined;
  Habitos: undefined;
  Metas: undefined;
  Registros: undefined;
  Historial: undefined;
};
