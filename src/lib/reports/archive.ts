import crypto from "node:crypto";
import { get, put } from "@vercel/blob";

/**
 * Archivo de los informes firmados.
 *
 * Un informe firmado es un documento profesional entregable ante la autoridad:
 * tiene que poder recuperarse exactamente igual a como se entregó. Recompilarlo
 * en la descarga lo reconstruye con los datos del día, de modo que cualquier
 * cambio posterior en la ficha del trabajador, en la marca del consultorio o en
 * la plantilla produce un documento distinto del que se firmó, y el
 * `contentHash` deja de significar nada.
 *
 * Por eso los bytes definitivos se guardan en Vercel Blob al firmar y la
 * descarga los devuelve verificando su huella.
 */

/** Error de archivado: nunca debe confundirse con un fallo de compilación. */
export class ReportArchiveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ReportArchiveError";
    }
}

/**
 * Los informes se guardan en modo privado: la URL de un blob público es
 * adivinable-por-filtración y el informe individual contiene datos de salud
 * bajo reserva profesional (Res. 2646/2008 art. 11). El SDK instalado
 * (@vercel/blob 2.x) admite `access: "private"`, así que no hace falta caer al
 * modo público.
 */
const BLOB_ACCESS = "private" as const;

export function sha256(bytes: Buffer | Uint8Array): string {
    return crypto.createHash("sha256").update(bytes).digest("hex");
}

/** Falla temprano y con un mensaje accionable en vez de un 500 opaco del SDK. */
function requireToken(): string {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new ReportArchiveError(
            "El archivo de informes firmados no está configurado: falta BLOB_READ_WRITE_TOKEN. " +
                "Sin él no puede firmarse ningún informe, porque no habría copia del documento entregado."
        );
    }
    return token;
}

/** Comprueba la configuración sin subir nada, para abortar antes de escribir en la base. */
export function assertArchiveConfigured(): void {
    requireToken();
}

export interface ArchivedPdf {
    url: string;
    size: number;
    hash: string;
}

/**
 * Sube los bytes definitivos del informe y devuelve su URL y su huella.
 *
 * El sufijo aleatorio evita que una re-firma tras revocación sobrescriba el
 * documento anterior: el original sigue existiendo aunque ya no se sirva.
 */
export async function archiveSignedPdf(
    assessmentId: string,
    pdf: Buffer
): Promise<ArchivedPdf> {
    const token = requireToken();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
        const blob = await put(`reports/${assessmentId}/${stamp}.pdf`, pdf, {
            access: BLOB_ACCESS,
            addRandomSuffix: true,
            contentType: "application/pdf",
            token,
        });
        return { url: blob.url, size: pdf.byteLength, hash: sha256(pdf) };
    } catch (error) {
        throw new ReportArchiveError(
            `No se pudo archivar el informe firmado: ${(error as Error).message}`
        );
    }
}

/** Recupera los bytes archivados. Devuelve null si el blob ya no existe. */
export async function fetchArchivedPdf(url: string): Promise<Buffer | null> {
    const token = requireToken();

    let result;
    try {
        result = await get(url, { access: BLOB_ACCESS, token });
    } catch (error) {
        throw new ReportArchiveError(
            `No se pudo leer el informe archivado: ${(error as Error).message}`
        );
    }

    if (!result || result.statusCode !== 200) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
}
