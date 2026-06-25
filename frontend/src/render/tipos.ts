// Tipos compartidos del módulo Render Controlado.
// Flujo independiente del CSV: solo necesita el PNG + la paleta del motor.

export type RGB = [number, number, number];

// Color de proyecto detectado en la imagen (match a la paleta del motor).
export type UsoDetectado = {
  funcion: string;     // nombre canónico = motor ("Residencial Util", sin tilde)
  hex: string;         // del motor
  pct: number;         // % de área (entero)
  confirmado: boolean; // lo controla el checkbox del usuario (default true)
};

// Color de escena: contexto/cielo/árbol → se EXCLUYE de usos, informativo.
export type ColorEscena = { etiqueta: string; pct: number };

export type InspeccionImagen = {
  usos: UsoDetectado[];
  escena: ColorEscena[];
  ancho: number;
  alto: number;
};

// Capa "toma" → lo que cambia en cada render.
export type CondicionesToma = {
  luz: string;
  estacion: string;
  cielo: string;
  atmosfera: string;
  genteAutos: string;
};

// Capa "preset" → proyecto, se define una vez.
export type Preset = {
  id: string;
  nombre: string;
  location: string;
  clima: string;
  vegetacion: { especies: string[]; sotobosque: string[] };
  materialesOverride?: Record<string, string>; // por edificio (modo proyecto / v2)
};

// Contrato JSON de salida.
export type RenderContract = {
  task: string;
  image_role: string;
  interpretation_mode: string;
  instruction: string;
  color_legend: Record<string, string>; // SOLO los usos confirmados
  context_rules: { white_volumes: string; trees: string };
  render_params: { light: string; atmosphere: string; sky: string; people_and_cars: string };
  negative: string[];
};
