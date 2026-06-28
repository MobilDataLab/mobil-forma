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
  // option_key de la materialidad elegida (de materialidad.generated.ts) o, en uso
  // libre / "Personalizado…", texto crudo en inglés escrito por el usuario.
  materialidad: string;
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

// Capa "toma" → lo que cambia en cada render. Cada eje guarda el **option_key**
// (id estable del Excel), NUNCA el texto. El texto ES (label) y la prosa EN se
// resuelven desde vocabulario.generated.ts por option_key. La cámara/vista/geometría
// vienen BLOQUEADAS de la imagen (preset): no hay ejes que las cambien.
// Las claves espejan los param_key del Excel (hoja `config`).
export type CondicionesToma = {
  // 1. Atmósfera
  register: string;       // registro atmosférico (param_key: register)
  light: string;          // condición lumínica (light)
  sky: string;            // cielo (sky)
  colorGrade: string;     // grade general (color_grade)
  shadows: string;        // sombras (shadows)
  finish: string;         // acabado + pátina (finish)
  detail: string;         // nivel de detalle (detail)
  photoReference: string; // cualidad de fotografía de referencia (photo_reference)
  people: string;         // gente y actividad (people)
  // 2. Expresión arquitectónica
  urbanEdge: string;      // cómo el edificio toca la ciudad — ADN Mobil (urban_edge)
  tectonics: string;      // profundidad / expresión de fachada (tectonics)
  accent: string;         // acento material del conjunto (accent)
  // 3. Contexto
  vegetation: string;     // densidad de vegetación o "auto" (vegetation)
  season: string;         // estación o "auto" (season)
  sustainability: string; // estrategia sustentable visible (sustainability)
  // 4. Restricciones (multi-select): option_keys activas del banco del Excel.
  // Se muestran/editan en español; al exportar el JSON usa su prompt_en.
  preserve: string[];     // qué se preserva (preserve)
  avoid: string[];        // qué se evita (avoid)
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

// Un elemento del programa en el contrato v2: color → uso → material (sin re-describir
// geometría). El material es la prosa EN resuelta desde el option_key.
export type ElementoPrograma = {
  color: string;
  use: string;
  material: string;
};

// Contrato JSON de salida v2 — prosa-primero, en capas (espejo de la hoja
// "JSON (ejemplo Batuco)" del Excel). El `prompt` es el protagonista; `locked`/
// `preserve` reemplazan a image_role/camera/no_cambiar (geometry-lock ≤2 menciones);
// los negativos migran mayormente a `preserve` (positivo). `_meta_mobil` es
// documentación Mobil que el modelo NO lee.
export type RenderContractV2 = {
  meta: { version: string; updated: string; intent: string };
  prompt: string;
  locked: {
    role: string;
    geometry_and_camera: string;
    aspect_ratio: string;
  };
  program: {
    elements: ElementoPrograma[];
    accent?: string;
  };
  scene: {
    place: string;
    climate: string;
    context: string;
    vegetation: string;
    urban_edge: string;
    tectonics: string;
  };
  atmosphere: {
    register: string;
    light: { type: string; direction: string; intensity: string; color_temperature: string };
    sky: string;
    shadows: string;
    color_grade: string;
    finish: string;
    people: string;
  };
  preserve: string[];
  avoid: string[];
  _meta_mobil: {
    design_intent: Record<string, string>;
    data_sustainability_constructability: Record<string, string[]>;
  };
};
