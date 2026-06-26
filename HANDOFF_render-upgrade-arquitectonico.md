# HANDOFF — Upgrade arquitectónico del módulo Render Controlado

> Para implementar en VS Code (vibe coding con Claude). El módulo YA existe y funciona
> (`frontend/src/render/`). Esto **extiende**, no reconstruye. Motor (`cabida_core.py`) intacto.
> Repo: `Z:\08_CLAUDE\github\Mobil-Forma\mobil-forma\frontend`

---

## 0. Objetivo

Subir el JSON de "inmobiliario" a "arquitectónico" (registro Snøhetta / MIR / Dorte Mandrup),
sin perder el control de geometría. Basado en investigación de estudios de archviz y en
revisión en vivo del corpus de Lexica (que confirmó qué NO copiar: el *booster spam*
genérico tipo "8k, ultra realistic, cinematic, clean lines minimalist").

**Principio rector:** usar el vocabulario tectónico preciso (banco curado) dentro de una
**prosa atmosférica editorial** — no una lista de etiquetas separadas por comas.

---

## 1. Lo que ya está bien (no tocar)

- Detección de color client-side, paleta vía prop del motor, sin backend.
- Mapa Leaflet **ya ligado** al JSON (`ubicacion` → `location` + `instruction`).
- Modelo de datos limpio y extensible (`tipos.ts`), múltiples materialidades por uso.

---

## 2. Los 5 frentes del upgrade

### Frente A — Composer de prosa arquitectónica (MÁXIMO IMPACTO)

Hoy `jsonBuilder` produce un diccionario plano y un `instruction` de una frase. El JSON
que SÍ funcionó (Batuco) tenía un párrafo narrativo. Agregar a `jsonBuilder.ts`:

```ts
// Compone el brief arquitectónico en prosa desde las selecciones.
export function componerPrompt(
  usos: UsoDetectado[], preset: Preset, toma: CondicionesToma, ubic: Ubicacion
): string;
```

Plantilla objetivo (en inglés, que rinde mejor en Gemini/GPT-image; mantener nombres
de uso traducidos en la leyenda):

> "Editorial architectural visualization of {tipología derivada de los usos} in {lugar}
> ({clima}). Treat the source image as locked geometry, proportions and camera — do not
> alter volumes or viewpoint. Translate each color of the legend into its real materiality:
> {uso → materialidad, en prosa}. {Atmósfera/escuela}: {luz}, {sombras}, {cielo}; {paleta de
> tono} color grade, {postproceso}. The building meets the city through {encuentro urbano}.
> Façade with {tectónica/profundidad}. Vegetation native to the site ({especies}, {estación});
> ground with {sotobosque}. Human figures as silhouettes for scale, not stock characters.
> Corrected verticals, restrained palette, subtle atmospheric depth. White volumes stay as
> neutral existing context."

El `RenderContract` pasa a tener **tres capas**: `prompt` (prosa, primario) + `params`
(lo estructurado actual, como respaldo) + `negative`. No borrar los params: conviven.

### Frente B — Banco de vocabulario tectónico

Reemplazar/ampliar las opciones genéricas. Crear `frontend/src/render/vocabulario.ts`:

```ts
// Materiales reales y específicos (regla de archviz: nunca "piedra", siempre el material).
export const MATERIALES_TECTONICOS = [
  "hormigón encofrado en tablas (board-formed)", "hormigón visto liso",
  "ladrillo a la vista, aparejo de soga", "madera laminada CLT vista",
  "madera carbonizada (shou sugi ban)", "acero cortén", "zinc junta alzada",
  "muro cortina de aluminio y vidrio", "celosía cerámica", "quiebravistas de madera",
  "travertino apomazado", "piedra local aparejada", "estuco mineral",
  "aluminio anodizado", "U-glass translúcido", "policarbonato celular",
];
```
Inyectar estos términos en las listas de `materialidad.ts` (subir su especificidad) y como
opciones donde hoy hay materialidad genérica.

### Frente C — Nuevos ejes en `CondicionesToma` (el corazón "arquitectónico")

Agregar a `tipos.ts` (y sus `OPC` en `PanelCondiciones.tsx`):

```ts
// Nuevos campos de CondicionesToma:
escuela: string;        // atmósfera / escuela de render
referenciaFoto: string; // fotografía de referencia (cualidades, opcional)
encuentroUrbano: string;// cómo el edificio toca la ciudad — ADN Mobil
tectonica: string;      // profundidad / expresión de fachada
sustentabilidad: string;// estrategia sustentable visible
```

Opciones (describen CUALIDADES, no copian estudios — más control y limpio de IP):

```ts
escuela: [
  "editorial atmosférico (luz difusa, paleta sobria, integrado al paisaje)",   // MIR/Snøhetta/Mandrup
  "documental (realismo de obra, luz natural directa, vida real)",             // registro Iwan Baan
  "narrativo urbano (saturado, energía de calle)",                             // registro Luxigon
  "conceptual / maqueta (diagramático, sin pretensión fotográfica)",
],
referenciaFoto: [
  "ninguna",
  "documental humano (contexto vivo, escala peatonal)",         // Iwan Baan
  "blanco y negro de luz y sombra (abstracción tectónica)",     // Hélène Binet
  "modernista soleado, líneas limpias",                         // Julius Shulman
],
encuentroUrbano: [
  "zócalo comercial permeable, vereda activa",
  "pórtico y retranqueo, transición público-privado",
  "acceso jerarquizado con plaza de recibo",
  "fachada continua a línea de vereda",
  "basamento macizo, cuerpo liviano",
],
tectonica: [
  "fachada profunda con sombra y ritmo estructural",
  "envolvente lisa y abstracta",
  "ritmo modular de llenos y vacíos",
  "expresión de estructura vista",
],
sustentabilidad: [
  "ninguna visible",
  "cubierta vegetal y vegetación nativa",
  "paneles solares integrados",
  "diseño biofílico, sombra pasiva, materiales naturales",
],
```

### Frente D — Defaults y luz: dos presets de atmósfera

Hoy el default es cliché comercial (`warm late-afternoon` + `acogedor, familiar, premium`).
Definir **dos perfiles de arranque** y un selector que los aplica de una vez:

- **"Editorial / arquitectura"** (nuevo default): `luz: overcast diffuse light` o `blue hour`,
  `escuela: editorial atmosférico`, `paletaTono: tierra / natural`, `genteAutos: silueta de escala`,
  `postproceso: look editorial`.
- **"Comunicación comercial"** (lo actual): cálido, acogedor, para venta.

Agregar a `OPC.luz` la opción honesta primero: `"soft diffuse overcast light"`, `"blue hour with warm interior glow"`, `"misty morning light"`.

### Frente E — Negativos anti-CGI + mapa que maneja contexto

Ampliar `NEGATIVOS_BASE` en `jsonBuilder.ts`:
```ts
"keep verticals corrected (no keystoning / no converging verticals)",
"no plastic, oversaturated or videogame-CGI look",
"no fake lens flare, no HDR halos, no glowing edges",
"no stock-looking rigid people or copy-paste trees",
"no commercial real-estate gloss; restrained architectural palette",
```
Y **acoplar el mapa al contexto**: al elegir/mover ubicación, sugerir preset de clima y
vegetación por defecto (hoy ubicación y preset se eligen por separado). La latitud puede
inferir el carácter de la luz (no las coordenadas crudas, que el modelo ignora).

---

## 3. Archivos a tocar

| Archivo | Cambio |
|---|---|
| `render/jsonBuilder.ts` | `componerPrompt()`; `RenderContract` con `prompt`; negativos anti-CGI |
| `render/tipos.ts` | nuevos campos en `CondicionesToma`; `prompt` en `RenderContract` |
| `render/PanelCondiciones.tsx` | nuevos ejes en `OPC` + `GRUPOS`; selector de perfil de atmósfera |
| `render/materialidad.ts` | subir especificidad con vocabulario tectónico |
| `render/vocabulario.ts` | **NUEVO** — bancos de materiales/luz/escuela |
| `render/RenderControlado.tsx` | `TOMA_DEFAULT` editorial; acople mapa→preset |
| `render/presetsProyecto.ts` | (opc.) más presets de clima |

Sin dependencias nuevas. Motor y flujo de cabida intactos.

---

## 4. Guardrails

- No tocar `cabida_core.py` ni la paleta (sigue por prop).
- Sin backend, sin Pyodide en este módulo. React 18 + TS.
- Claves de materialidad = nombres del motor sin tilde (`Util`, `Comun`).
- Mantener `params` estructurados (no borrarlos al agregar `prompt`).
- Antes de entregar: `npx tsc --noEmit` + `npm run dev` sin errores. Rama + PR.

---

## 5. Criterios de aceptación

1. El JSON ahora incluye un `prompt` en prosa con vocabulario tectónico y narrativa urbana.
2. Cambiar "escuela" a editorial atmosférico cambia notoriamente el tono del prompt.
3. El default arranca en perfil editorial, no en cliché comercial.
4. Los ejes de encuentro urbano y sustentabilidad aparecen en el prompt cuando se eligen.
5. Negativos incluyen verticales corregidas y anti-CGI.
6. Probar el par foto+JSON en Gemini: el render se siente arquitectónico (luz difusa,
   materialidad real, escala humana), no portal inmobiliario.
7. `tsc --noEmit` limpio; no rompe cabida ni las demás pestañas.

---

## 6. Prompt de arranque para Claude en VS Code

> Abre `frontend/src/render/` de mobil-forma. Voy a subir el nivel arquitectónico del JSON
> siguiendo este handoff (adjunto). Empieza por `vocabulario.ts` y el `componerPrompt()` de
> `jsonBuilder.ts` (la prosa es lo de mayor impacto), luego los nuevos ejes en `tipos.ts` y
> `PanelCondiciones.tsx`. Respeta los guardrails: no tocar el motor, paleta por prop, sin
> backend, mantener los `params` estructurados además del `prompt`. Rama `feature/render-arquitectonico`.
>
> Contexto de criterio: registro editorial atmosférico (luz difusa, paleta sobria, escala
> humana) tipo MIR/Snøhetta/Dorte Mandrup; NO el booster spam genérico de Lexica
> ("8k, ultra realistic, cinematic, clean lines minimalist") que produce look inmobiliario.
