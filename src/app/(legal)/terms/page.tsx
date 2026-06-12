import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terminos y Condiciones - PsicoSST",
};

export default function TermsPage() {
    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-8 text-sm text-amber-800">
                <strong>Documento preliminar.</strong> Este texto es un borrador sujeto a revision legal.
                Ultima actualizacion: marzo 2026.
            </div>

            <h1>Terminos y Condiciones de Uso</h1>

            <h2>1. Objeto del Servicio</h2>
            <p>
                PsicoSST es una plataforma de software como servicio (SaaS) disenada para psicologos
                especialistas en Seguridad y Salud en el Trabajo (SST) en Colombia. La plataforma
                facilita la aplicacion, calificacion y generacion de informes de la Bateria de Riesgo
                Psicosocial, conforme a lo establecido en la Resolucion 2764 de 2022 del Ministerio
                del Trabajo y la Resolucion 2646 de 2008.
            </p>

            <h2>2. Requisitos del Usuario</h2>
            <p>Para registrarse y utilizar PsicoSST, el usuario debe:</p>
            <ul>
                <li>Ser psicologo titulado con tarjeta profesional vigente expedida por el Colegio Colombiano de Psicologos.</li>
                <li>Contar con posgrado en Seguridad y Salud en el Trabajo o area afin.</li>
                <li>Poseer licencia vigente en SST expedida por la Secretaria de Salud correspondiente.</li>
                <li>Ejercer conforme a la Ley 1090 de 2006 (Codigo Deontologico del Psicologo).</li>
            </ul>

            <h2>3. Sistema de Creditos y Pagos</h2>
            <p>
                PsicoSST opera bajo un modelo de creditos prepagados. Cada credito permite realizar
                una (1) evaluacion completa que incluye: cuestionario intralaboral, extralaboral,
                evaluacion de estres, generacion de informe PDF y analisis con inteligencia artificial.
            </p>
            <ul>
                <li>Al registrarse, cada usuario recibe 5 creditos de prueba gratuitos.</li>
                <li>Los creditos adquiridos no tienen fecha de vencimiento.</li>
                <li>Los creditos no son reembolsables una vez consumidos.</li>
                <li>Los precios estan expresados en pesos colombianos (COP) e incluyen IVA cuando aplique.</li>
                <li>Los pagos se procesan a traves de la pasarela Wompi, sujeto a sus propios terminos de servicio.</li>
            </ul>

            <h2>4. Responsabilidades del Usuario</h2>
            <p>El usuario se compromete a:</p>
            <ul>
                <li>Mantener la confidencialidad de los datos de los trabajadores evaluados, conforme a la Ley 1581 de 2012.</li>
                <li>Obtener el consentimiento informado de cada trabajador antes de aplicar la bateria.</li>
                <li>Garantizar la veracidad de la informacion ingresada en la plataforma.</li>
                <li>No compartir sus credenciales de acceso con terceros.</li>
                <li>Utilizar la plataforma exclusivamente para fines profesionales legitimos.</li>
                <li>Reportar cualquier vulnerabilidad de seguridad detectada.</li>
            </ul>

            <h2>5. Propiedad Intelectual</h2>
            <p>
                La plataforma PsicoSST, incluyendo su codigo fuente, diseno, algoritmos de calificacion
                y contenido, es propiedad de sus desarrolladores. Los instrumentos de la Bateria de
                Riesgo Psicosocial son de dominio publico conforme a la normatividad colombiana.
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
                [CIUDAD], Colombia.
            </p>
        </article>
    );
}
