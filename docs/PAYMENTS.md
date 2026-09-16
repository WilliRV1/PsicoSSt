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
| `POST` | `/api/payments/process` | Sesión | Envía a Mercado Pago el formulario del Brick |
| `POST` | `/api/payments/webhook` | **Público**, firma HMAC | Notificaciones de Mercado Pago |
| `GET` | `/api/payments/webhook` | Público | Verificación de URL del panel |
| `GET` | `/api/payments/orders/[ref]` | Sesión + dueño | Estado de la orden, con reconciliación perezosa |
| `GET` | `/api/payments/reconcile-stale` | `CRON_SECRET` | Barrido diario de órdenes a medias |

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
     │                                      ├──▶ PENDING / IN_PROCESS ──webhook──▶ APPROVED ● | REJECTED ● | CANCELLED ●
     │                                      └──▶ REJECTED ●
     └── sin /process en 30 min ──▶ EXPIRED ●

  APPROVED ──webhook──▶ REFUNDED ● / CHARGED_BACK ●   (reversión de créditos)
```

Dos reglas que evitan dinero perdido:

- **`/process` sólo acepta órdenes en `CREATED`.** Un doble clic, un reintento del navegador o dos pestañas abiertas pierden la carrera y reciben `409`.
- **Un pago rechazado no se reintenta sobre la misma orden**: se crea otra. Así cada `PaymentOrder` equivale a un único intento y su `internalRef` sirve de `X-Idempotency-Key`.

Una orden `EXPIRED` **sí puede acreditarse** más tarde: si el dinero llegó (un cupón de Efecty pagado al tercer día), los créditos entran. El vencimiento es nuestro, no de Mercado Pago.

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

> **El error más común en sandbox** es `Both payer and collector must be real or test users`. Ocurre cuando el correo del pagador coincide con el de la cuenta que recibe los pagos. En modo de pruebas el formulario **no** prellena el correo del psicólogo justamente por eso: hay que escribir uno distinto.

Tarjetas de prueba vigentes: <https://www.mercadopago.com.co/developers/es/docs/checkout-api/additional-content/test-cards>

## 8. Qué NO hace esta integración

- **No factura.** Mercado Pago cobra; emitir factura electrónica ante la DIAN es una obligación aparte, todavía sin resolver.
- **No ofrece reembolso autogestionado.** Los reembolsos se hacen desde el panel de Mercado Pago y el webhook aplica la reversión.
- **No usa `binary_mode`.** Activarlo simplificaría el código a costa de eliminar PSE, Nequi y Efecty, que son justo los medios que más se usan en Colombia.
