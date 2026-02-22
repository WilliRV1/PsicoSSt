# Cumplimiento Regulatorio

> Marco legal, protección de datos y requisitos de compliance para PsicoSST en el contexto colombiano.

---

## 1. Marco Normativo Aplicable

| Norma | Aspecto que regula | Implicación en PsicoSST |
|---|---|---|
| **Resolución 2646 de 2008** | Evaluación de factores de riesgo psicosocial | Obligatoriedad de la batería; metodología oficial |
| **Resolución 2764 de 2022** | Instrumentos de la batería y disposiciones | Actualización vigente; versión oficial de instrumentos |
| **Ley 1090 de 2006** | Ejercicio de la psicología | Solo psicólogos calificados acceden al sistema; custodia de datos profesional |
| **Ley 1581 de 2012** | Protección de datos personales (Habeas Data) | Consentimiento informado, finalidad, seguridad, confidencialidad |
| **Decreto 1377 de 2013** | Reglamentación Ley 1581 | Tratamiento de datos sensibles (salud), aviso de privacidad |
| **Resolución 1111 de 2017** | Estándares mínimos del SGSST | Documentación de evaluaciones psicosociales |
| **Decreto 1072 de 2015** | Decreto Único Reglamentario — Trabajo | Integración con el SGSST empresarial |

---

## 2. Acceso Restringido al Psicólogo

### Requisitos Legales

La Ley 1090 de 2006 y la Resolución 2646 de 2008 establecen que **solo psicólogos con las siguientes credenciales** pueden acceder, interpretar y firmar evaluaciones de riesgo psicosocial:

| Requisito | Verificación en PsicoSST |
|---|---|
| Título de psicólogo | Registrado en el perfil del profesional |
| Posgrado en SST (o acreditación equivalente) | Campo `sst_credential` — verificado por admin |
| Licencia vigente del Colegio Colombiano de Psicólogos | Campo `license_number` — verificado por admin |
| Tarjeta profesional | Campo `professional_card` — verificado por admin |

### Implementación

- **Registro con aprobación manual**: El admin verifica documentos antes de activar la cuenta
- **Sin auto-registro público**: No hay forma de crear una cuenta sin revisión
- **El sistema no reemplaza el juicio profesional**: Genera puntajes e interpretaciones; el psicólogo revisa, modifica y firma

---

## 3. Consentimiento Informado

### Requisitos (Ley 1581/2012)

Todo tratamiento de datos personales de trabajadores requiere consentimiento informado que cubra:

1. **Finalidad**: Evaluación de factores de riesgo psicosocial
2. **Tipo de datos**: Datos sensibles de salud ocupacional
3. **Responsable**: Identificación del psicólogo o IPS
4. **Derechos**: Acceso, rectificación, supresión, revocación
5. **Almacenamiento**: Dónde, cómo y por cuánto tiempo se guardan
6. **Confidencialidad**: Los resultados individuales no se comparten con el empleador

### Implementación en PsicoSST

| Aspecto | Mecanismo |
|---|---|
| Captura | Modelo `InformedConsent` con texto, fecha y método de recolección |
| Métodos soportados | Escrito, verbal (registro del psicólogo) |
| Vinculación | Cada `Assessment` exige un `InformedConsent` antes de proceder |
| Trazabilidad | Registro inmutable en `AuditLog` |
| Contenido mínimo | Template legal configurable por el psicólogo |

---

## 4. Protección de Datos Sensibles

### Clasificación de Datos

| Dato | Clasificación | Tratamiento |
|---|---|---|
| Resultados de evaluación | **Sensible** (salud) | Cifrado en reposo + tránsito, acceso solo psicólogo |
| Datos de identificación (PII) | **Personal** | Cifrado AES-256 en capa de aplicación |
| Reportes firmados | **Sensible** | Cifrado, acceso con re-autenticación |
| Contraseñas | **Secreto** | Hash bcrypt (costo 12), nunca en texto plano |
| Secretos MFA | **Secreto** | Cifrado en BD |
| Logs de auditoría | **Interno** | Append-only, sin datos sensibles en texto plano |

### Medidas Técnicas

| Medida | Implementación |
|---|---|
| Cifrado en tránsito | TLS 1.3 obligatorio, HSTS headers |
| Cifrado en reposo | AES-256 para PII, PostgreSQL TDE o cifrado de disco |
| Hashing de contraseñas | bcrypt, costo 12 |
| Enmascaramiento | PII enmascarada en respuestas de API (`****7890`) |
| Control de acceso | Solo psicólogos con sesión activa y MFA verificado |
| Respaldos cifrados | Backups diarios con GPG/AES, almacenamiento separado |
| Eliminación segura | Destrucción criptográfica de claves AES |

---

## 5. Custodia de Datos

### Responsabilidad Legal

Per la Ley 1090/2006, **el psicólogo o la IPS es legalmente responsable** de la custodia de los datos de evaluación. Esto implica:

| Requisito | Solución en PsicoSST |
|---|---|
| Control sobre los datos | Despliegue en VPS privado o on-premise |
| Sin acceso de terceros | No se usan DBaaS públicos sin contratos de tratamiento |
| Trazabilidad | Quién accedió, cuándo, qué hizo → `AuditLog` |
| Respaldos | Responsabilidad del operador del servidor |
| Eliminación | Procedimiento documentado de destrucción |

### Opciones de Despliegue

| Opción | Pros | Contras |
|---|---|---|
| **VPS privado (DigitalOcean, AWS, etc.)** | Costo bajo, escalable | Datos en servidor de tercero (requiere contrato) |
| **Servidor on-premise** | Control total, sin terceros | Costo de hardware, mantenimiento |
| **Cloud con cifrado E2E** | Escalable + seguro | Complejidad de configuración |

---

## 6. Integridad de los Instrumentos

### Requisito Legal

Los instrumentos de la batería (Resolución 2764/2022) **no pueden ser modificados**. Los algoritmos de calificación, las tablas de baremos y las categorías de riesgo deben seguir exactamente el manual oficial.

### Implementación

| Aspecto | Mecanismo |
|---|---|
| Ítems | Configuración JSON fija, no editable por usuarios |
| Algoritmos de calificación | Funciones puras documentadas, sin parámetros editables |
| Baremos | Tablas JSON extraídas del manual oficial |
| Interpretaciones | Templates predefinidos por nivel de riesgo |
| Auditoría de integridad | Hash de archivos de configuración verificable |

---

## 7. Firma Digital del Psicólogo

### Requisito

Todo informe de evaluación psicosocial debe ser elaborado y firmado por un psicólogo licenciado. El informe es **responsabilidad del profesional**, no del software.

### Implementación

| Paso | Descripción |
|---|---|
| 1. Revisión | Psicólogo revisa resultados en dashboard interactivo |
| 2. Edición | Puede agregar observaciones, ajustar recomendaciones |
| 3. Re-autenticación | Ingresa contraseña para confirmar identidad |
| 4. Firma | Hash SHA-256 del informe + timestamp + credenciales |
| 5. Sello | Informe marcado como `SIGNED`, inmutable |
| 6. Registro | `AuditLog` con acción `REPORT_SIGNED` |

---

## 8. Log de Auditoría

### Acciones Registradas

| Acción | Detalle |
|---|---|
| `USER_LOGIN` | Login exitoso con IP y user agent |
| `USER_LOGIN_FAILED` | Intento fallido con IP |
| `ASSESSMENT_CREATED` | Nueva evaluación creada |
| `RESPONSES_SUBMITTED` | Respuestas ingresadas/actualizadas |
| `ASSESSMENT_SCORED` | Motor de calificación ejecutado |
| `REPORT_GENERATED` | Informe generado |
| `REPORT_SIGNED` | Informe firmado digitalmente |
| `REPORT_EXPORTED` | PDF exportado/descargado |
| `DATA_EXPORTED` | Datos exportados |
| `WORKER_CREATED` | Trabajador registrado |
| `IMPORT_STARTED` | Importación masiva iniciada |
| `IMPORT_COMPLETED` | Importación masiva completada |
| `SETTINGS_CHANGED` | Configuración del sistema modificada |

### Características

- **Append-only**: No se permiten UPDATE ni DELETE en la tabla `audit_logs`
- **Inmutable**: Campos con timestamp, IP, user agent, recurso afectado
- **Consultable**: Filtros por usuario, acción, rango de fechas, recurso
- **Exportable**: Para inspecciones regulatorias
