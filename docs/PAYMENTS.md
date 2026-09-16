# Pagos — Mercado Pago

> Integración de cobro de paquetes de créditos con Mercado Pago Colombia (`MCO`, moneda `COP`), mediante **Checkout Bricks**.

---

## 1. Por qué Bricks y no Checkout API

Los campos de tarjeta los renderiza Mercado Pago dentro de un *iframe* propio, incrustado en la página de PsicoSST. El número de tarjeta y el CVV viajan del navegador directamente a Mercado Pago y vuelven convertidos en un **token**.

Consecuencia práctica: **PsicoSST nunca ve un número de tarjeta**, ni en el navegador ni en el servidor. Eso mantiene la plataforma en el nivel de cumplimiento PCI-DSS más liviano (SAQ A), el mismo de Checkout Pro, pero conservando la identidad visual de la aplicación.

Checkout API (formulario propio con tokenización manual) se descartó a propósito: pondría a PsicoSST dentro del alcance PCI-DSS SAQ A-EP, con autoevaluación anual y escaneos trimestrales de vulnerabilidades.

## 2. La regla que sostiene la integración

Hay **tres caminos** por los que el sistema se entera de que un pago cambió de estado, y llegan en cualquier orden:

| Camino | Cuándo |
|---|---|
| Respuesta síncrona de `POST /v1/payments` | Tarjeta, ~2 s |
| Webhook de Mercado Pago | Puede llegar **antes** que la respuesta síncrona |
| El usuario abre la pantalla del checkout | PSE, Nequi, Efecty |

Ninguno acredita por su cuenta. Los tres —más el barrido programado— desembocan en `PaymentService.reconcile`, que es idempotente por construcción:

```
  /process ─────────┐
  /webhook ─────────┤
  GET /orders/[ref] ├──▶ applyPayment(pago)  ──▶ créditos (0 ó 1 vez)
  cron diario ──────┘     1. GET /v1/payments/{id}   ← la verdad
                          2. orden ← external_reference
                          3. validar monto y moneda
                          4. tx: updateMany(creditTransactionId = null)
                             count == 1 → acreditar · count == 0 → salir
```

### Cómo se garantiza que no se acredite dos veces

`payment_orders.credit_transaction_id` es el cerrojo. Acreditar empieza siempre por un `updateMany` que exige `creditTransactionId: null`. PostgreSQL bloquea la fila; un segundo proceso concurrente vuelve a evaluar la condición **después** del bloqueo, ve el cerrojo puesto, afecta 0 filas y se retira. Sin locks manuales, sin Redis, sin colas.

Verificado con seis webhooks simultáneos en `payment-service.integration.test.ts`.

### Dos detalles que rompen las integraciones ingenuas

1. **La orden se busca por `external_reference`, no por `payment_id`.** El webhook puede llegar antes de que `/process` haya guardado el identificador del pago; buscando por nuestra propia referencia, se encuentra igual.
2. **El cuerpo del webhook nunca es fuente de verdad.** Sólo dice *qué* pago mirar. El estado se relee con `GET /v1/payments/{id}` usando el token del servidor.

## 3. Endpoints

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| `POST` | `/api/payments/checkout` | Sesión | Abre (o reutiliza) una orden. Sólo recibe `packageId`; el precio lo fija el servidor |
| `POST` | `/api/payments/process` | Sesión | Envía a Mercado Pago el formulario del Brick. Añade lo que el Brick no manda y Mercado Pago exige: IP del comprador y `callback_url` (PSE), nombre y correo del pagador desde la sesión |
| `POST` | `/api/payments/webhook` | **Público**, firma HMAC | Notificaciones de Mercado Pago |
| `GET` | `/api/payments/webhook` | Público | Verificación de URL del panel |
| `GET` | `/api/payments/orders/[ref]` | Sesión + dueño | Estado de la orden, con reconciliación perezosa |
| `GET` | `/api/payments/reconcile-stale` | `CRON_SECRET` | Barrido diario de órdenes a medias |

### Respuestas de `/process` cuando algo falla

| Código | `code` | Qué pasó | Qué hace la orden |
|---|---|---|---|
| `422` | `GATEWAY_REJECTED` | Mercado Pago rechazó la petición (4xx): datos inválidos, correo prohibido, token vencido. **No se registró ningún pago** | Vuelve a `CREATED`; el usuario corrige y reintenta sobre la misma orden con otra llave de idempotencia |
| `502` | `GATEWAY_ERROR` | 5xx o timeout de Mercado Pago. Ambiguo: el pago pudo crearse | Se queda en `PROCESSING`; la reconciliación lo resuelve (ver §4) |
| `409` | `ORDER_NOT_PAYABLE` | Otra pestaña ya está cobrando esta orden, o ya se pagó | Sin cambios |
| `409` | `ORDER_EXPIRED` | La orden venció sin intento de pago | Sin cambios; hay que crear otra |

### Códigos de estado del webhook

| Código | Situación | ¿Mercado Pago reintenta? |
|---|---|---|
| `200` | Procesado, ignorado o pago inexistente | No |
| `401` | Firma inválida o ausente | Sí |
| `503` | Falta configuración en el servidor | Sí |
| `500` | Fallo transitorio al reconciliar | Sí |

## 4. Máquina de estados

```
                 /process              MP responde
  CREATED ──────────────▶ PROCESSING ───────┬──▶ APPROVED ●  (créditos acreditados)
     ▲                       │              ├──▶ PENDING / IN_PROCESS ──webhook──▶ APPROVED ● | REJECTED ● | CANCELLED ●
     │  4xx: MP no registró  │              └──▶ REJECTED ●
     └───────── nada ────────┘
     │                       └── sin pago en MP tras 15 min ──▶ EXPIRED ● (huérfana)
     └── sin /process en 30 min ──▶ EXPIRED ●

  APPROVED ──webhook──▶ REFUNDED ● / CHARGED_BACK ●   (reversión de créditos)
```

Reglas que evitan dinero perdido:

- **`/process` sólo acepta órdenes `CREATED` y no vencidas**, en un único `updateMany` condicionado. Un doble clic, un reintento del navegador, dos pestañas abiertas o el barrido venciéndola en ese instante pierden la carrera y reciben `409` con el motivo correcto.
- **Una orden lleva como máximo un pago registrado en Mercado Pago.** Si un intento muere con 4xx, Mercado Pago no registró nada y la orden vuelve a `CREATED`; el siguiente intento lleva otra llave de idempotencia (`internalRef#attemptCount`). Si muere de forma ambigua (5xx, timeout) se queda en `PROCESSING` y la reconciliación decide: o encuentra el pago buscando por `external_reference`, o pasados 15 minutos sin rastro la declara huérfana y la vence.
- **Una orden `EXPIRED` sí puede acreditarse después.** Si el dinero llegó (un cupón de Efecty pagado al quinto día), los créditos entran: el cerrojo de acreditación sólo mira `creditTransactionId`, no el estado. El vencimiento es nuestro, no de Mercado Pago.
- **Una notificación vieja no degrada una orden que ya movió créditos.** El registro genérico de estado excluye `APPROVED`, `REFUNDED` y `CHARGED_BACK`.
- **Un `refunded` sobre una orden que nunca se acreditó** (PSE que el banco devolvió sin que llegara el `approved`) no revierte nada — no hay qué revertir — pero sí cierra la orden como `REFUNDED` para que no quede «pendiente» eternamente.

## 5. Reembolsos y contracargos

Un `refunded` o `charged_back` retira los créditos con un movimiento de tipo `REVERSAL` (monto negativo).

**El saldo puede quedar negativo, y es intencional.** Si el psicólogo ya gastó los créditos antes del contracargo, dejarlo en cero le regalaría el consumo. En negativo, `consumeCreditForAssessment` lo frena (exige saldo ≥ 1) hasta que regularice, y el libro conserva la historia completa.

No confundir `REVERSAL` con `REFUND`: este último **devuelve** un crédito al psicólogo cuando una evaluación falla por causas del sistema.

> **Pendiente legal.** La Ley 1480 de 2011 (Estatuto del Consumidor) concede cinco días hábiles de retracto en ventas a distancia. Los términos actuales dicen que los créditos no son reembolsables *una vez consumidos*, lo cual es compatible; los créditos **sin consumir** dentro de ese plazo sí serían reembolsables. Conviene revisarlo con un abogado. La arquitectura ya lo soporta.

## 6. Configuración

### Variables de entorno

Ver `.env.example`. Las tres de Mercado Pago (`MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`) más `CRON_SECRET`.

Sin ellas la aplicación funciona con normalidad y el checkout responde «pagos no disponibles» en lugar de fallar con un error 500.

> `NEXT_PUBLIC_MP_PUBLIC_KEY` se incrusta en el paquete del navegador **durante la compilación**. Pasar de pruebas a producción exige un nuevo despliegue, no basta con editar la variable en Vercel.

### Webhook en el panel de Mercado Pago

1. Panel → *Tus integraciones* → aplicación → **Webhooks**.
2. URL de producción: `https://TU-DOMINIO/api/payments/webhook`
3. Evento: **Pagos** (`payment`) únicamente.
4. Copiar la clave secreta que genera el panel a `MP_WEBHOOK_SECRET`.

El `GET` de esa misma ruta responde `200` para que la verificación de URL del panel funcione.

### Cron

`vercel.json` programa `/api/payments/reconcile-stale` una vez al día. El plan Hobby de Vercel sólo admite frecuencia diaria, y es suficiente: es una red de seguridad, no el camino principal.

## 7. Pruebas

```bash
npm test                     # unitarias — no necesitan base de datos
```

Las de integración verifican la idempotencia contra un PostgreSQL real y se omiten solas si falta `TEST_DATABASE_URL`:

```bash
createdb psicosst_test
DATABASE_URL=postgresql://…/psicosst_test npx prisma migrate deploy
TEST_DATABASE_URL=postgresql://…/psicosst_test npx vitest run
```

### Pago de prueba

Con credenciales `TEST-`, el checkout muestra un aviso de modo de pruebas.

**Sobre el correo del pagador — verificado contra el sandbox.** Con las credenciales de prueba (`TEST-…`) de la cuenta real:

- Un correo real cualquiera distinto al del vendedor → el pago se **aprueba** (tarjeta de prueba `APRO`).
- Un correo `@testuser.com` de un usuario de prueba → **rechazado** con `4390 Payer email forbidden`.
- El correo de la propia cuenta vendedora → rechazado.

Por eso en modo de pruebas el formulario **no** prellena el correo del psicólogo. `/process` traduce el `4390` a un mensaje accionable.

Tarjetas de prueba vigentes: <https://www.mercadopago.com.co/developers/es/docs/checkout-api/additional-content/test-cards>

### Qué se verificó empíricamente y qué no

| Medio | Resultado en sandbox | Notas |
|---|---|---|
| Tarjeta | ✅ Verificada de punta a punta **en la aplicación compilada**: inicio de sesión → orden → `422` por correo prohibido (la orden vuelve a `CREATED`) → reintento aprobado sobre la misma orden (`attemptCount = 2`) → 100 créditos → tres webhooks firmados con el pago real devuelven `already_settled` sin duplicar → tarjeta `OTHE` rechazada sin créditos | Pagos `1352062017` y `1352065983` en la cuenta de prueba |
| Efecty | ✅ Creada, `pending_waiting_payment`, cupón con 7 días de vigencia | La orden adopta ese vencimiento |
| PSE | ⚠️ Sin `ip_address` → `400` explícito (campo obligatorio, ya se envía). Con IP y `callback_url` el sandbox devuelve `500 / 1090` con o sin dirección y teléfono | No se pudo cerrar el ciclo en sandbox. Los campos obligatorios (IP y `callback_url`) están implementados según la documentación oficial; **hay que probarlo con dinero real de bajo monto o con credenciales de un vendedor de prueba** antes de anunciarlo |
| Nequi | ❌ `400 not_result_by_params` al crear por API | Puede aparecer en el Brick; si falla, el usuario recibe «ese medio no está disponible» y la orden vuelve a `CREATED`. Pendiente de probar con credenciales de vendedor de prueba |

## 8. Qué NO hace esta integración

- **No factura.** Mercado Pago cobra; emitir factura electrónica ante la DIAN es una obligación aparte, todavía sin resolver.
- **No ofrece reembolso autogestionado.** Los reembolsos se hacen desde el panel de Mercado Pago y el webhook aplica la reversión.
- **No usa `binary_mode`.** Activarlo simplificaría el código a costa de eliminar PSE, Nequi y Efecty, que son justo los medios que más se usan en Colombia.
- **No verifica la razón social de Mercado Pago en Colombia.** La política de privacidad lo nombra como «Mercado Pago» sin sociedad; para el registro de encargados del tratamiento (Ley 1581) conviene confirmar la razón social vigente en los términos de Mercado Pago Colombia.
