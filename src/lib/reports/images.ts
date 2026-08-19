/**
 * Carga de las imágenes de marca que se incrustan en los informes: el logo del
 * consultorio y la firma del profesional. Es el único punto del servidor que
 * resuelve estas referencias, así que la guarda contra SSRF vive aquí.
 */

const MAX_IMAGE_BYTES = 3_000_000;

/**
 * Accepted image types, mapped to the file extension the asset is exposed under.
 * Typst picks the decoder from the extension, not from the bytes, so a JPEG
 * written as "logo.png" fails the whole render — the extension has to match.
 */
const IMAGE_MIME_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
};

/**
 * Remote hosts this server may fetch report imagery from.
 *
 * Empty by default, and that is deliberate. `logoUrl` is a free-text field the
 * psychologist edits in the branding form and it is stored unvalidated, so
 * fetching it server-side lets any registered user aim this server at internal
 * addresses. That is a server-side request forgery: the caller learns whether
 * the target responded (the PDF either embeds the bytes, or the render fails)
 * and so gets a reachability oracle for the private network. Everywhere else in
 * the app these URLs are handed to react-pdf's <Image src>, which resolves them
 * in the browser, so the server has no standing need to reach arbitrary hosts.
 *
 * Set REPORT_IMAGE_ALLOWED_HOSTS (comma-separated hostnames) only for hosts you
 * control, such as your own blob CDN.
 */
const ALLOWED_IMAGE_HOSTS = new Set(
    (process.env.REPORT_IMAGE_ALLOWED_HOSTS ?? "")
        .split(",")
        .map(h => h.trim().toLowerCase())
        .filter(Boolean)
);

/** An image accepted for embedding, with the extension Typst must see. */
export interface ReportImage {
    data: Buffer;
    ext: string;
}

function checkedImage(buf: Buffer, mime: string): ReportImage | null {
    const ext = IMAGE_MIME_EXT[mime.trim().toLowerCase()];
    if (!ext) return null;
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null;
    return { data: buf, ext };
}

/**
 * Resolves an image reference, or null if it is missing, malformed, oversized,
 * not an accepted image type, or points somewhere we refuse to fetch from.
 * Never throws: report generation must not fail over branding imagery.
 */
export async function loadImage(ref: string | null | undefined): Promise<ReportImage | null> {
    if (!ref) return null;

    try {
        if (ref.startsWith("data:")) {
            const match = /^data:([^;,]+)(;[^,]*)?,([\s\S]*)$/.exec(ref);
            if (!match) return null;
            const [, mime, , payload] = match;
            return checkedImage(Buffer.from(payload, "base64"), mime);
        }

        // Anything that is not a data URI must clear the host allowlist.
        const url = new URL(ref);
        if (url.protocol !== "https:") return null;
        if (!ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;

        // redirect:"error" stops an allowlisted host from bouncing us onto an
        // internal address.
        const res = await fetch(url, {
            redirect: "error",
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;

        const mime = (res.headers.get("content-type") ?? "").split(";")[0];
        return checkedImage(Buffer.from(await res.arrayBuffer()), mime);
    } catch {
        return null;
    }
}
