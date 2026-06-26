// Tipos compartidos del módulo Render Controlado.
// Flujo independiente del CSV: solo necesita el PNG + la paleta del motor.

export type RGB = [number, number, number];

// Color de proyecto detectado en la imagen (match a la paleta del motor) o
// agregado a mano con el color picker.
export type UsoDetectado = {
  funcion: string;     // nombre canónico = motor ("Residencial Util") o nombre libre
  hex: string;         // del motor o pickeado de la imagen
  pct: number;         // % de área (entero); 0 si fue agregado a mano
  confirmado: boolean; // lo controla el checkbox del usuario (default true)
  materialidad: string; // opción de materialidad elegida o texto libre
  // Origen: "auto" = detectado por el motor; "manual" = pickeado/agregado por el usuario.
  origen?: "auto" | "manual";
  // Uso libre: la materialidad NO se valida contra el banco de la función (texto del usuario).
  libre?: boolean;
  // Atributos estructurados del elemento (derivados, editables). Opcionales.
  altura?: string;       // ej. "4–6 pisos"
  distribucion?: string; // ej. "bloques en torno a áreas verdes"
  rol?: string;          // ej. "equipamiento de baja altura"
};

// Color de escena: contexto/cielo/árbol → se EXCLUYE de usos, informativo.
export type ColorEscena = { etiqueta: string; pct: number };

export type InspeccionImagen = {
  usos: UsoDetectado[];
  escena: ColorEscena[];
  ancho: number;
  alto: number;
};

// Capa "toma" → lo que cambia en cada render. Reestructurada con enfoque
// arquitectónico: la cámara/vista/geometría vienen BLOQUEADAS de la imagen (preset),
// por eso NO hay ejes de cámara/lente/fondo. La "escuela" engloba estilo+postproceso.
export type CondicionesToma = {
  // 1. Atmósfera (la escuela define el registro; luz/cielo/paleta lo concretan)
  escuela: string;        // registro / atmósfera (editorial, documental, etc.)
  luz: string;            // condición lumínica
  cielo: string;
  paletaTono: string;     // grade general (tierra / cálida / fría / neutra)
  sombras: string;
  // 2. Expresión arquitectónica
  encuentroUrbano: string;// cómo el edificio toca la ciudad — ADN Mobil
  tectonica: string;      // profundidad / expresión de fachada
  materialGlobal: string; // acento material del conjunto (banco tectónico)
  acabado: string;        // terminación + pátina (mate/satinado/envejecido…)
  // 3. Contexto
  sustentabilidad: string;// estrategia sustentable visible
  vegetacion: string;     // "auto (del clima)" u override
  estacion: string;       // "auto (del clima)" u override
  genteAutos: string;
  // 4. Render
  detalle: string;        // nivel de detalle
  referenciaFoto: string; // cualidad de fotografía de referencia (opcional)
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

// Un elemento del proyecto (un color/uso) descrito con atributos, no una línea.
export type ElementoProyecto = {
  color: string;        // hex del uso
  use: string;          // función / uso (motor o libre)
  description: string;  // materialidad en prosa
  height?: string;      // altura percibida (editable, opcional)
  distribution?: string;// disposición (editable, opcional)
  role?: string;        // rol urbano (editable, opcional)
};

// Contrato JSON de salida — estructurado por dominio (espejo de referencia).
export type RenderContract = {
  task: string;
  source: string;
  image_role: string;
  interpretation_mode: string;

  // Cámara bloqueada: la vista viene de la imagen (preset).
  camera: {
    type: string;
    framing: string;
    aspect_ratio: string;
    camera_lock: boolean;
  };

  // Contexto urbano-territorial inferido (ubicación + clima + escena detectada).
  location: { place: string; lat?: number; lng?: number };
  context: {
    territory: string;
    climate: string;
    landscape_character: string;
    existing_buildings: string;
    roads: string;
    vegetation: string;
  };

  // Elementos del proyecto: un objeto por uso confirmado (no un legend plano).
  project_elements: ElementoProyecto[];
  // Compat: legend plano hex→texto (lo consumen flujos antiguos).
  color_legend: Record<string, string>;

  // Intención de diseño (ADN Mobil) derivada de los ejes arquitectónicos.
  design_intent: {
    city_relation: string;
    user_experience: string;
    wellbeing: string;
    urban_identity: string;
  };

  // Render: prosa primaria + negativos + lista explícita de "no cambiar".
  render_prompt: {
    prompt: string;
    negative: string[];
    no_cambiar: string[];
  };

  // Métricas/criterios (data, sustentabilidad, constructabilidad).
  data_sustainability_constructability: {
    data: string[];
    sustainability: string[];
    constructability: string[];
  };

  // Capa técnica de respaldo (ejes de la toma, estructurados).
  render_params: {
    school: string;
    light: string;
    sky: string;
    shadows: string;
    color_grade: string;
    urban_edge: string;
    tectonics: string;
    material_accent: string;
    finish: string;
    sustainability: string;
    vegetation: string;
    season: string;
    people_and_cars: string;
    detail: string;
    photo_reference: string;
  };
};
