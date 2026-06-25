// Tipos compartidos del módulo Render Controlado.
// Flujo independiente del CSV: solo necesita el PNG + la paleta del motor.

export type RGB = [number, number, number];

// Color de proyecto detectado en la imagen (match a la paleta del motor).
export type UsoDetectado = {
  funcion: string;     // nombre canónico = motor ("Residencial Util", sin tilde)
  hex: string;         // del motor
  pct: number;         // % de área (entero)
  confirmado: boolean; // lo controla el checkbox del usuario (default true)
  materialidad: string; // opción de materialidad elegida (default = primera de la función)
};

// Color de escena: contexto/cielo/árbol → se EXCLUYE de usos, informativo.
export type ColorEscena = { etiqueta: string; pct: number };

export type InspeccionImagen = {
  usos: UsoDetectado[];
  escena: ColorEscena[];
  ancho: number;
  alto: number;
};

// Capa "toma" → lo que cambia en cada render. Ejes ampliados.
export type CondicionesToma = {
  // Luz / cámara
  luz: string;
  hora: string;
  sombras: string;
  camara: string;     // ángulo / altura
  lente: string;      // gran angular / normal / tele
  // Estilo de render
  estilo: string;     // fotorrealista / acuarela / maqueta...
  detalle: string;    // nivel de detalle
  postproceso: string;
  // Entorno / contexto
  estacion: string;
  cielo: string;
  vegetacionDensidad: string;
  mobiliario: string; // mobiliario urbano
  fondo: string;      // montañas / agua / ciudad
  atmosfera: string;
  genteAutos: string;
  // Materiales globales
  acabado: string;    // mate / brillante
  reflejos: string;
  desgaste: string;
  paletaTono: string; // cálida / fría / neutra
};

// Ubicación elegida en el mapa (Leaflet). Alimenta location/coords del JSON.
export type Ubicacion = {
  lat: number;
  lng: number;
  etiqueta: string; // texto libre del lugar (default = el del preset)
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
  location: { place: string; lat?: number; lng?: number };
  color_legend: Record<string, string>; // SOLO los usos confirmados
  context_rules: { white_volumes: string; trees: string };
  render_params: {
    light: string;
    time_of_day: string;
    shadows: string;
    camera: string;
    lens: string;
    style: string;
    detail: string;
    post: string;
    sky: string;
    vegetation_density: string;
    street_furniture: string;
    background: string;
    atmosphere: string;
    people_and_cars: string;
    finish: string;
    reflections: string;
    weathering: string;
    color_grade: string;
  };
  negative: string[];
};
