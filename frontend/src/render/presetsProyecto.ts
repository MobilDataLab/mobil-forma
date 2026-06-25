import type { Preset } from "./tipos";

// Presets de proyecto = "clima del proyecto". Se elige una vez por proyecto.
export const PRESETS: Record<string, Preset> = {
  batuco: {
    id: "batuco",
    nombre: "Batuco — semiárido mediterráneo",
    location: "Batuco, Lampa / Colina, Región Metropolitana, Chile",
    clima: "semiárido mediterráneo",
    vegetacion: {
      especies: ["pimientos", "espinos", "algarrobos"],
      sotobosque: ["gramíneas secas", "arbustos xerófitos", "grava", "piedras"],
    },
    // v2: overrides por edificio nombrado (DS19, MUC, torre)
    // materialesOverride: { ... }
  },
  generico: {
    id: "generico",
    nombre: "Genérico — sin contexto específico",
    location: "contexto urbano chileno",
    clima: "templado",
    vegetacion: {
      especies: ["árboles urbanos locales"],
      sotobosque: ["césped bajo", "arbustos"],
    },
  },
};

// Lista ordenada para el selector (batuco primero por defecto).
export const PRESETS_LISTA: Preset[] = [PRESETS.batuco, PRESETS.generico];
