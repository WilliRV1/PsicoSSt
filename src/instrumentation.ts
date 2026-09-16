/**
 * Fija la zona horaria del proceso de Node a Bogotá.
 *
 * Los ~32 sitios que usan `toLocaleDateString`/`toLocaleString` sin pasar
 * `timeZone` explícito dependen de la zona horaria del proceso. En Vercel esa
 * zona es UTC por defecto, así que una fecha cerca de medianoche en Colombia
 * (UTC-5) podía mostrarse con el día equivocado. `TZ` es un nombre reservado
 * en el panel de variables de entorno de Vercel, así que se fija aquí en vez
 * de ahí — este hook corre una sola vez al arrancar el servidor, antes de
 * atender cualquier request.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        process.env.TZ = "America/Bogota";
    }
}
