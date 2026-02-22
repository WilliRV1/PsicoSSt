# PsicoSST

> Plataforma web para la administración, calificación e interpretación automatizada de la **Batería de instrumentos para la evaluación de factores de riesgo psicosocial** (Resolución 2646 de 2008, Colombia).

---

## 🎯 ¿Qué es PsicoSST?

PsicoSST automatiza el proceso de evaluación de riesgo psicosocial para especialistas en Seguridad y Salud en el Trabajo (SST) en Colombia. El sistema permite:

- **Digitación de respuestas** — Ingreso manual o importación masiva (Excel/CSV) de cuestionarios diligenciados en papel
- **Calificación automática** — Motor de puntuación que aplica algoritmos exactos del manual oficial de la batería
- **Interpretación** — Narrativas automáticas por dimensión y nivel de riesgo
- **Generación de informes** — PDF profesional + dashboard interactivo para revisión
- **Firma digital** — Certificación del informe por el psicólogo responsable
- **Trazabilidad** — Log de auditoría completo para inspección regulatoria

## 📋 Instrumentos Soportados

| Instrumento | Ítems | Población objetivo |
|---|---|---|
| **Cuestionario Intralaboral Forma A** | 123 | Profesionales, jefaturas, técnicos |
| **Cuestionario Intralaboral Forma B** | 97 | Auxiliares, operativos |
| **Cuestionario Extralaboral** | 31 | Todos los trabajadores |
| **Cuestionario de Estrés** | 31 | Todos los trabajadores |

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS |
| Backend / API | Next.js API Routes (App Router) |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7.x |
| Contenedores | Docker + Docker Compose |
| Generación PDF | `@react-pdf/renderer` (planificado) |
| Importación masiva | SheetJS (`xlsx`) (planificado) |

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL) o PostgreSQL 16 instalado localmente
- npm

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd PsicoSST/app

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Iniciar base de datos con Docker
docker compose up -d db

# 5. Ejecutar migraciones de base de datos
npx prisma migrate dev --name init

# 6. Generar cliente Prisma
npx prisma generate

# 7. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Sin Docker

Si prefieres PostgreSQL local, actualiza `DATABASE_URL` en `.env`:

```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/psicosst?schema=public"
```

## 📁 Estructura del Proyecto

```
app/
├── docs/                          # Documentación técnica
│   ├── ARCHITECTURE.md            # Arquitectura del sistema
│   ├── DATABASE.md                # Modelo de datos y esquema
│   ├── API.md                     # Especificación de endpoints
│   ├── COMPLIANCE.md              # Cumplimiento regulatorio
│   └── ROADMAP.md                 # Hoja de ruta de implementación
├── prisma/
│   └── schema.prisma              # Esquema de base de datos (10 modelos)
├── src/
│   ├── app/                       # Páginas y rutas (Next.js App Router)
│   ├── config/battery/            # Configuración de la batería (JSON)
│   ├── generated/prisma/          # Cliente Prisma (auto-generado)
│   ├── lib/
│   │   ├── prisma.ts              # Singleton del cliente Prisma
│   │   └── scoring/               # Motor de calificación
│   └── types/
│       └── battery.ts             # Tipos TypeScript de la batería
├── docker-compose.yml             # PostgreSQL + App
├── Dockerfile                     # Build multi-etapa para producción
├── .env.example                   # Plantilla de variables de entorno
└── package.json
```

## 📖 Documentación

| Documento | Descripción |
|---|---|
| [Arquitectura](docs/ARCHITECTURE.md) | Arquitectura del sistema, flujo de datos, seguridad |
| [Base de datos](docs/DATABASE.md) | Modelo de datos, dimensiones, esquema JSONB |
| [API](docs/API.md) | Endpoints REST, request/response, autenticación |
| [Cumplimiento](docs/COMPLIANCE.md) | Marco regulatorio colombiano, protección de datos |
| [Hoja de ruta](docs/ROADMAP.md) | Fases de implementación, estimaciones, testing |

## ⚖️ Marco Legal

Este sistema cumple con:
- **Resolución 2646 de 2008** — Evaluación de factores de riesgo psicosocial
- **Resolución 2764 de 2022** — Actualización de la batería
- **Ley 1090 de 2006** — Ejercicio de la psicología y custodia de datos
- **Ley 1581 de 2012** — Protección de datos personales (Habeas Data)

> ⚠️ **Solo profesionales calificados**: El acceso al sistema está restringido a psicólogos con posgrado en SST y licencia vigente. El sistema automatiza la calificación pero **no reemplaza** el juicio profesional del psicólogo.

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
