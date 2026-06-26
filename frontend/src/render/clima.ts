import type { Preset } from "./tipos";

// Deriva el "preset de clima" desde coordenadas. La ubicación es la única fuente:
// el mapa fija lat/lng y desde ahí se infiere el clima + vegetación coherente.
//
// Chile se afina por latitud (long. acota la franja continental). Fuera de Chile,
// fallback genérico por latitud absoluta (tropical / templado / frío).

// ¿El punto cae en la franja continental de Chile? (aprox., excluye Pacífico e islas)
function enChileContinental(lat: number, lng: number): boolean {
  return lat <= -17.5 && lat >= -56 && lng <= -66 && lng >= -76;
}

// Construye un Preset a partir de clima + vegetación. id derivado para el flujo.
function preset(
  clima: string,
  especies: string[],
  sotobosque: string[],
  location = "ubicación seleccionada en el mapa"
): Preset {
  return {
    id: "auto",
    nombre: clima,
    location,
    clima,
    vegetacion: { especies, sotobosque },
  };
}

// Reglas para Chile por latitud (de norte a sur).
function climaChile(lat: number): Preset {
  if (lat > -27) {
    return preset(
      "árido (desierto / norte de Chile)",
      ["tamarugos", "pimientos", "cactáceas"],
      ["arena", "grava", "costra salina", "roca"]
    );
  }
  if (lat > -32) {
    return preset(
      "semiárido (norte chico)",
      ["espinos", "algarrobos", "chañares"],
      ["matorral xerófito", "grava", "suelo seco"]
    );
  }
  if (lat > -36) {
    return preset(
      "semiárido mediterráneo (zona central)",
      ["pimientos", "espinos", "algarrobos", "quillayes"],
      ["gramíneas secas", "arbustos xerófitos", "grava", "piedras"]
    );
  }
  if (lat > -39) {
    return preset(
      "templado lluvioso (sur de Chile)",
      ["robles", "raulíes", "arrayanes"],
      ["helechos", "praderas húmedas", "musgo"]
    );
  }
  if (lat > -43.5) {
    return preset(
      "templado lluvioso frío (Los Lagos)",
      ["coigües", "alerces", "ulmos"],
      ["helechos", "musgo", "sotobosque denso húmedo"]
    );
  }
  return preset(
    "frío austral (Patagonia)",
    ["lengas", "ñirres", "coigües de Magallanes"],
    ["coirón", "turba", "matorral bajo resistente al viento"]
  );
}

// Fallback genérico mundial por latitud absoluta.
function climaMundial(lat: number): Preset {
  const a = Math.abs(lat);
  if (a < 23.5) {
    return preset(
      "tropical",
      ["palmeras", "árboles de hoja ancha", "vegetación tropical"],
      ["césped húmedo", "sotobosque denso"]
    );
  }
  if (a < 35) {
    return preset(
      "subtropical / mediterráneo",
      ["olivos", "cipreses", "árboles de hoja perenne"],
      ["matorral", "césped seco", "grava"]
    );
  }
  if (a < 55) {
    return preset(
      "templado",
      ["árboles urbanos de hoja caduca", "robles", "arces"],
      ["césped bajo", "arbustos"]
    );
  }
  return preset(
    "frío / boreal",
    ["coníferas", "abedules", "pinos"],
    ["musgo", "líquenes", "matorral bajo"]
  );
}

// Punto de entrada: (lat, lng) → Preset de clima derivado.
export function climaDesdeCoords(lat: number, lng: number): Preset {
  return enChileContinental(lat, lng) ? climaChile(lat) : climaMundial(lat);
}
