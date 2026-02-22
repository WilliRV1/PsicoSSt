# Motor de Calificación

> Especificación técnica del algoritmo de calificación de la Batería de Riesgo Psicosocial. Este documento es la referencia para implementar las funciones puras del motor.

---

## 1. Pipeline de Calificación

```
Respuestas crudas (JSONB)
    │
    ▼
┌──────────────────────────┐
│ 1. Inversión de ítems    │  Ítems invertidos: valor → (4 - valor)
│    applyInversions()     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. Puntaje bruto         │  Suma de valores por dimensión
│    calculateRawScores()  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. Transformación 0-100  │  raw × factor = (raw / maxPossible) × 100
│    transformScores()     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 4. Consulta de baremos   │  Tabla de percentiles → categoría de riesgo
│    lookupBaremo()        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 5. Agregación dominios   │  Suma de dimensiones → dominio → riesgo
│    aggregateDomains()    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 6. Puntaje total         │  Suma de todos los dominios → riesgo total
│    calculateTotal()      │
└──────────────────────────┘
```

---

## 2. Escala Likert

Todos los cuestionarios usan una escala de 5 puntos:

| Valor | Significado (general) |
|---|---|
| 0 | Siempre / Totalmente de acuerdo |
| 1 | Casi siempre / De acuerdo |
| 2 | Algunas veces / Ni de acuerdo ni en desacuerdo |
| 3 | Casi nunca / En desacuerdo |
| 4 | Nunca / Totalmente en desacuerdo |

> **Ítems invertidos**: Algunos ítems están formulados en sentido positivo (un mayor puntaje indica menor riesgo). Para estos ítems, se aplica: `valor_invertido = 4 - valor_original`.

---

## 3. Paso 1: Inversión de Ítems

```typescript
function applyInversions(
  responses: Record<string, number>,
  invertedItems: number[]
): Record<string, number> {
  const result = { ...responses };
  for (const item of invertedItems) {
    const key = String(item);
    if (key in result) {
      result[key] = 4 - result[key];
    }
  }
  return result;
}
```

Los ítems invertidos para cada dimensión se definen en los archivos JSON de configuración (ver `src/config/battery/`).

---

## 4. Paso 2: Puntaje Bruto por Dimensión

```
Puntaje bruto = Σ(valores de ítems de la dimensión)
```

```typescript
function calculateRawScore(
  responses: Record<string, number>,
  itemNumbers: number[]
): { rawScore: number; maxPossible: number } {
  let rawScore = 0;
  for (const item of itemNumbers) {
    rawScore += responses[String(item)] ?? 0;
  }
  const maxPossible = itemNumbers.length * 4; // máximo posible = nítems × 4
  return { rawScore, maxPossible };
}
```

---

## 5. Paso 3: Transformación a Escala 0-100

Fórmula oficial del manual:

```
Puntaje transformado = (Puntaje bruto / Puntaje máximo posible) × 100
```

Donde:
- **Puntaje máximo posible** = número de ítems de la dimensión × 4

```typescript
function transformScore(rawScore: number, maxPossible: number): number {
  if (maxPossible === 0) return 0;
  return Math.round((rawScore / maxPossible) * 100 * 100) / 100; // 2 decimales
}
```

> **Nota**: El factor de transformación general es `100 / maxPossible`. Para una dimensión de 13 ítems: factor = `100 / 52 = 1.923`.

---

## 6. Paso 4: Consulta de Baremos

Los baremos son tablas de percentiles que convierten el puntaje transformado en una categoría de riesgo. Los baremos varían por:

- **Tipo de cuestionario** (Intralaboral, Extralaboral, Estrés)
- **Tipo de forma** (A o B, solo para Intralaboral)
- **Nivel de análisis** (dimensión, dominio, total)

### Estructura de un baremo

```json
{
  "liderazgo_caracteristicas": {
    "SIN_RIESGO": [0, 7.7],
    "BAJO":       [7.8, 19.2],
    "MEDIO":      [19.3, 32.7],
    "ALTO":       [32.8, 46.2],
    "MUY_ALTO":   [46.3, 100]
  }
}
```

### Función de lookup

```typescript
function lookupRiskCategory(
  transformedScore: number,
  thresholds: BaremoThreshold
): RiskCategory {
  if (transformedScore <= thresholds.sinRiesgo[1]) return "SIN_RIESGO";
  if (transformedScore <= thresholds.bajo[1])      return "BAJO";
  if (transformedScore <= thresholds.medio[1])     return "MEDIO";
  if (transformedScore <= thresholds.alto[1])      return "ALTO";
  return "MUY_ALTO";
}
```

> **IMPORTANTE**: Los baremos exactos deben extraerse de las tablas del manual oficial (Batería-riesgo-psicosocial-1.pdf). Son diferentes para cada dimensión, dominio y cuestionario.

---

## 7. Paso 5: Agregación de Dominios

El puntaje de un dominio es la suma de los puntajes brutos de sus dimensiones, transformada a 0-100:

```
Puntaje bruto dominio = Σ(puntajes brutos de dimensiones del dominio)
Máximo posible dominio = Σ(máximos posibles de dimensiones del dominio)
Puntaje transformado dominio = (bruto dominio / máximo dominio) × 100
```

Luego se consulta el baremo de dominio para obtener la categoría de riesgo.

---

## 8. Paso 6: Puntaje Total

El puntaje total del cuestionario sigue la misma lógica que los dominios:

```
Puntaje bruto total = Σ(puntajes brutos de todos los dominios)
Máximo posible total = Σ(máximos posibles de todos los dominios)
Puntaje transformado total = (bruto total / máximo total) × 100
```

Se consulta el baremo de "total" para la categoría de riesgo general.

---

## 9. Cuestionario de Estrés

El cuestionario de estrés tiene un algoritmo ligeramente diferente:

| Valor | Significado |
|---|---|
| 0 | Siempre |
| 1 | Casi siempre |
| 2 | A veces |
| 3 | Nunca |

> **No hay ítems invertidos** en el cuestionario de estrés.

- Se suman todos los ítems para obtener el puntaje bruto
- Se transforma a 0-100
- Se consulta el baremo de estrés (diferente para cada grupo ocupacional)

---

## 10. Reglas de Negocio (Validaciones)

| Regla | Descripción |
|---|---|
| Rango Likert | Cada respuesta debe ser un entero entre 0 y 4 |
| Completitud | Todos los ítems del cuestionario deben tener respuesta |
| Forma correcta | Los ítems deben corresponder al formulario asignado |
| Idempotencia | Calificar la misma evaluación debe producir el mismo resultado |
| Sin efectos secundarios | El motor no modifica la BD, solo retorna datos |

---

## 11. Ejemplo de Calificación (Forma A, Dimensión "Claridad de rol")

| Paso | Cálculo |
|---|---|
| Ítems | 79, 80, 81, 82, 83, 84, 85 (7 ítems) |
| Ítems invertidos | 79, 80, 81, 82, 83, 84, 85 (todos) |
| Respuestas originales | 1, 0, 2, 0, 1, 1, 0 |
| Respuestas invertidas | 3, 4, 2, 4, 3, 3, 4 |
| Puntaje bruto | 3+4+2+4+3+3+4 = **23** |
| Máximo posible | 7 × 4 = **28** |
| Puntaje transformado | (23/28) × 100 = **82.14** |
| Baremo (Forma A) | 82.14 → **MUY_ALTO** |

---

## 12. Archivos de Configuración (por crear)

La configuración completa se almacena en JSON dentro de `src/config/battery/`:

| Archivo | Contenido |
|---|---|
| `form-a-config.json` | 16 dimensiones × [ítems, ítems invertidos] |
| `form-b-config.json` | 13 dimensiones × [ítems, ítems invertidos] |
| `extralaboral-config.json` | 7 dimensiones × [ítems, ítems invertidos] |
| `stress-config.json` | 4 categorías × [ítems] |
| `baremos-intralaboral-a.json` | Umbrales por dimensión, dominio y total |
| `baremos-intralaboral-b.json` | Umbrales por dimensión, dominio y total |
| `baremos-extralaboral.json` | Umbrales por dimensión y total |
| `baremos-stress.json` | Umbrales por grupo ocupacional |

> **Todos estos archivos deben extraerse fielmente del manual oficial.**
