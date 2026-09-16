import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowUp } from "lucide-react";
import { isLegalIdentityComplete, legalField } from "@/lib/legal-config";

export const metadata: Metadata = {
    title: "Terminos y Condiciones - PsicoSST",
};

/**
 * Tipografía del documento legal.
 *
 * Misma escala que la Política de Privacidad, por las mismas razones: el
 * proyecto no incluye `@tailwindcss/typography`, así que las clases `prose`
 * que traía la página no pintaban nada y el articulado salía sin jerarquía
 * ni viñetas. Se declara sobre el contenedor y en tokens del sistema, sin
 * tocar el texto legal.
 */
const PROSE = [
    "max-w-[68ch] text-[15px] leading-[1.75] text-text-secondary",
    "[&_h1]:mb-3 [&_h1]:text-[27px] [&_h1]:font-semibold [&_h1]:leading-[1.16] [&_h1]:tracking-[-0.02em] [&_h1]:text-foreground sm:[&_h1]:text-[33px]",
    "[&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h2]:text-foreground sm:[&_h2]:text-[21px]",
    "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-foreground",
    "[&_p]:my-4",
    "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
    "[&_li]:pl-1.5 [&_li::marker]:text-primary",
    "[&_strong]:font-semibold [&_strong]:text-foreground",
    "[&_a]:font-medium [&_a]:text-teal-dark [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary",
].join(" ");

export default function TermsPage() {
    return (
        <div id="top" className="scroll-mt-24">
            {!isLegalIdentityComplete() && (
                <div
                    role="note"
                    className="mb-8 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 sm:p-5"
                >
                    <AlertTriangle
                        className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning"
                        aria-hidden="true"
                    />
                    <p className="text-[13.5px] leading-relaxed text-text-secondary">
                        <strong className="font-semibold text-foreground">Documento preliminar.</strong>{" "}
                        Faltan por configurar los datos del prestador del servicio; hasta entonces el
                        registro de nuevas cuentas esta deshabilitado.
                    </p>
                </div>
            )}

            <Link
                href="/"
                className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Volver al inicio
            </Link>

            <article className={PROSE}>
                <h1>Terminos y Condiciones de Uso</h1>

                <h2>1. Objeto del Servicio</h2>
                <p>
                    PsicoSST es una plataforma de software como servicio (SaaS) disenada para psicologos
                    especialistas en Seguridad y Salud en el Trabajo (SST) en Colombia. La plataforma
                    facilita la gestion, calificacion y generacion de informes a partir de los resultados
                    de la Bateria de Riesgo Psicosocial, conforme a lo establecido en la Resolucion 2764
                    de 2022 del Ministerio del Trabajo y la Resolucion 2646 de 2008. La aplicacion de los
                    instrumentos y la interpretacion clinica corresponden al profesional usuario.
                </p>

                <h2>2. Requisitos del Usuario</h2>
                <p>Para registrarse y utilizar PsicoSST, el usuario debe:</p>
                <ul>
                    <li>Ser psicologo titulado con tarjeta profesional vigente expedida por el Colegio Colombiano de Psicologos.</li>
                    <li>Contar con posgrado en Seguridad y Salud en el Trabajo o area afin.</li>
                    <li>Poseer licencia vigente en SST expedida por la Secretaria de Salud correspondiente.</li>
                    <li>Ejercer conforme a la Ley 1090 de 2006 (Codigo Deontologico del Psicologo).</li>
                </ul>

                <h2>3. Planes, Cupo y Pagos</h2>
                <p>
                    PsicoSST se contrata como una suscripcion anual del profesional. La unidad de uso es el
                    trabajador gestionado por familia de instrumento y periodo: los demas cuestionarios del
                    mismo trabajador dentro del periodo no consumen cupo adicional.
                </p>
                <ul>
                    <li>Al registrarse, cada usuario recibe un periodo de prueba (plan Residente) de 30 dias, con cupo limitado y una empresa activa. Los informes de ese plan se emiten como borradores sin valor probatorio y no pueden firmarse.</li>
                    <li>El plan Profesional se factura por anualidad e incluye un cupo de trabajadores gestionados. Renovar antes del vencimiento extiende el periodo vigente: no se pierden dias.</li>
                    <li>El cupo del plan vence al terminar su periodo. Las unidades adicionales adquiridas por separado no vencen.</li>
                    <li>Los precios estan expresados en pesos colombianos (COP) e incluyen IVA cuando aplique.</li>
                    <li>Los pagos se procesan a traves de la pasarela Mercado Pago, sujeto a sus propios terminos de servicio. Se aceptan tarjetas de credito y debito, PSE, Nequi y pago en efectivo.</li>
                    <li>El cupo se acredita al confirmarse el pago. Los medios que no son inmediatos —PSE y pago en efectivo— pueden tardar desde unos minutos hasta varios dias en reflejarse; el cupon de pago en efectivo indica su propia fecha de vencimiento.</li>
                    <li>Conforme al articulo 47 de la Ley 1480 de 2011, el usuario puede ejercer el derecho de retracto dentro de los cinco (5) dias habiles siguientes a la compra, sobre el cupo no consumido.</li>
                </ul>

                <h2>3.1 Cancelacion por el Usuario</h2>
                <p>
                    El usuario puede cancelar su suscripcion en cualquier momento. La cancelacion surte
                    efecto al terminar el periodo ya pagado; no se cobran renovaciones posteriores. Durante
                    el periodo restante conserva el acceso completo.
                </p>
                <p>
                    Tras la cancelacion, y por el tiempo que la ley exige conservar la evidencia del SG-SST
                    (Decreto 1072 de 2015, articulo 2.2.4.6.13: veinte anos desde el cese de la relacion
                    laboral), el usuario conserva acceso de solo lectura para consultar y descargar los
                    informes y la evidencia ya producida. Los detalles de conservacion se describen en la{" "}
                    <a href="/privacy">Politica de Privacidad</a>.
                </p>

                <h2>4. Responsabilidades del Usuario</h2>
                <p>El usuario se compromete a:</p>
                <ul>
                    <li>Mantener la confidencialidad de los datos de los trabajadores evaluados, conforme a la Ley 1581 de 2012.</li>
                    <li>Obtener el consentimiento informado de cada trabajador antes de la evaluacion.</li>
                    <li>Garantizar la veracidad de la informacion ingresada en la plataforma.</li>
                    <li>No compartir sus credenciales de acceso con terceros.</li>
                    <li>Utilizar la plataforma exclusivamente para fines profesionales legitimos.</li>
                    <li>Reportar cualquier vulnerabilidad de seguridad detectada.</li>
                </ul>

                <h2>5. Propiedad Intelectual</h2>
                <p>
                    La plataforma PsicoSST, incluyendo su codigo fuente, diseno, algoritmos de calificacion
                    y contenido, es propiedad de sus desarrolladores. Los instrumentos de la Bateria de Riesgo Psicosocial son propiedad del Ministerio
                    del Trabajo y la Pontificia Universidad Javeriana; PsicoSST no comercializa los
                    instrumentos, sino la gestion y calificacion de sus resultados.
                    Los datos ingresados por el usuario son propiedad del usuario y de las organizaciones
                    evaluadas.
                </p>

                <h2>6. Proteccion de Datos Personales</h2>
                <p>
                    El tratamiento de datos personales se rige por nuestra{" "}
                    <a href="/privacy">Politica de Privacidad</a> y por la Ley 1581 de 2012.
                    PsicoSST actua como encargado del tratamiento de los datos de trabajadores evaluados,
                    siendo el psicologo usuario el responsable del tratamiento.
                </p>

                <h2>7. Limitacion de Responsabilidad</h2>
                <p>
                    PsicoSST es una herramienta de apoyo profesional. La interpretacion clinica,
                    las recomendaciones de intervencion y las decisiones derivadas de los resultados
                    son responsabilidad exclusiva del psicologo usuario. PsicoSST no se hace
                    responsable por:
                </p>
                <ul>
                    <li>Decisiones laborales tomadas con base en los resultados de la bateria.</li>
                    <li>Errores en la digitacion de respuestas por parte del usuario.</li>
                    <li>Interrupciones del servicio por causas de fuerza mayor.</li>
                    <li>El contenido generado por inteligencia artificial, el cual es orientativo y debe ser validado por el profesional.</li>
                </ul>

                <h2>8. Suspension y Cancelacion</h2>
                <p>
                    En ningun caso la suspension o cancelacion de una cuenta implica la eliminacion de la
                    evidencia del SG-SST ya producida, que se conserva conforme al Decreto 1072 de 2015 y
                    permanece disponible para consulta y descarga del profesional responsable.
                </p>
                <p>
                    PsicoSST se reserva el derecho de suspender o cancelar cuentas que:
                </p>
                <ul>
                    <li>Utilicen la plataforma para fines diferentes a los establecidos.</li>
                    <li>Proporcionen credenciales profesionales falsas o vencidas.</li>
                    <li>Violen estos terminos de uso o la legislacion vigente.</li>
                </ul>

                <h2>9. Modificaciones</h2>
                <p>
                    PsicoSST puede modificar estos terminos en cualquier momento. Los cambios
                    seran notificados por correo electronico con al menos 15 dias de anticipacion.
                    El uso continuado de la plataforma despues de la notificacion constituye
                    aceptacion de los nuevos terminos.
                </p>

                <h2>10. Ley Aplicable y Jurisdiccion</h2>
                <p>
                    Estos terminos se rigen por las leyes de la Republica de Colombia. Cualquier
                    controversia sera resuelta ante los tribunales competentes de la ciudad de
                    {legalField("city")}, Colombia.
                </p>
            </article>

            <nav className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border-muted pt-6 text-[13px]">
                <Link
                    href="/privacy"
                    className="font-medium text-teal-dark underline underline-offset-2 transition-colors hover:text-primary"
                >
                    Politica de Privacidad
                </Link>
                <a
                    href="#top"
                    className="inline-flex items-center gap-1.5 font-medium text-text-muted transition-colors hover:text-foreground"
                >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    Volver arriba
                </a>
            </nav>
        </div>
    );
}
