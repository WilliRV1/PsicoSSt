# Guía de Despliegue: PsicoSST 🚀

Esta guía detalla los pasos para desplegar la plataforma **PsicoSST** (Next.js + Prisma + PostgreSQL) de forma segura y funcional para que puedas iniciar pruebas reales con un profesional en psicología.

---

## ⚠️ Paso 0: Restaurar la Seguridad (MFA y Validación de Cuenta)

Para las pruebas automatizadas (Cypress), se deshabilitaron temporalmente algunas validaciones en el archivo de inicio de sesión y autenticación. **Antes de desplegar en producción/test real, asegúrate de verificar o revertir esto**:

1. **Autenticación (MFA Bypassed)**: 
   En `src/app/lib/auth.ts` (o `src/lib/auth.ts`), las propiedades `mfaEnabled` y `mfaVerified` se forzaron temporalmente para omitir el flujo de verificación. Para habilitarlo:
   ```typescript
   // Cambiar:
   mfaEnabled: false,
   mfaVerified: true,
   
   // A:
   mfaEnabled: psychologist.mfaEnabled,
   mfaVerified: !psychologist.mfaEnabled, // O el flujo correspondiente que tu app implemente
   ```
2. **Cuentas Pendientes**: 
   Asegúrate de que el estado de la cuenta del psicólogo (`psychologist.status === "PENDING_APPROVAL"`) redirija correctamente a la pantalla `/pending-approval` en lugar de omitirse, según las políticas de la plataforma.

---

## 🛠️ Opciones de Despliegue Recomendadas

Para un proyecto Next.js con base de datos PostgreSQL, tienes tres opciones principales dependiendo de tu presupuesto y experiencia técnica:

### Opción A: PaaS (Railway / Render) — *Recomendado y más fácil con Docker*
Dado que el proyecto ya cuenta con un `Dockerfile` y un `docker-compose.yml`, esta es la opción más directa.

1. **Railway (railway.app)**:
   - Crea una cuenta y conecta tu repositorio de GitHub.
   - Crea un nuevo proyecto y añade un servicio de **PostgreSQL** integrado.
   - Añade un servicio de **Web Repo** (apuntando a la carpeta `/app` si el repo tiene subcarpetas, o define el subdirectorio en la configuración de Railway).
   - Railway detectará automáticamente el `Dockerfile` y construirá la aplicación.
   - **Costo**: Tiene capa gratuita/de inicio de bajo costo.

2. **Render (render.com)**:
   - Crea un "Web Service" conectado a tu repositorio de GitHub.
   - Crea una base de datos PostgreSQL en Render.
   - Configura las variables de entorno en la interfaz de Render.

---

### Opción B: Serverless (Vercel + Supabase o Neon) — *Mejor rendimiento y gratis*
Vercel es la plataforma nativa de los creadores de Next.js, lo que garantiza el mejor rendimiento y despliegues automáticos rápidos.

1. **Base de Datos**: Crea un proyecto gratuito en [Supabase](https://supabase.com) o [Neon](https://neon.tech) para obtener una URL de conexión de PostgreSQL.
2. **Despliegue Frontend**:
   - Conecta tu repositorio de GitHub a [Vercel](https://vercel.com).
   - Configura el **Root Directory** a `app` (la carpeta donde reside el código de la aplicación Next.js).
   - Añade todas las variables de entorno necesarias (ver sección abajo).
3. **Optimización**: Asegúrate de usar el modo pooling de base de datos (`pgBouncer` o pooling directo de Supabase/Neon) si es necesario para evitar agotar las conexiones del plan gratuito.

---

### Opción C: VPS propio con Docker (DigitalOcean / Hetzner) — *Mayor control y privacidad*
Ideal si requieres estricta soberanía de datos (importante en Colombia por la Ley 1581 de Habeas Data).

1. Contrata un servidor VPS virtual (ej. Ubuntu Server 22.04 LTS).
2. Instala Docker y Docker Compose:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose -y
   ```
3. Clona tu repositorio en el servidor.
4. Configura el archivo `.env` en la carpeta `app/`.
5. Levanta la base de datos y la app usando Docker Compose:
   ```bash
   docker compose --profile production up -d --build
   ```

---

## 🔑 Variables de Entorno Requeridas (.env)

Asegúrate de configurar las siguientes variables de entorno en tu plataforma de despliegue:

| Variable | Descripción | Ejemplo / Generación |
| --- | --- | --- |
| `DATABASE_URL` | String de conexión a la base de datos PostgreSQL. | `postgresql://user:password@host:port/dbname?sslmode=require` |
| `NEXTAUTH_SECRET` | Llave secreta para firmar las cookies de sesión. | Genera una con: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL pública de tu aplicación. | `https://psicosst.tudominio.com` |
| `NODE_ENV` | Modo de entorno del sistema. | `production` |
| `APP_NAME` | Nombre de la aplicación. | `PsicoSST` |
| `SESSION_TIMEOUT_MINUTES` | Tiempo de expiración de sesión inactiva. | `30` |

---

## ⚡ Pasos Clave en el Ciclo de Despliegue

### 1. Ejecutar las Migraciones de Base de Datos
Prisma necesita aplicar el esquema en la base de datos remota antes de compilar o iniciar el servidor. 
* En plataformas como **Railway** o **Render**, puedes definir un "Build Command" o "Release Command" que corra antes del arranque:
  ```bash
  npx prisma migrate deploy
  ```
* En **Vercel**, puedes añadirlo en la fase de construcción del `package.json` en el script `build`:
  ```json
  "build": "prisma generate && prisma migrate deploy && next build"
  ```

### 2. Sembrar los Datos Iniciales (Seeding)
La aplicación requiere ciertos datos iniciales (baremos, configuraciones, etc.) para funcionar correctamente. Ejecuta localmente apuntando a la base de datos de producción (o vía terminal SSH/consola del hosting) el script de seed:
```bash
# Asegúrate de configurar la URL de producción temporalmente en tu .env local y correr:
npx tsx prisma/seed.ts
```

---

## 🛡️ Consideraciones de Cumplimiento (Ley 1090 de 2006 y Ley 1581)

Dado que tu madre utilizará el sistema para datos reales de pacientes/trabajadores:
1. **Cifrado de Base de Datos**: Asegúrate de que la conexión (`DATABASE_URL`) use `sslmode=require` o `ssl=true`.
2. **Acceso Seguro**: Mantén el MFA (Autenticación de dos factores) habilitado para prevenir accesos no autorizados.
3. **Firma Digital**: En producción, configura la variable `SIGNING_KEY_PATH` apuntando a una llave privada segura de 2048 bits para poder sellar criptográficamente los reportes de SST.
