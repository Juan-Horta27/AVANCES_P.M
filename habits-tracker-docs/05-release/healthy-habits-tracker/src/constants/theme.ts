// Tema visual unico de la app.
// Mantiene la misma paleta oscura que la version web para dar continuidad de marca.

export const colors = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#21262D',
  border: '#30363D',

  text: '#E6EDF3',
  muted: '#8B949E',
  subtle: '#484F58',

  teal: '#2DD4BF',
  green: '#3FB950',
  orange: '#F0883E',
  red: '#F85149',
  blue: '#58A6FF',

  // Fondos suaves para mensajes
  greenSoft: '#162017',
  redSoft: '#2D1517',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;
