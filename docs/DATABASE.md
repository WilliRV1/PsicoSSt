# Modelo de Datos

> Esquema completo de la base de datos PostgreSQL para PsicoSST, incluyendo las dimensiones de la batería y estructuras JSONB.

---

## 1. Diagrama Entidad-Relación

```
PSYCHOLOGIST ──┬── crea ──── ASSESSMENT ─── contiene ──── RESPONSE_SET
               │                 │
               │                 ├── produce ──── SCORED_RESULT
               │                 │
               │                 ├── genera ──── REPORT
               │                 │
               │                 └── tiene ──── INFORMED_CONSENT
               │
               ├── firma ──── REPORT
               │
               ├── crea ──── ORGANIZATION ──── emplea ──── WORKER
               │
               └── genera ──── AUDIT_LOG
```

## 2. Modelos (Tablas)

### Psychologist (psychologists)
Usuarios del sistema — psicólogos licenciados con credenciales SST.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `email` | String (unique) | Correo electrónico |
| `password_hash` | String | Hash bcrypt de la contraseña |
| `full_name` | String | Nombre completo |
| `license_number` | String (unique) | Número de licencia SST |
| `professional_card` | String | Tarjeta profesional |
| `sst_credential` | String | Credencial de posgrado en SST |
| `mfa_secret` | String? | Secreto TOTP para MFA |
| `mfa_enabled` | Boolean | MFA activado |
| `status` | Enum | PENDING, ACTIVE, SUSPENDED, INACTIVE |
| `is_admin` | Boolean | Es super-administrador |
| `failed_attempts` | Int | Intentos fallidos de login |
| `locked_until` | DateTime? | Bloqueado hasta (por intentos fallidos) |

### Organization (organizations)
Empresas evaluadas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | String | Razón social |
| `nit` | String (unique) | NIT de la empresa |
| `economic_sector` | String? | Sector económico |
| `city` | String? | Ciudad |
| `department` | String? | Departamento colombiano |
| `employee_count` | Int? | Número de empleados |

### Worker (workers)
Trabajadores evaluados. Los campos `document_id` y `full_name` se cifran en la capa de aplicación.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `document_type` | Enum | CC, CE, TI, PA, OTHER |
| `document_id` | String | Número de documento (cifrado) |
| `full_name` | String | Nombre completo (cifrado) |
| `education_level` | Enum | PRIMARIA a DOCTORADO |
| `job_level` | Enum | JEFATURA, PROFESIONAL, TECNICO, AUXILIAR, OPERATIVO |
| `organization_id` | UUID (FK) | Organización a la que pertenece |

> **Selección de forma**: `job_level` determina qué forma se aplica:
> - JEFATURA, PROFESIONAL, TECNICO → **Forma A** (123 ítems)
> - AUXILIAR, OPERATIVO → **Forma B** (97 ítems)

### Assessment (assessments)
Una sesión de evaluación (aplicación de un instrumento a un trabajador).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador |
| `worker_id` | UUID (FK) | Trabajador evaluado |
| `psychologist_id` | UUID (FK) | Psicólogo que evalúa |
| `organization_id` | UUID (FK) | Organización |
| `form_type` | Enum | A o B |
| `questionnaire_type` | Enum | INTRALABORAL, EXTRALABORAL, STRESS |
| `assessment_date` | Date | Fecha de aplicación |
| `status` | Enum | DRAFT → IN_PROGRESS → COMPLETED → SCORED → REVIEWED → SIGNED |
| `input_method` | Enum | MANUAL o BULK |

### ResponseSet (response_sets)
Respuestas crudas por ítem (JSONB).

| Campo | Tipo | Descripción |
|---|---|---|
| `assessment_id` | UUID (FK, unique) | Evaluación asociada |
| `responses` | JSONB | `{"1": 3, "2": 0, "3": 4, ...}` — ítem → valor Likert (0-4) |
| `total_items` | Int | Total de ítems respondidos |
| `is_complete` | Boolean | Todas las respuestas completadas |

### ScoredResult (scored_results)
Resultados calificados por el motor de puntuación (JSONB).

| Campo | Tipo | Descripción |
|---|---|---|
| `assessment_id` | UUID (FK, unique) | Evaluación asociada |
| `dimension_scores` | JSONB | Puntajes por dimensión (ver sección 3) |
| `domain_scores` | JSONB | Puntajes por dominio |
| `total_scores` | JSONB | Puntaje total del cuestionario |
| `overall_risk_category` | Enum | Categoría de riesgo general |

### InformedConsent (informed_consents), Report (reports), AuditLog (audit_logs), ImportJob (import_jobs)
Ver `prisma/schema.prisma` para definiciones completas.

---

## 3. Dimensiones de la Batería

### Cuestionario Intralaboral — 4 Dominios, 19 Dimensiones

#### Dominio 1: Liderazgo y Relaciones Sociales en el Trabajo

| # | Clave | Dimensión | Ítems A | Ítems B |
|---|---|---|---|---|
| 1 | `liderazgo_caracteristicas` | Características del liderazgo | 13 | 13 |
| 2 | `relaciones_sociales` | Relaciones sociales en el trabajo | 14 | 10 |
| 3 | `retroalimentacion_desempeno` | Retroalimentación del desempeño | 5 | 5 |
| 4 | `relacion_colaboradores` | Relación con los colaboradores (subordinados) | 9 | N/A |
| | | **Total dominio** | **41** | **28** |

#### Dominio 2: Control sobre el Trabajo

| # | Clave | Dimensión | Ítems A | Ítems B |
|---|---|---|---|---|
| 5 | `claridad_rol` | Claridad de rol | 7 | 7 |
| 6 | `capacitacion` | Capacitación | 3 | 3 |
| 7 | `participacion_cambio` | Participación y manejo del cambio | 4 | 4 |
| 8 | `oportunidades_desarrollo` | Oportunidades de desarrollo y uso de habilidades | 4 | 4 |
| 9 | `control_autonomia` | Control y autonomía sobre el trabajo | 3 | 3 |
| | | **Total dominio** | **21** | **21** |

#### Dominio 3: Demandas del Trabajo

| # | Clave | Dimensión | Ítems A | Ítems B |
|---|---|---|---|---|
| 10 | `demandas_ambientales` | Demandas ambientales y de esfuerzo físico | 12 | 12 |
| 11 | `demandas_emocionales` | Demandas emocionales | 9 | 7 |
| 12 | `demandas_cuantitativas` | Demandas cuantitativas | 6 | 6 |
| 13 | `influencia_trabajo_extralaboral` | Influencia del trabajo sobre el entorno extralaboral | 4 | 4 |
| 14 | `exigencias_responsabilidad` | Exigencias de responsabilidad del cargo | 6 | N/A |
| 15 | `demandas_carga_mental` | Demandas de carga mental | 5 | N/A |
| 16 | `consistencia_rol` | Consistencia del rol | 5 | N/A |
| 17 | `demandas_jornada` | Demandas de la jornada de trabajo | 3 | 3 |
| | | **Total dominio** | **50** | **32** |

#### Dominio 4: Recompensa

| # | Clave | Dimensión | Ítems A | Ítems B |
|---|---|---|---|---|
| 18 | `reconocimiento_compensacion` | Reconocimiento y compensación | 6 | 6 |
| 19 | `recompensas_pertenencia` | Recompensas de la pertenencia a la organización | 5 | 5 |
| | | **Total dominio** | **11** | **11** |

> **Totales**: Forma A = 123 ítems | Forma B = 97 ítems (incluye ítems generales)

### Cuestionario Extralaboral — 7 Dimensiones (31 ítems)

| # | Clave | Dimensión | Ítems |
|---|---|---|---|
| 1 | `tiempo_fuera_trabajo` | Tiempo fuera del trabajo | 4 |
| 2 | `relaciones_familiares` | Relaciones familiares | 3 |
| 3 | `comunicacion_relaciones` | Comunicación y relaciones interpersonales | 5 |
| 4 | `situacion_economica` | Situación económica del grupo familiar | 3 |
| 5 | `caracteristicas_vivienda` | Características de la vivienda y de su entorno | 9 |
| 6 | `influencia_entorno_extralaboral` | Influencia del entorno extralaboral sobre el trabajo | 3 |
| 7 | `desplazamiento_vivienda` | Desplazamiento vivienda–trabajo–vivienda | 4 |

### Cuestionario de Estrés — 4 Categorías (31 ítems)

| Categoría | Ítems |
|---|---|
| Síntomas fisiológicos | 8 |
| Síntomas de comportamiento social | 4 |
| Síntomas intelectuales y laborales | 10 |
| Síntomas psicoemocionales | 9 |

### Categorías de Riesgo

| Categoría | Valor Enum | Nivel | Color |
|---|---|---|---|
| Sin riesgo o despreciable | `SIN_RIESGO` | 1 | 🟢 Verde |
| Bajo | `BAJO` | 2 | 🟡 Amarillo |
| Medio | `MEDIO` | 3 | 🟠 Naranja |
| Alto | `ALTO` | 4 | 🔴 Rojo |
| Muy alto | `MUY_ALTO` | 5 | 🔴 Rojo oscuro |

---

## 4. Estructura JSONB de Resultados

```json
{
  "formType": "A",
  "questionnaireType": "INTRALABORAL",
  "dimensions": {
    "liderazgo_caracteristicas": {
      "dimensionKey": "liderazgo_caracteristicas",
      "dimensionName": "Características del liderazgo",
      "rawScore": 28,
      "maxPossible": 52,
      "transformedScore": 53.85,
      "transformationFactor": 1.923,
      "riskCategory": "ALTO",
      "riskLevel": 4,
      "itemCount": 13,
      "invertedItems": [3, 5, 9]
    }
  },
  "domains": {
    "liderazgo_relaciones": {
      "domainKey": "liderazgo_relaciones",
      "domainName": "Liderazgo y Relaciones Sociales",
      "rawScore": 85,
      "transformedScore": 51.83,
      "riskCategory": "ALTO",
      "riskLevel": 4
    }
  },
  "total": {
    "rawScore": 210,
    "transformedScore": 42.68,
    "riskCategory": "MEDIO",
    "riskLevel": 3
  }
}
```

## 5. Retención y Eliminación de Datos

| Dato | Retención | Método de eliminación |
|---|---|---|
| Resultados de evaluación | 20 años | Borrado criptográfico |
| PII de trabajadores | Duración del empleo + 5 años | Destrucción de clave AES |
| Logs de auditoría | 10 años mínimo | Archivo de solo lectura |
| Informes PDF | 20 años | Archivo cifrado |
| Datos de sesión | 24 horas | Purga automática |
