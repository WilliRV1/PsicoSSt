# Hoja de Ruta de Implementación

> Plan de ejecución por fases, estimaciones de esfuerzo y estrategia de testing para PsicoSST.

---

## 1. Fases de Desarrollo

### Fase 1: MVP — "Calificación y Reportes" ⏱️ 8-10 semanas

> Flujo completo: digitación → calificación → interpretación → informe → firma

| Módulo | Tareas | Complejidad | Estimación |
|---|---|---|---|
| **1.1 Infraestructura** | Next.js, Docker, Prisma, esquema BD | Media | ✅ **Completado** |
| **1.2 Autenticación** | Login, registro con aprobación, MFA (TOTP), sesiones | Alta | 2 semanas |
| **1.3 Configuración Batería** | Extraer JSON del PDF: ítems, dimensiones, baremos | Media | 1 semana |
| **1.4 Motor de Calificación** | Funciones puras: puntaje bruto → transformación → baremo → riesgo | Alta | 2 semanas |
| **1.5 Digitación Manual** | UI para ingresar respuestas ítem por ítem, validación Likert | Media | 1.5 semanas |
| **1.6 Importación Masiva** | Upload Excel/CSV, parseo, validación, creación batch | Media | 1 semana |
| **1.7 Interpretación** | Templates por dimensión × nivel de riesgo | Baja | 0.5 semanas |
| **1.8 Informes (PDF + Dashboard)** | PDF con react-pdf, dashboard interactivo con Recharts | Alta | 2 semanas |
| **1.9 Firma Digital** | Re-auth + hash SHA-256 + sello inmutable | Media | 0.5 semanas |

#### Ruta Crítica del MVP

```
1.1 Infraestructura ✅
 │
 ├── 1.2 Autenticación
 │    │
 │    ├── 1.5 Digitación Manual ──┐
 │    │                           │
 │    ├── 1.6 Importación Masiva  │
 │    │                           │
 │    └── 1.3 Config Batería ─────┤
 │         │                      │
 │         └── 1.4 Motor Calif. ──┤
 │              │                 │
 │              └── 1.7 Interp. ──┤
 │                                │
 │                                ├── 1.8 Informes
 │                                │    │
 │                                │    └── 1.9 Firma Digital
 │                                │
 │                                └── 🏁 MVP Listo
```

**Dependencias críticas:**
- La autenticación bloquea todos los demás módulos
- La configuración de la batería bloquea el motor de calificación
- El motor de calificación bloquea la interpretación e informes

---

### Fase 2: Analítica y IA — ⏱️ 6-8 semanas adicionales

| Módulo | Tareas | Complejidad | Estimación |
|---|---|---|---|
| **2.1 Dashboard Organizacional** | Distribución de riesgo por área, dimensiones críticas, heatmaps | Alta | 2 semanas |
| **2.2 Analítica Temporal** | Tendencias entre evaluaciones, comparación con baremos normativos | Alta | 2 semanas |
| **2.3 Detección de Anomalías** | Patrones inusuales en respuestas, flags para revisión del psicólogo | Alta | 2 semanas |
| **2.4 Narrativas IA** | Interpretaciones mejoradas con LLM, customizables por contexto organizacional | Media | 1.5 semanas |
| **2.5 Predicción de Riesgo** | Modelo predictivo basado en historiales de evaluación | Alta | 2 semanas |

> Los módulos de IA se diseñan como servicios independientes que consumen datos del motor core sin modificarlo.

---

## 2. Estructura de cada Módulo

Para cada módulo, el desarrollo sigue esta secuencia:

```
1. Modelo de datos (si aplica)
2. API endpoints (validación, lógica de negocio)
3. Tests unitarios (funciones puras)
4. Tests de integración (API + BD)
5. Componentes UI
6. Tests E2E (flujo completo)
```

---

## 3. Estrategia de Testing

### 3.1 Tests Unitarios ⚙️

| Área | Herramienta | Qué se prueba |
|---|---|---|
| Motor de calificación | Vitest | Puntaje bruto para cada formulario, inversión de ítems, transformación 0-100, búsqueda de baremo, categoría de riesgo |
| Validación de respuestas | Vitest | Rango Likert (0-4), ítems obligatorios, completitud |
| Parseo de importación | Vitest | CSV/Excel con datos válidos, inválidos, faltantes |
| Hash de firma | Vitest | Determinismo del hash, inclusión de timestamp y credenciales |

**Cobertura objetivo: > 90% en el motor de calificación**

### 3.2 Tests de Integración 🔗

| Área | Herramienta | Qué se prueba |
|---|---|---|
| API endpoints | Vitest + Supertest | CRUD completo, validaciones, autenticación |
| Flujo de calificación | Vitest | Respuestas → calificación → resultado en BD |
| Importación masiva | Vitest | Upload → parsing → validación → creación en BD |

### 3.3 Tests End-to-End 🌐

| Flujo | Herramienta | Qué se prueba |
|---|---|---|
| Login + MFA | Playwright | Login, código TOTP, redirección, timeout |
| Digitación → Informe | Playwright | Crear evaluación, ingresar respuestas, calificar, generar PDF, firmar |
| Importación masiva | Playwright | Subir archivo, verificar progreso, revisar resultados |

### 3.4 Validación de Compliance ✅

| Prueba | Método |
|---|---|
| **Exactitud de calificación** | Comparar resultados del motor contra cálculos manuales del manual oficial (mínimo 20 casos de prueba por formulario) |
| **Baremos correctos** | Verificar umbrales de riesgo contra tablas del manual |
| **Integridad de ítems** | Confirmar que cada ítem está asignado a la dimensión correcta |
| **Inversión de ítems** | Verificar que los ítems invertidos producen `4 - valor` |
| **Consentimiento requerido** | Verificar que no se puede evaluar sin consentimiento |
| **Firma obligatoria** | Verificar que no se puede exportar sin firma |

---

## 4. Estado Actual

| Fase | Estado | Progreso |
|---|---|---|
| 1.1 Infraestructura | ✅ Completado | 100% |
| 1.2 Autenticación | ⏳ Pendiente | 0% |
| 1.3 Config Batería | ⏳ Pendiente | 0% |
| 1.4 Motor de Calificación | ⏳ Pendiente | 0% |
| 1.5 Digitación Manual | ⏳ Pendiente | 0% |
| 1.6 Importación Masiva | ⏳ Pendiente | 0% |
| 1.7 Interpretación | ⏳ Pendiente | 0% |
| 1.8 Informes | ⏳ Pendiente | 0% |
| 1.9 Firma Digital | ⏳ Pendiente | 0% |

---

## 5. Definición de Listo (Definition of Done)

Un módulo se considera **terminado** cuando:

- [ ] Código implementado y funcional
- [ ] Tests unitarios e integración pasando (cobertura ≥ 80%)
- [ ] Código revisado (si hay equipo)
- [ ] Documentación de API actualizada
- [ ] Log de auditoría integrado
- [ ] Compatible con las demás funcionalidades existentes
- [ ] Sin errores de compilación TypeScript
