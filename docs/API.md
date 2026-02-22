# Especificación de API

> Endpoints REST de PsicoSST (Next.js App Router API Routes). Todos los endpoints requieren autenticación, salvo los de auth.

---

## 1. Convenciones

| Aspecto | Convención |
|---|---|
| Base URL | `/api/v1` |
| Formato | JSON |
| Autenticación | Cookie de sesión HttpOnly (NextAuth.js) |
| Errores | `{ "error": "código", "message": "descripción" }` |
| Paginación | `?page=1&limit=20` → `{ data: [], meta: { total, page, limit } }` |
| Fechas | ISO 8601 (`2024-01-15T10:30:00-05:00`) |

---

## 2. Autenticación

### POST `/api/auth/register`
Solicitar registro como psicólogo.

**Request:**
```json
{
  "email": "psicologo@ejemplo.com",
  "password": "M1Contraseña$Segura",
  "fullName": "María García López",
  "licenseNumber": "12345-SST",
  "professionalCard": "TP-98765",
  "sstCredential": "Esp. SST — Universidad Javeriana, 2022"
}
```

**Response:** `201 Created`
```json
{
  "message": "Solicitud enviada. Un administrador revisará su registro.",
  "status": "PENDING"
}
```

### POST `/api/auth/login`
Iniciar sesión (paso 1 — credenciales).

**Request:** `{ "email": "...", "password": "..." }`
**Response:** `200 OK` → `{ "requiresMfa": true }` o sesión activa

### POST `/api/auth/mfa/verify`
Verificar código TOTP (paso 2).

**Request:** `{ "code": "123456" }`
**Response:** `200 OK` → sesión activa (cookie creada)

### POST `/api/auth/logout`
Cerrar sesión e invalidar cookie.

---

## 3. Psicólogos (Admin)

### GET `/api/v1/psychologists`
Listar psicólogos (solo admin).

### PATCH `/api/v1/psychologists/:id/status`
Aprobar o suspender un psicólogo.

**Request:** `{ "status": "ACTIVE" | "SUSPENDED" }`

---

## 4. Organizaciones

### POST `/api/v1/organizations`
Crear organización.

**Request:**
```json
{
  "name": "Empresa SAS",
  "nit": "900123456-1",
  "economicSector": "Tecnología",
  "city": "Bogotá",
  "department": "Cundinamarca",
  "employeeCount": 150
}
```

### GET `/api/v1/organizations`
Listar organizaciones del psicólogo actual.

### GET `/api/v1/organizations/:id`
Detalle de organización con resumen de evaluaciones.

---

## 5. Trabajadores

### POST `/api/v1/organizations/:orgId/workers`
Crear trabajador (PII cifrada antes de almacenar).

**Request:**
```json
{
  "documentType": "CC",
  "documentId": "1234567890",
  "fullName": "Carlos Pérez Martínez",
  "birthDate": "1990-03-15",
  "gender": "MALE",
  "educationLevel": "PROFESIONAL",
  "jobTitle": "Ingeniero de Sistemas",
  "jobLevel": "PROFESIONAL",
  "area": "Tecnología",
  "tenure": "3 años"
}
```

**Response:**
```json
{
  "id": "uuid",
  "documentType": "CC",
  "documentId": "****7890",
  "fullName": "Carlos P****",
  "jobLevel": "PROFESIONAL",
  "recommendedForm": "A"
}
```

### GET `/api/v1/organizations/:orgId/workers`
Listar trabajadores (PII enmascarada).

---

## 6. Evaluaciones

### POST `/api/v1/assessments`
Crear una nueva evaluación.

**Request:**
```json
{
  "workerId": "uuid",
  "organizationId": "uuid",
  "formType": "A",
  "questionnaireType": "INTRALABORAL",
  "assessmentDate": "2024-01-15"
}
```

### GET `/api/v1/assessments`
Listar evaluaciones con filtros.

**Query params:** `?organizationId=uuid&status=DRAFT&formType=A&page=1`

### GET `/api/v1/assessments/:id`
Detalle completo con respuestas, resultados y estado.

---

## 7. Respuestas

### PUT `/api/v1/assessments/:id/responses`
Guardar respuestas para una evaluación (manual).

**Request:**
```json
{
  "responses": {
    "1": 3,
    "2": 0,
    "3": 4,
    "4": 2
  },
  "isComplete": true
}
```

**Validaciones:**
- Cada valor debe estar entre 0-4 (escala Likert)
- Ítems obligatorios según tipo de formulario
- No se permiten claves fuera del rango de ítems del cuestionario

**Response:** `200 OK`
```json
{
  "totalItems": 123,
  "isComplete": true,
  "validation": { "errors": [], "warnings": [] }
}
```

---

## 8. Calificación

### POST `/api/v1/assessments/:id/score`
Ejecutar el motor de calificación.

**Precondiciones:** `ResponseSet.isComplete` debe ser `true`

**Response:** `200 OK`
```json
{
  "dimensionScores": {
    "liderazgo_caracteristicas": {
      "rawScore": 28,
      "transformedScore": 53.85,
      "riskCategory": "ALTO"
    }
  },
  "domainScores": {
    "liderazgo_relaciones": {
      "transformedScore": 51.83,
      "riskCategory": "ALTO"
    }
  },
  "totalScore": {
    "transformedScore": 42.68,
    "riskCategory": "MEDIO"
  }
}
```

---

## 9. Informes

### POST `/api/v1/assessments/:id/report`
Generar informe (borrador).

### GET `/api/v1/assessments/:id/report`
Obtener informe con interpretaciones y recomendaciones.

### POST `/api/v1/assessments/:id/report/sign`
Firmar digitalmente el informe (requiere re-autenticación).

**Request:** `{ "password": "contraseña_actual" }`

### GET `/api/v1/assessments/:id/report/pdf`
Descargar PDF del informe firmado.

---

## 10. Importación Masiva

### POST `/api/v1/import`
Subir archivo Excel/CSV con respuestas masivas.

**Request:** `multipart/form-data` con archivo adjunto

**Formato CSV esperado:**

| Columna | Descripción |
|---|---|
| `document_id` | Cédula del trabajador |
| `form_type` | A o B |
| `questionnaire_type` | INTRALABORAL, EXTRALABORAL, STRESS |
| `assessment_date` | DD/MM/YYYY |
| `item_1` … `item_123` | Valores Likert 0-4 |

**Response:**
```json
{
  "importJobId": "uuid",
  "status": "PROCESSING",
  "totalRows": 50,
  "validRows": 48,
  "errorRows": 2,
  "errors": [
    { "row": 12, "field": "item_45", "error": "Valor 5 fuera de rango (0-4)" },
    { "row": 31, "field": "document_id", "error": "Trabajador no encontrado" }
  ]
}
```

### GET `/api/v1/import/:jobId`
Estado de un trabajo de importación.

---

## 11. Dashboard / Analítica

### GET `/api/v1/dashboard/summary`
Resumen general del psicólogo (evaluaciones recientes, pendientes, estadísticas).

### GET `/api/v1/organizations/:orgId/analytics`
Analítica organizacional — distribución de riesgo, dimensiones críticas, tendencias.

---

## 12. Auditoría

### GET `/api/v1/audit-logs` (solo admin)
Consultar log de auditoría.

**Query params:** `?userId=uuid&action=ASSESSMENT_SCORED&from=2024-01-01&to=2024-02-01`

---

## 13. Códigos de Error

| Código HTTP | Error Code | Descripción |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 401 | `UNAUTHORIZED` | No autenticado |
| 403 | `FORBIDDEN` | Sin permisos para esta acción |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 409 | `CONFLICT` | Duplicado (ej. NIT ya existe) |
| 422 | `INCOMPLETE_RESPONSES` | Intentar calificar sin respuestas completas |
| 429 | `RATE_LIMIT` | Demasiadas solicitudes |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |
