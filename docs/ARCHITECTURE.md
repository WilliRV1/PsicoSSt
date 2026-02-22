# Arquitectura del Sistema

> Blueprint técnico de PsicoSST — plataforma de evaluación de riesgo psicosocial para el SGSST colombiano.

---

## 1. Visión General

PsicoSST es una aplicación web tipo **monolito modular** construida con Next.js que automatiza la calificación, interpretación y reportería de la Batería de Riesgo Psicosocial. Está diseñada para:

- **MVP**: Digitación de respuestas → calificación → informes → firma del psicólogo
- **Fase 2**: Analítica organizacional avanzada, módulos de IA (detección de anomalías, narrativas mejoradas, predicción de riesgo)

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Next.js 16 + React 19 + TypeScript | SSR, type safety, soporte locale `es-CO` |
| **UI** | shadcn/ui + Radix + Tailwind CSS | Componentes accesibles, dashboard profesional |
| **Backend** | Next.js API Routes (App Router) | Deployment unificado, DevOps simplificado |
| **Base de datos** | PostgreSQL 16 | ACID, JSON, RLS, cifrado, 20+ años de soporte |
| **ORM** | Prisma 7.x | Queries type-safe, migraciones versionadas |
| **Autenticación** | NextAuth.js v5 (Auth.js) | Credenciales + MFA, manejo de sesiones |
| **PDF** | `@react-pdf/renderer` | Informes con formato colombiano (DD/MM/YYYY) |
| **Importación** | SheetJS (`xlsx`) | Parsing Excel/CSV para carga masiva |
| **Firma digital** | Web Crypto API + PKCS#7 del servidor | Certificación criptográfica del psicólogo |
| **Deploy** | Docker → VPS privado o on-premise | Control total de custodia de datos |

> **¿Por qué no un SaaS de base de datos?** La Ley 1090/2006 requiere que el psicólogo o la IPS sea legalmente responsable de la custodia de datos. PostgreSQL auto-gestionado (cifrado, respaldado, con control de acceso) otorga control total.

## 3. Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO PRINCIPAL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Cuestionario       🔐 Login           📝 Digitación        │
│  en Papel          →   del Psicólogo   →  de Respuestas        │
│  (trabajador)          (MFA)              (manual o masiva)     │
│                                                                 │
│                        ┌──────────────────────────────┐         │
│                        │    ✅ Validación              │         │
│                        │    Likert 0-4, campos req.   │         │
│                        └──────────┬───────────────────┘         │
│                                   │                             │
│                        ┌──────────▼───────────────────┐         │
│                        │    🧮 Motor de Calificación  │         │
│                        │    1. Puntaje bruto          │         │
│                        │    2. Transformación 0-100   │         │
│                        │    3. Consulta de baremos    │         │
│                        │    4. Categoría de riesgo    │         │
│                        └──────────┬───────────────────┘         │
│                                   │                             │
│                        ┌──────────▼───────────────────┐         │
│                        │    📖 Interpretación          │         │
│                        │    Narrativa por dimensión   │         │
│                        └──────────┬───────────────────┘         │
│                                   │                             │
│                  ┌────────────────┼────────────────┐            │
│                  │                │                │            │
│           ┌──────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐     │
│           │📊 Dashboard│  │ 📄 PDF      │  │ ✍️ Firma   │     │
│           │ Interactivo│→ │ Informe     │→ │ Digital    │     │
│           │ (revisión) │  │ Completo    │  │ Psicólogo  │     │
│           └────────────┘  └─────────────┘  └────────────┘     │
│                                                                 │
│                        📦 Informe Certificado                   │
│                        + Log de Auditoría                       │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Autenticación y Autorización

### Modelo de Acceso

- **Único rol**: `PSICÓLOGO` — solo psicólogos con credenciales SST válidas
- **Super-admin**: Primer psicólogo registrado; aprueba nuevas cuentas
- **No hay cuentas de trabajadores** — los trabajadores no acceden al sistema

### Verificación de Identidad

| Paso | Descripción |
|---|---|
| 1. Registro | Psicólogo envía solicitud con: diploma, posgrado SST, licencia, tarjeta profesional |
| 2. Aprobación | Admin verifica credenciales y activa la cuenta |
| 3. Login | Email + contraseña |
| 4. MFA | Código TOTP (Google Authenticator o similar) |
| 5. Sesión | Cookie HttpOnly + Secure + SameSite=Strict, 30 min timeout |
| 6. Re-autenticación | Firma de informes, exportación de datos, acciones admin |

### Políticas de Sesión

| Política | Valor |
|---|---|
| Timeout por inactividad | 30 minutos |
| Duración máxima de sesión | 8 horas |
| Sesiones concurrentes | 1 por cuenta |
| Intentos fallidos de login | Bloqueo tras 5 intentos (15 min) |
| Requisitos de contraseña | Mín. 12 caracteres, mayúscula, minúscula, número, caracter especial |
| MFA | Obligatorio (TOTP) |

## 5. Arquitectura de Seguridad

| Capa | Mecanismo |
|---|---|
| **En tránsito** | TLS 1.3 (HTTPS obligatorio), headers HSTS |
| **En reposo** | PostgreSQL TDE o cifrado de disco completo (dm-crypt) |
| **Aplicación** | Bcrypt (costo 12) para contraseñas, AES-256 para PII de trabajadores |
| **Sesión** | Cookie HttpOnly + Secure + SameSite=Strict, tokens CSRF |
| **API** | Rate limiting (100 req/min), sanitización de inputs, queries parametrizadas (Prisma) |
| **Respaldos** | Backups diarios cifrados, almacenamiento off-site, retención 90 días |
| **Auditoría** | Tabla append-only inmutable (sin UPDATE/DELETE) |

## 6. Estrategia de Despliegue

```
┌─────────────────────────────────────┐
│     Reverse Proxy (Nginx)           │
│     TLS termination, HSTS           │
├─────────────────────────────────────┤
│     Docker: Next.js Application     │
│     (API + Frontend, puerto 3000)   │
├─────────────────────────────────────┤
│     Docker: PostgreSQL 16           │
│     (volumen cifrado, puerto 5432)  │
├─────────────────────────────────────┤
│  Host: Ubuntu 22.04 LTS (VPS)      │
│  Firewall: UFW (22, 443 solamente) │
│  Monitoreo: Sentry + uptime check  │
└─────────────────────────────────────┘
```

**Opción on-premise**: El mismo stack Docker Compose es desplegable en servidor local para organizaciones que requieran cero exposición a la nube.

## 7. Módulos del Sistema

```
┌─────────────────────────────────────────────────────┐
│              Monolito Modular (MVP)                  │
│                                                     │
│  ┌─────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  Auth    │  │ Evaluación  │  │ Motor de      │  │
│  │  Module  │  │ (digitación │  │ Calificación  │  │
│  │         │  │  + import)  │  │ (funciones    │  │
│  │         │  │             │  │  puras)       │  │
│  └─────────┘  └─────────────┘  └───────┬───────┘  │
│                                         │          │
│  ┌─────────┐  ┌─────────────┐  ┌───────▼───────┐  │
│  │ Import  │  │ Interpreta- │  │   Informes    │  │
│  │ Masivo  │  │ ción        │  │ (PDF + dash)  │  │
│  └─────────┘  └─────────────┘  └───────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Dashboard Psicólogo              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │                    │                │
    ┌────▼─────┐   ┌─────────▼────┐   ┌───────▼──────┐
    │ Detección│   │ Narrativas   │   │ Predicción   │
    │ Anomalías│   │ Mejoradas    │   │ de Riesgo    │
    │ (Fase 2) │   │ con IA       │   │ (Fase 2)     │
    └──────────┘   │ (Fase 2)     │   └──────────────┘
                   └──────────────┘
```

**Decisiones clave de extensibilidad:**

- **Motor de calificación**: Funciones puras sin acceso a BD ni efectos secundarios. Input: respuestas + config → Output: resultados calificados.
- **Interpretación basada en plantillas**: Templates en BD; reemplazables por texto generado con IA en Fase 2.
- **Módulo de analítica**: Pipeline separado que alimentará modelos de IA sin tocar datos core.
