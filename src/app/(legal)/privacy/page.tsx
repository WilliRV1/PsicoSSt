import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Politica de Privacidad - PsicoSST",
};

export default function PrivacyPage() {
    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-8 text-sm text-amber-800">
                <strong>Documento preliminar.</strong> Este texto es un borrador sujeto a revision legal.
                Ultima actualizacion: marzo 2026.
            </div>

            <h1>Politica de Privacidad y Tratamiento de Datos Personales</h1>

            <p>
                La presente politica se establece en cumplimiento de la Ley 1581 de 2012
                (Ley de Proteccion de Datos Personales), el Decreto 1377 de 2013 y demas
                normatividad concordante de la Republica de Colombia.
            </p>

            <h2>1. Responsable del Tratamiento</h2>
            <p>
                <strong>Razon social:</strong> [NOMBRE DE LA EMPRESA O PERSONA NATURAL]<br />
                <strong>NIT:</strong> [NIT]<br />
                <strong>Direccion:</strong> [DIRECCION]<br />
                <strong>Correo electronico:</strong> [EMAIL DE CONTACTO]<br />
                <strong>Ciudad:</strong> [CIUDAD], Colombia
            </p>

            <h2>2. Datos Personales Recopilados</h2>

            <h3>2.1 Datos del Psicologo (Usuario)</h3>
            <ul>
                <li>Nombre completo, correo electronico</li>
                <li>Numero de tarjeta profesional</li>
                <li>Numero de licencia SST</li>
                <li>Credencial de posgrado en SST</li>
                <li>Firma digital (dibujada o cargada)</li>
                <li>Historial de transacciones y pagos</li>
                <li>Registros de actividad en la plataforma (logs de auditoria)</li>
            </ul>

            <h3>2.2 Datos de Trabajadores Evaluados</h3>
            <p>
                Los datos de los trabajadores evaluados son de naturaleza <strong>sensible</strong>
                {" "}conforme al articulo 5 de la Ley 1581 de 2012, por referirse a la salud
                y condiciones psicosociales. Estos incluyen:
            </p>
            <ul>
                <li>Datos de identificacion: nombre, tipo y numero de documento</li>
                <li>Datos demograficos: genero, fecha de nacimiento, estado civil, nivel educativo, estrato socioeconomico</li>
                <li>Datos laborales: cargo, nivel de cargo, antiguedad, tipo de contrato, jornada</li>
                <li>Respuestas a los cuestionarios de la Bateria de Riesgo Psicosocial</li>
                <li>Resultados de calificacion y categorias de riesgo</li>
                <li>Consentimiento informado</li>
            </ul>

            <h2>3. Finalidad del Tratamiento</h2>
            <p>Los datos personales seran utilizados para:</p>
            <ul>
                <li>Administrar las cuentas de los psicologos usuarios.</li>
                <li>Verificar credenciales profesionales para la aprobacion de cuentas.</li>
                <li>Procesar la aplicacion y calificacion de la Bateria de Riesgo Psicosocial conforme a la Resolucion 2764 de 2022.</li>
                <li>Generar informes individuales y colectivos de riesgo psicosocial.</li>
                <li>Generar analisis mediante inteligencia artificial como apoyo al profesional.</li>
                <li>Procesar pagos y emitir recibos de compra.</li>
                <li>Enviar comunicaciones transaccionales (confirmaciones, alertas de seguridad).</li>
                <li>Mantener registros de auditoria conforme a la normatividad.</li>
            </ul>

            <h2>4. Autorizacion y Consentimiento</h2>
            <p>
                El psicologo usuario autoriza el tratamiento de sus datos al registrarse en
                la plataforma. Para los datos de trabajadores evaluados, el psicologo es
                responsable de obtener el consentimiento informado del titular antes de
                ingresar sus datos, conforme al articulo 9 de la Ley 1581 de 2012 y
                la Resolucion 2764 de 2022.
            </p>

            <h2>5. Derechos del Titular (Derechos ARCO)</h2>
            <p>
                Conforme al articulo 8 de la Ley 1581 de 2012, los titulares de datos
                personales tienen derecho a:
            </p>
            <ul>
                <li><strong>Acceso:</strong> Conocer los datos personales almacenados.</li>
                <li><strong>Rectificacion:</strong> Solicitar la correccion de datos inexactos o incompletos.</li>
                <li><strong>Cancelacion:</strong> Solicitar la eliminacion de datos cuando no sean necesarios para la finalidad.</li>
                <li><strong>Oposicion:</strong> Oponerse al tratamiento de sus datos en los casos previstos por la ley.</li>
                <li><strong>Revocatoria:</strong> Revocar la autorizacion otorgada para el tratamiento.</li>
            </ul>
            <p>
                Para ejercer estos derechos, el titular o el psicologo responsable puede
                comunicarse a traves del correo electronico [EMAIL DE CONTACTO].
                La solicitud sera atendida en un plazo maximo de diez (10) dias habiles,
                conforme al articulo 15 de la Ley 1581 de 2012.
            </p>

            <h2>6. Medidas de Seguridad</h2>
            <p>PsicoSST implementa las siguientes medidas para proteger los datos personales:</p>
            <ul>
                <li>Cifrado de contrasenas con algoritmo bcrypt (costo computacional 12).</li>
                <li>Sesiones con tokens JWT con expiracion de 8 horas.</li>
                <li>Bloqueo de cuenta tras intentos fallidos de autenticacion.</li>
                <li>Aislamiento de datos por psicologo (multi-tenancy).</li>
                <li>Registro de auditoria inmutable de todas las operaciones sensibles.</li>
                <li>Comunicaciones cifradas mediante HTTPS/TLS.</li>
                <li>Base de datos con acceso restringido y respaldos periodicos.</li>
            </ul>

            <h2>7. Transferencia y Transmision de Datos</h2>
            <p>
                Los datos pueden ser transmitidos a los siguientes terceros encargados
                del tratamiento, exclusivamente para las finalidades descritas:
            </p>
            <ul>
                <li><strong>Proveedor de infraestructura:</strong> Para el alojamiento de la plataforma y base de datos.</li>
                <li><strong>Wompi (Bancolombia):</strong> Para el procesamiento de pagos. Los datos financieros son manejados directamente por Wompi conforme a sus politicas de seguridad PCI-DSS.</li>
                <li><strong>Proveedor de correo electronico:</strong> Para el envio de comunicaciones transaccionales.</li>
                <li><strong>Proveedor de inteligencia artificial:</strong> Para la generacion de analisis orientativos. Los datos enviados son anonimizados cuando es posible.</li>
            </ul>

            <h2>8. Retencion de Datos</h2>
            <p>
                Los datos de evaluaciones psicosociales seran conservados por un minimo
                de veinte (20) anos, conforme a las obligaciones de conservacion de
                historias clinicas y documentos de SST establecidas en la normatividad
                colombiana. Los datos de cuenta del psicologo se conservaran mientras
                la cuenta este activa y por cinco (5) anos adicionales tras su cancelacion.
            </p>

            <h2>9. Cookies y Tecnologias de Seguimiento</h2>
            <p>
                PsicoSST utiliza cookies estrictamente necesarias para el funcionamiento
                de la plataforma (autenticacion y preferencias de sesion). No se utilizan
                cookies de terceros con fines publicitarios o de rastreo.
            </p>

            <h2>10. Modificaciones a esta Politica</h2>
            <p>
                Esta politica puede ser actualizada periodicamente. Los cambios seran
                notificados a los usuarios registrados por correo electronico.
                La fecha de la ultima actualizacion se indicara al inicio del documento.
            </p>

            <h2>11. Autoridad de Proteccion de Datos</h2>
            <p>
                En caso de considerar vulnerados sus derechos, el titular puede presentar
                queja ante la Superintendencia de Industria y Comercio (SIC), autoridad
                competente en materia de proteccion de datos personales en Colombia.
            </p>
            <p>
                <strong>Superintendencia de Industria y Comercio</strong><br />
                Carrera 13 No. 27-00, Bogota D.C.<br />
                Linea gratuita: 01 8000 910 165<br />
                www.sic.gov.co
            </p>
        </article>
    );
}
