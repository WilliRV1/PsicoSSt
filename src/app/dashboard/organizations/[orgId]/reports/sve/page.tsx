import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import "./sve-report.css";
import { SVEPrintButton } from "./print-button";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

const RISK_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const RISK_COLORS: Record<string, string> = {
    SIN_RIESGO: "bg-sin-riesgo",
    BAJO: "bg-bajo",
    MEDIO: "bg-medio",
    ALTO: "bg-alto",
    MUY_ALTO: "bg-muy-alto",
};

export default async function SVEReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            psychologist: {
                select: { fullName: true, licenseNumber: true }
            }
        }
    });

    if (!org || (org.createdByPsychologist !== session.user.id && !session.user.isAdmin)) {
        return notFound();
    }

    const assessments = await prisma.assessment.findMany({
        where: {
            organizationId: orgId,
            status: { in: ["COMPLETED", "SCORED", "SIGNED", "REVIEWED"] }
        },
        include: {
            worker: {
                select: { departmentArea: true, jobTitle: true, gender: true }
            },
            scoredResult: true
        }
    });

    if (assessments.length === 0) {
        return (
            <div className="sve-wrapper">
                <div className="sve-container">
                    <div className="sve-body text-center py-20">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Programa SVE — Riesgo Psicosocial</h1>
                        <p className="text-slate-500 max-w-md mx-auto">No hay evaluaciones completadas para generar el SVE. Complete al menos una batería de riesgo psicosocial primero.</p>
                        <div className="mt-8">
                            <a href={`/dashboard/organizations/${orgId}`} className="text-blue-600 font-semibold hover:underline">← Volver a la organización</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Stats computation ──────────────────────────────────────────────
    const intraA = assessments.filter(a => a.questionnaireType === "INTRALABORAL" && a.formType === "A");
    const intraB = assessments.filter(a => a.questionnaireType === "INTRALABORAL" && a.formType === "B");
    const intra  = assessments.filter(a => a.questionnaireType === "INTRALABORAL");
    const extra  = assessments.filter(a => a.questionnaireType === "EXTRALABORAL");
    const stress = assessments.filter(a => a.questionnaireType === "STRESS");

    const calcDist = (list: typeof assessments) => {
        const dist: Record<string, number> = { SIN_RIESGO: 0, BAJO: 0, MEDIO: 0, ALTO: 0, MUY_ALTO: 0 };
        list.forEach(a => {
            const r = a.scoredResult?.overallRiskCategory;
            if (r && r in dist) dist[r]++;
        });
        const total = list.length || 1;
        const pct: Record<string, number> = {};
        Object.keys(dist).forEach(k => pct[k] = Math.round((dist[k] / total) * 100));
        return pct;
    };

    const intraDist  = calcDist(intra);
    const extraDist  = calcDist(extra);
    const stressDist = calcDist(stress);

    // Workers per priority group (combining intra + stress per worker)
    const workerMap: Record<string, { intra?: string; stress?: string }> = {};
    assessments.forEach(a => {
        if (!workerMap[a.workerId]) workerMap[a.workerId] = {};
        if (a.questionnaireType === "INTRALABORAL") workerMap[a.workerId].intra = a.scoredResult?.overallRiskCategory ?? undefined;
        if (a.questionnaireType === "STRESS") workerMap[a.workerId].stress = a.scoredResult?.overallRiskCategory ?? undefined;
    });

    const HIGH = new Set(["ALTO", "MUY_ALTO"]);
    const LOW  = new Set(["SIN_RIESGO", "BAJO", "MEDIO"]);

    let groupA = 0, groupB = 0, groupC = 0, groupD = 0;
    Object.values(workerMap).forEach(w => {
        const i = w.intra, s = w.stress;
        if (!i && !s) { groupA++; return; }
        const iHigh = i && HIGH.has(i);
        const sHigh = s && HIGH.has(s);
        if (!iHigh && !sHigh) groupA++;
        else if (!iHigh && sHigh) groupB++;
        else if (iHigh && !sHigh) groupC++;
        else groupD++;
    });

    const uniqueWorkers = new Set(assessments.map(a => a.workerId)).size;
    const allRisks = assessments.map(a => a.scoredResult?.overallRiskCategory).filter(Boolean) as string[];
    const criticalCount = allRisks.filter(r => HIGH.has(r)).length;
    const criticalPercent = allRisks.length > 0 ? Math.round((criticalCount / allRisks.length) * 100) : 0;

    // Areas
    const areas = [...new Set(assessments.map(a => a.worker.departmentArea).filter(Boolean))];

    // Dates
    const dates = assessments.map(a => new Date(a.assessmentDate).getTime());
    const dateStart = new Date(Math.min(...dates)).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const dateEnd   = new Date(Math.max(...dates)).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const today = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

    const needsSVE = criticalPercent > 20;

    return (
        <div className="sve-wrapper">
            <div className="sve-container">

                {/* ── PORTADA ─────────────────────────────────────── */}
                <div className="sve-cover">
                    <span className="sve-cover-brand">PsicoSST · Batería de Riesgo Psicosocial · Colombia</span>
                    <h1 className="sve-cover-title">Programa de Vigilancia Epidemiológica</h1>
                    <p className="sve-cover-subtitle">Factor de Riesgos Psicosocial</p>
                    <div className="sve-cover-badge">
                        <span className="sve-cover-badge-dot" />
                        <span className="sve-cover-badge-text">Resolución 2764 de 2022 · Ministerio del Trabajo</span>
                    </div>
                    <div className="sve-cover-info-grid">
                        <div className="sve-cover-info-item">
                            <span className="sve-cover-info-label">Empresa</span>
                            <span className="sve-cover-info-value">{org.name}</span>
                        </div>
                        <div className="sve-cover-info-item">
                            <span className="sve-cover-info-label">NIT</span>
                            <span className="sve-cover-info-value">{org.nit}</span>
                        </div>
                        <div className="sve-cover-info-item">
                            <span className="sve-cover-info-label">Psicólogo(a) Responsable</span>
                            <span className="sve-cover-info-value">{org.psychologist.fullName}</span>
                        </div>
                        <div className="sve-cover-info-item">
                            <span className="sve-cover-info-label">Licencia SST</span>
                            <span className="sve-cover-info-value">{org.psychologist.licenseNumber}</span>
                        </div>
                        <div className="sve-cover-info-item">
                            <span className="sve-cover-info-label">Período de evaluación</span>
                            <span className="sve-cover-info-value">{dateStart} — {dateEnd}</span>
                        </div>
                        <div className="sve-cover-info-item">
                            <span className="sve-cover-info-label">Fecha de elaboración</span>
                            <span className="sve-cover-info-value">{today}</span>
                        </div>
                    </div>
                </div>

                {/* ── BARRA DE ACCIONES (no se imprime) ────────────── */}
                <div className="no-print flex justify-between items-center px-8 py-4 bg-slate-50 border-b border-slate-200">
                    <a href={`/dashboard/organizations/${orgId}`} className="text-slate-600 font-semibold hover:underline text-sm">← Volver</a>
                    <SVEPrintButton />
                </div>

                <div className="sve-body">

                    {/* ── INTRODUCCIÓN ─────────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">Introducción</h2>
                        <p className="sve-text">
                            Bajo el cumplimiento de la normatividad vigente en cuanto a la documentación, aplicación y análisis de la batería de riesgo psicosocial,
                            la empresa <strong>{org.name}</strong> se suma al compromiso de cumplir y responderle a sus colaboradores en prevención y promoción
                            para su salud mental y bienestar físico.
                        </p>
                        <p className="sve-text">
                            En el ámbito psicosocial es fundamental y necesario el desarrollo de un Sistema o Programa de Vigilancia Epidemiológica para
                            el Control de los Factores de Riesgo Psicosocial y la prevención de las patologías causadas por el estrés ocupacional,
                            acorde a lo establecido en la Resolución 2764 de 2022.
                        </p>
                        <p className="sve-text">
                            Los factores psicosociales comprenden los aspectos intralaborales, extralaborales o externos a la organización y las condiciones
                            individuales o características intrínsecas del trabajador, los cuales, en una interrelación dinámica mediante percepciones y
                            experiencias, influyen en la salud y el desempeño de las personas.
                        </p>
                    </section>

                    {/* ── I. JUSTIFICACIÓN ─────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">I. Justificación</h2>
                        <p className="sve-text">
                            En la actualidad las exigencias del medio laboral relacionadas con la naturaleza cambiante del trabajo, la dinámica de los mercados,
                            la globalización y el modelo económico, el desarrollo tecnológico, los estándares de alto desempeño y las jornadas prolongadas de
                            trabajo han ocasionado que la relación hombre–trabajo se presente cada vez más compleja y con consecuencias negativas, tanto para la
                            salud del trabajador, como para la productividad de las organizaciones.
                        </p>
                        <p className="sve-text">
                            Los resultados de la Segunda Encuesta Nacional de Condiciones de Salud y Trabajo (MinTrabajo, 2013) reportaron los factores de riesgo
                            psicosocial como los más frecuentemente percibidos por los trabajadores junto con los biomecánicos. Estas razones hacen necesario la
                            identificación y el análisis de los factores de riesgo psicosocial, sus niveles de expresión y la implementación de controles en los
                            procesos como en las personas.
                        </p>
                        {needsSVE && (
                            <div className="sve-alert alert-danger">
                                <strong>Indicación obligatoria:</strong> Los resultados del diagnóstico de <strong>{org.name}</strong> muestran
                                que el <strong>{criticalPercent}%</strong> de los trabajadores se encuentra en nivel de riesgo Alto o Muy Alto.
                                Según la Resolución 2764 de 2022, cuando más del 20% de la población evaluada supera este umbral, la organización
                                tiene la obligación de implementar y mantener activo el Programa de Vigilancia Epidemiológica (PVE) de Factores
                                de Riesgo Psicosocial.
                            </div>
                        )}
                        <p className="sve-text">
                            Un Sistema de Vigilancia Epidemiológica se define como el conjunto de estrategias, técnicas y acciones orientadas a la evaluación,
                            intervención y control sistemático de las variables que intervienen en los aspectos de condiciones de trabajo y de salud relacionados
                            con los factores de riesgo psicosociales a los que están expuestos los trabajadores de <strong>{org.name}</strong>.
                            Este programa permite la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de
                            riesgo psicosocial en el trabajo y la determinación del origen de las patologías causadas por estrés ocupacional.
                        </p>
                    </section>

                    {/* ── II. MARCO LEGAL ──────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">II. Marco Legal</h2>
                        <p className="sve-text">
                            En Colombia, la siguiente normatividad regula la identificación, evaluación, prevención, intervención y monitoreo de los factores
                            de riesgo psicosocial:
                        </p>
                        <table className="sve-info-table">
                            <thead>
                                <tr>
                                    <th style={{width:"30%"}}>Norma</th>
                                    <th>Contenido relevante</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Decreto 614 de 1984</strong></td>
                                    <td>Establece la necesidad de proteger a la persona contra los riesgos psicosociales que puedan afectar la salud individual o colectiva en los lugares de trabajo.</td>
                                </tr>
                                <tr>
                                    <td><strong>Resolución 1016 de 1989</strong></td>
                                    <td>Define los programas empresariales de salud ocupacional y la planificación de actividades de medicina preventiva, higiene industrial y seguridad industrial.</td>
                                </tr>
                                <tr>
                                    <td><strong>Ley 1010 de 2006</strong></td>
                                    <td>Adopta medidas para prevenir, corregir y sancionar el acoso laboral, en protección de la salud mental de los trabajadores.</td>
                                </tr>
                                <tr>
                                    <td><strong>Resolución 2646 de 2008</strong></td>
                                    <td>Establece disposiciones y define responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de riesgo psicosocial.</td>
                                </tr>
                                <tr>
                                    <td><strong>Decreto 1477 de 2014</strong></td>
                                    <td>Expide la tabla de enfermedades laborales, incluyendo en los agentes psicosociales los trastornos mentales y del comportamiento derivados del estrés laboral.</td>
                                </tr>
                                <tr>
                                    <td><strong>Resolución 2764 de 2022</strong></td>
                                    <td>Adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial y la Guía Técnica General para su promoción, prevención e intervención. Define la periodicidad de aplicación y la obligatoriedad del SVE.</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* ── III. OBJETIVOS ───────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">III. Objetivos</h2>
                        <h3 className="sve-section-h3">3.1 Objetivo General</h3>
                        <p className="sve-text">
                            Este programa de vigilancia epidemiológica tiene como objetivo controlar las condiciones de trabajo y salud mediante la identificación,
                            evaluación, prevención, intervención y monitoreo de los factores de riesgo psicosocial. Las acciones buscan prevenir la aparición de
                            los efectos asociados al estrés ocupacional en los trabajadores de <strong>{org.name}</strong>.
                        </p>
                        <h3 className="sve-section-h3">3.2 Objetivos Específicos</h3>
                        <ul className="sve-list">
                            <li>Brindar y estandarizar criterios para la identificación y evaluación de los factores psicosociales laborales, tanto protectores como de riesgo, así como sus potenciales efectos en la salud.</li>
                            <li>Establecer los lineamientos para identificar los grupos prioritarios de intervención, con el fin de disminuir el riesgo de condiciones de salud asociadas a manifestaciones del estrés.</li>
                            <li>Definir las actividades de prevención recomendadas para fomentar en la población laboral estilos de afrontamiento adecuados para el manejo de situaciones estresantes.</li>
                            <li>Establecer mecanismos de recolección y análisis de información que permitan orientar la toma de decisiones oportunas dentro del proceso de seguimiento y control de los agentes de riesgo.</li>
                            <li>Implementar medidas de prevención y control de los Factores de Riesgo Psicosocial a través de subprogramas de intervención según los resultados obtenidos en el diagnóstico.</li>
                            <li>Definir indicadores para evaluar la gestión y el impacto que se logre en la salud individual o colectiva de los trabajadores.</li>
                        </ul>
                    </section>

                    {/* ── IV. DESCRIPCIÓN DEL AGENTE DE RIESGO ────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">IV. Descripción del Agente de Riesgo</h2>

                        <h3 className="sve-section-h3">4.1 Definición de Factores de Riesgo Psicosocial</h3>
                        <p className="sve-text">
                            El Comité Mixto OMS–OIT define los factores de riesgo psicosocial como las interacciones entre el trabajo, su medio ambiente,
                            la satisfacción en el trabajo y las condiciones de su organización, por una parte; y por la otra, las capacidades del trabajador,
                            sus necesidades, su cultura y su situación personal fuera del trabajo, todo lo cual, a través de percepciones y experiencias, puede
                            influir en la salud y en el rendimiento y la satisfacción en el trabajo.
                        </p>
                        <p className="sve-text">
                            La Resolución 2764 de 2022 adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial, la Guía Técnica
                            General para la promoción, prevención e intervención de los factores psicosociales y sus efectos en la población trabajadora.
                        </p>

                        <h3 className="sve-section-h3">4.2 Clasificación de los Factores Psicosociales</h3>
                        <p className="sve-text">
                            Comprenden los aspectos intralaborales, extralaborales o externos a la organización y las condiciones individuales o características
                            intrínsecas al trabajador, las cuales, en una interrelación dinámica mediante percepciones y experiencias, influyen en la salud y
                            desempeño de las personas.
                        </p>

                        <h3 className="sve-section-h3">4.2.1 Características del Individuo</h3>
                        <ul className="sve-list">
                            <li>Información sociodemográfica</li>
                            <li>Características de personalidad y estilos de afrontamiento</li>
                            <li>Condiciones de salud evaluadas a través de exámenes médicos ocupacionales</li>
                        </ul>

                        <h3 className="sve-section-h3">4.2.2 Condiciones Internas de Trabajo (Intralaborales)</h3>
                        <ul className="sve-list">
                            <li><strong>Condiciones de la tarea:</strong> Demandas de carga mental, velocidad, complejidad, atención, variedad y apremio de tiempo.</li>
                            <li><strong>Gestión organizacional:</strong> Liderazgo, cambio organizacional, evaluación de desempeño, inducción, bienestar, políticas de contratación y remuneración.</li>
                            <li><strong>Características del grupo social de trabajo:</strong> Clima de relaciones, cohesión y calidad de las interacciones.</li>
                            <li><strong>Interfase persona–tarea:</strong> Pertinencia del conocimiento y habilidades en relación con las demandas de la tarea.</li>
                            <li><strong>Jornada de trabajo:</strong> Duración de la jornada laboral, turnos, horas extras, pausas y descansos.</li>
                        </ul>

                        <h3 className="sve-section-h3">4.2.3 Condiciones Externas al Trabajo (Extralaborales)</h3>
                        <ul className="sve-list">
                            <li>Utilización del tiempo libre</li>
                            <li>Tiempo de desplazamiento y medios de transporte entre casa y trabajo</li>
                            <li>Pertenencia a redes de apoyo social (familia, grupos sociales, comunitario o de salud)</li>
                            <li>Características de la vivienda y acceso a servicios de salud</li>
                        </ul>

                        <h3 className="sve-section-h3">4.3 Efectos sobre la Salud y el Trabajo</h3>
                        <p className="sve-text">
                            Cuando los factores psicosociales son percibidos en riesgo pueden generar:
                        </p>
                        <ul className="sve-list">
                            <li><strong>Efectos fisiológicos:</strong> Malestares gastrointestinales, cardiovasculares y osteomusculares.</li>
                            <li><strong>Efectos psicológicos:</strong> Frustración, angustia, ansiedad, depresión y disminución de la capacidad de atención, memoria y concentración.</li>
                            <li><strong>Efectos en el trabajo:</strong> Ausentismo, accidentalidad, rotación del personal, desmotivación, deterioro del rendimiento y clima laboral negativo.</li>
                        </ul>

                        <h3 className="sve-section-h3">4.4 Instrumento de Evaluación</h3>
                        <p className="sve-text">
                            La evaluación de los factores de riesgo psicosocial se realiza con la <strong>Batería de Instrumentos para la Evaluación de Factores
                            de Riesgo Psicosocial</strong>, validada por el Ministerio de la Protección Social y la Pontificia Universidad Javeriana (2010),
                            y adoptada oficialmente mediante la Resolución 2764 de 2022. Comprende:
                        </p>
                        <ul className="sve-list">
                            <li>Cuestionario de Factores de Riesgo Psicosocial Intralaboral Forma A (cargos de jefatura, profesionales y técnicos — 123 ítems)</li>
                            <li>Cuestionario de Factores de Riesgo Psicosocial Intralaboral Forma B (cargos auxiliares y operativos — 97 ítems)</li>
                            <li>Cuestionario de Factores de Riesgo Psicosocial Extralaboral (61 ítems)</li>
                            <li>Cuestionario para la Evaluación del Estrés — Tercera versión (31 ítems)</li>
                        </ul>
                    </section>

                    {/* ── V. DESCRIPCIÓN DE LA EMPRESA ─────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">V. Descripción de la Empresa</h2>

                        <table className="sve-info-table">
                            <tbody>
                                <tr>
                                    <td style={{width:"35%"}}><strong>Razón social</strong></td>
                                    <td>{org.name}</td>
                                </tr>
                                <tr>
                                    <td><strong>NIT</strong></td>
                                    <td>{org.nit}</td>
                                </tr>
                                <tr>
                                    <td><strong>Total trabajadores evaluados</strong></td>
                                    <td>{uniqueWorkers}</td>
                                </tr>
                                <tr>
                                    <td><strong>Evaluaciones aplicadas</strong></td>
                                    <td>
                                        {assessments.length} en total — Intralaboral A: {intraA.length} · Intralaboral B: {intraB.length} · Extralaboral: {extra.length} · Estrés: {stress.length}
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Período de evaluación</strong></td>
                                    <td>{dateStart} — {dateEnd}</td>
                                </tr>
                                <tr>
                                    <td><strong>Áreas / Departamentos evaluados</strong></td>
                                    <td>{areas.length > 0 ? areas.join(", ") : "No especificado"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Psicólogo(a) responsable</strong></td>
                                    <td>{org.psychologist.fullName} — Lic. SST: {org.psychologist.licenseNumber}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* ── VI. RESULTADOS DEL DIAGNÓSTICO ───────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">VI. Resultados del Diagnóstico</h2>
                        <p className="sve-text">
                            A continuación se presentan los resultados consolidados de la aplicación de la Batería de Instrumentos para la Evaluación
                            de Factores de Riesgo Psicosocial en <strong>{org.name}</strong>, correspondientes al período evaluado.
                        </p>

                        {/* Distribution grids */}
                        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem"}}>
                            {[
                                { title: "Riesgo Intralaboral", dist: intraDist, count: intra.length },
                                { title: "Riesgo Extralaboral", dist: extraDist, count: extra.length },
                                { title: "Sintomatología de Estrés", dist: stressDist, count: stress.length },
                            ].map(({ title, dist, count }) => (
                                <div key={title} style={{background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:4, padding:"1.25rem"}}>
                                    <p style={{fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6B7280", marginBottom:"0.75rem"}}>
                                        {title} <span style={{color:"#9CA3AF"}}>N={count}</span>
                                    </p>
                                    {["SIN_RIESGO","BAJO","MEDIO","ALTO","MUY_ALTO"].map(k => (
                                        <div key={k} className="sve-bar-row">
                                            <div className="sve-bar-label">
                                                <span>{RISK_LABELS[k]}</span>
                                                <span>{dist[k] ?? 0}%</span>
                                            </div>
                                            <div className="sve-bar-outer">
                                                <div className={`sve-bar-inner ${RISK_COLORS[k]}`} style={{width:`${dist[k] ?? 0}%`}} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Priority groups */}
                        <h3 className="sve-section-h3">6.1 Correlación de Resultados — Grupos de Intervención</h3>
                        <p className="sve-text">
                            Correlacionando los resultados de la evaluación de estrés con los factores de riesgo intralaboral, los trabajadores se clasifican
                            en cuatro grupos que determinan la prioridad de intervención:
                        </p>
                        <div className="sve-groups-grid">
                            <div className="sve-group-card group-a">
                                <p className="sve-group-label">Grupo A</p>
                                <p className="sve-group-name">Sanos</p>
                                <p className="sve-group-count">{groupA}</p>
                                <p className="sve-group-desc">Riesgo intralaboral bajo/medio + Estrés bajo/medio. Retest bianual, inclusión en actividades generales de promoción.</p>
                            </div>
                            <div className="sve-group-card group-b">
                                <p className="sve-group-label">Grupo B</p>
                                <p className="sve-group-name">Vulnerables</p>
                                <p className="sve-group-count">{groupB}</p>
                                <p className="sve-group-desc">Riesgo intralaboral bajo/medio + Estrés alto/muy alto. Asesoría psicológica grupal, retest anual, capacitación en manejo de estrés.</p>
                            </div>
                            <div className="sve-group-card group-c">
                                <p className="sve-group-label">Grupo C</p>
                                <p className="sve-group-name">Adaptados</p>
                                <p className="sve-group-count">{groupC}</p>
                                <p className="sve-group-desc">Riesgo intralaboral alto/muy alto + Estrés bajo/medio. Análisis psicosocial de puesto de trabajo, retroalimentación grupal.</p>
                            </div>
                            <div className="sve-group-card group-d">
                                <p className="sve-group-label">Grupo D</p>
                                <p className="sve-group-name">Prioridad de Intervención</p>
                                <p className="sve-group-count">{groupD}</p>
                                <p className="sve-group-desc">Riesgo intralaboral alto/muy alto + Estrés alto/muy alto. Retroalimentación individual, asesoría psicológica, seguimiento y retest anual. ATENCIÓN INMEDIATA.</p>
                            </div>
                        </div>
                    </section>

                    {/* ── VII. METODOLOGÍA DEL PROGRAMA ────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">VII. Metodología del Programa</h2>

                        <h3 className="sve-section-h3">7.1 Universo de Trabajo y Alcance</h3>
                        <p className="sve-text">
                            El programa de vigilancia epidemiológica para la prevención y control de los factores de riesgo psicosocial cubre a todos los
                            trabajadores directos de <strong>{org.name}</strong>, con diferentes alcances en el abordaje de cada grupo. Las intervenciones
                            se propone implementarlas para aquellas áreas, grupos o tareas en que los factores de riesgo sean identificados y percibidos con
                            riesgo Alto y Muy Alto.
                        </p>

                        <h3 className="sve-section-h3">7.2 Enfoque del Programa</h3>
                        <p className="sve-text">
                            El propósito de la vigilancia epidemiológica de los factores de riesgo psicosocial se sitúa en el contexto de la prevención,
                            fundamentalmente la prevención primaria que se orienta por las políticas de salud y seguridad y el control en la fuente de los
                            factores de riesgo.
                        </p>

                        <h3 className="sve-section-h3">7.3 Intervención Primaria: Promoción y Prevención</h3>
                        <table className="sve-intervention-table">
                            <thead>
                                <tr>
                                    <th style={{width:"20%"}}>Nivel</th>
                                    <th style={{width:"25%"}}>Dirigido a</th>
                                    <th>Actividades</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Primaria</strong></td>
                                    <td>Toda la población de la empresa</td>
                                    <td>
                                        <ul className="sve-list" style={{margin:0}}>
                                            <li>Elaboración y difusión de material audiovisual de apoyo al control del factor de riesgo</li>
                                            <li>Campañas de sensibilización en fortalecimiento de ambientes de trabajo saludables</li>
                                            <li>Capacitaciones en control de riesgo psicosocial y manejo del estrés</li>
                                            <li>Prevención de consumo de sustancias psicoactivas</li>
                                            <li>Fortalecimiento del clima organizacional</li>
                                        </ul>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <h3 className="sve-section-h3">7.4 Intervención Secundaria y Terciaria</h3>
                        <table className="sve-intervention-table">
                            <thead>
                                <tr>
                                    <th style={{width:"20%"}}>Nivel</th>
                                    <th style={{width:"25%"}}>Dirigido a</th>
                                    <th>Actividades</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Secundaria</strong></td>
                                    <td>Grupos B y D. Trabajadores remitidos por EPS con diagnósticos asociados a riesgo psicosocial</td>
                                    <td>
                                        <ul className="sve-list" style={{margin:0}}>
                                            <li>Diagnóstico de condiciones de trabajo</li>
                                            <li>Análisis psicosocial de puesto de trabajo (APPT)</li>
                                            <li>Asesorías psicológicas individuales</li>
                                            <li>Seguimiento de recomendaciones</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Terciaria</strong></td>
                                    <td>"Casos" — trabajadores con patologías derivadas del estrés reconocidas como de origen laboral por la ARL</td>
                                    <td>
                                        <ul className="sve-list" style={{margin:0}}>
                                            <li>Estudios de puesto de trabajo para reubicación o readaptación</li>
                                            <li>Rehabilitación psicosocial</li>
                                            <li>Seguimiento y control para asegurar el tratamiento requerido</li>
                                        </ul>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <h3 className="sve-section-h3">7.5 Fases del Programa de Vigilancia Epidemiológica</h3>
                        <ol className="sve-list">
                            <li><strong>Fase de Información Preliminar:</strong> Revisión inicial de la matriz de requisitos legales a nivel psicosocial.</li>
                            <li><strong>Fase de Identificación y Evaluación:</strong> Aplicación de la Batería de Instrumentos, análisis psicosocial de puestos de trabajo y medición de condiciones de salud.</li>
                            <li><strong>Fase de Análisis de la Información:</strong> Tabulación de resultados, codificación y análisis estadístico. Clasificación en grupos de intervención A, B, C, D.</li>
                            <li><strong>Fase de Toma de Decisiones e Implementación:</strong> Implementación de acciones generales de prevención primaria y actividades específicas según grupo de intervención.</li>
                            <li><strong>Fase de Evaluación de Resultados:</strong> Evaluación del impacto de las intervenciones y ajustes necesarios. Consolidado general anual.</li>
                        </ol>
                    </section>

                    {/* ── VIII. PLAN DE INTERVENCIÓN ────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">VIII. Plan de Intervención General</h2>
                        <table className="sve-intervention-table">
                            <thead>
                                <tr>
                                    <th style={{width:"5%"}}>#</th>
                                    <th style={{width:"40%"}}>Tema / Actividad</th>
                                    <th style={{width:"30%"}}>Responsable</th>
                                    <th>Observación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["1","Selección de Personal","Talento Humano, SST, Bienestar Laboral","Revisarlo y ajustarlo."],
                                    ["2","Gestión del Desempeño","Talento Humano, SST, Bienestar Laboral","Revisión del plan de incentivos y canales comunicativos."],
                                    ["3","Incentivos","Talento Humano, SST, Bienestar Laboral","Programa y divulgación de los mismos."],
                                    ["4","Gestión por Competencias","Talento Humano, SST, Bienestar Laboral","Empoderamiento, rotación del personal, cambio de roles."],
                                    ["5","Inducción y Entrenamiento","Talento Humano, SST, Bienestar Laboral","Revisarlo y ajustarlo."],
                                    ["6","Formación, Capacitación y Bienestar Laboral","Talento Humano, SST, Bienestar Laboral","Programas interempresariales con vinculación de familias."],
                                    ["7","Gestión del Clima y la Cultura","Talento Humano, SST, Bienestar Laboral","Aplicación, evaluación, seguimiento y campañas."],
                                    ["8","Prevención del Consumo de Alcohol y SPA","Talento Humano, SST, Bienestar Laboral","Programa, política, campañas y divulgación."],
                                    ["9","Convivencia Laboral","Talento Humano, SST, Bienestar Laboral","Talleres de comunicación asertiva y resolución de conflictos."],
                                    ["10","Programa de Salud Mental","Talento Humano, SST, Bienestar Laboral","Talleres y seguimiento psicológico."],
                                    ["11","Taller de Inteligencia Emocional","Talento Humano, SST, Bienestar Laboral","Talleres."],
                                    ["12","Administración del Tiempo y Tiempo Libre","Talento Humano, SST, Bienestar Laboral","Talleres."],
                                    ["13","Calidad de Vida","Talento Humano, SST, Bienestar Laboral","Taller y programa."],
                                    ["14","Promoción de la Resiliencia","Talento Humano, SST, Bienestar Laboral","Talleres."],
                                    ["15","Escuela de Líderes","Talento Humano, SST, Bienestar Laboral","Talleres de liderazgo personal y organizacional."],
                                ].map(([num, tema, resp, obs]) => (
                                    <tr key={num}>
                                        <td style={{textAlign:"center", color:"#6B7280"}}>{num}</td>
                                        <td><strong>{tema}</strong></td>
                                        <td style={{fontSize:"0.78rem"}}>{resp}</td>
                                        <td style={{fontSize:"0.78rem", color:"#6B7280"}}>{obs}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* ── IX. INDICADORES ──────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">IX. Indicadores del Programa</h2>
                        <table className="sve-info-table">
                            <thead>
                                <tr>
                                    <th>Objetivo</th>
                                    <th>Tipo</th>
                                    <th>Indicador</th>
                                    <th>Fórmula</th>
                                    <th>Frecuencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Identificar factores de riesgo y protectores</td>
                                    <td>Ejecución</td>
                                    <td>% de encuestas aplicadas</td>
                                    <td>N. Encuestas aplicadas × 100 / N. Población definida</td>
                                    <td>Anual</td>
                                </tr>
                                <tr>
                                    <td>Evaluar y analizar factores de riesgo</td>
                                    <td>Ejecución</td>
                                    <td>% de encuestas evaluadas y analizadas</td>
                                    <td>N. Encuestas analizadas × 100 / N. Encuestas aplicadas</td>
                                    <td>Anual</td>
                                </tr>
                                <tr>
                                    <td>Realizar intervenciones en grupos priorizados</td>
                                    <td>Ejecución</td>
                                    <td>N.° de actividades de intervención para grupos B y D</td>
                                    <td>N. Actividades realizadas × 100 / N. Programadas</td>
                                    <td>Anual</td>
                                </tr>
                                <tr>
                                    <td>Fomentar estilos de afrontamiento</td>
                                    <td>Ejecución</td>
                                    <td>% de actividades desarrolladas (incluyendo asesorías y capacitación)</td>
                                    <td>Total actividades desarrolladas × 100 / Total programadas</td>
                                    <td>Anual</td>
                                </tr>
                                <tr>
                                    <td>Prevalencia de exposición al riesgo psicosocial alto</td>
                                    <td>Prevalencia</td>
                                    <td>% de ambientes con FRP alto</td>
                                    <td>N.° Ambientes con FRP alto × 100 / Total ambientes evaluados</td>
                                    <td>Anual</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* ── X. RECURSOS ──────────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">X. Recursos Necesarios</h2>
                        <h3 className="sve-section-h3">Recursos Humanos</h3>
                        <ul className="sve-list">
                            <li>Cargo responsable del SG-SST, como administrador de los esfuerzos de gestión del sistema.</li>
                            <li>Psicólogo(a) especializado(a) en Seguridad y Salud en el Trabajo, que dirige y orienta los procesos de diagnóstico e intervención del riesgo.</li>
                            <li>Soporte del área de Gestión Humana, dado que muchas de las actividades de diagnóstico, intervención y control requieren ser apalancadas desde esta gerencia.</li>
                        </ul>
                        <h3 className="sve-section-h3">Recursos Técnicos y Científicos</h3>
                        <ul className="sve-list">
                            <li>Equipos de cómputo y software para el manejo de la información del sistema (PsicoSST).</li>
                            <li>Salones y ayudas necesarias para realizar las actividades de entrenamiento y sensibilización.</li>
                            <li>Consultorio dotado para realizar las evaluaciones médicas y psicológicas requeridas.</li>
                        </ul>
                        <h3 className="sve-section-h3">Recursos Financieros</h3>
                        <p className="sve-text">
                            Dentro del presupuesto general del programa de salud ocupacional se han definido recursos específicos para el desarrollo y
                            mantenimiento del sistema de vigilancia, incluyendo los elementos descritos en el presente documento.
                        </p>
                    </section>

                    {/* ── XI. RESPONSABILIDADES ────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">XI. Responsabilidades</h2>
                        <h3 className="sve-section-h3">Gerencia, Grupo Directivo y Jefes de Área</h3>
                        <ul className="sve-list">
                            <li>Proveer los recursos necesarios para el adecuado funcionamiento del PVE.</li>
                            <li>Facilitar la obtención de información requerida para el mantenimiento del PVE.</li>
                            <li>Identificar y remitir a Gestión Humana a aquellos trabajadores con cambios de conducta o comportamiento para su valoración.</li>
                        </ul>
                        <h3 className="sve-section-h3">Responsable del SG-SST / Psicólogo(a) Especialista</h3>
                        <ul className="sve-list">
                            <li>Participar en el diseño y aplicación de alternativas de control para factores de riesgo psicosocial.</li>
                            <li>Integrar las actividades del SG-SST con el presente Programa de Vigilancia.</li>
                            <li>Asegurar canales de comunicación para la difusión de hallazgos y medidas resultantes del programa.</li>
                            <li>Asegurar la investigación y el seguimiento de los casos identificados.</li>
                        </ul>
                        <h3 className="sve-section-h3">Trabajadores</h3>
                        <ul className="sve-list">
                            <li>Informar oportunamente al área de SST sobre cambios de condiciones o conductas de trabajo que puedan generar efectos psicosociales dañinos.</li>
                            <li>Participar en las actividades y seguir las indicaciones del Programa de Vigilancia.</li>
                            <li>Incorporar en el comportamiento diario conductas de autocuidado difundidas en los programas de capacitación.</li>
                        </ul>
                    </section>

                    {/* ── XII. CONCLUSIONES ────────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">XII. Conclusiones</h2>
                        <ul className="sve-list">
                            <li>
                                Se evaluaron <strong>{uniqueWorkers} trabajadores</strong> de la empresa <strong>{org.name}</strong> mediante la Batería de
                                Instrumentos para la Evaluación de Factores de Riesgo Psicosocial, completando un total de <strong>{assessments.length} evaluaciones</strong>.
                            </li>
                            <li>
                                El <strong>{criticalPercent}%</strong> de los trabajadores evaluados se encuentra en nivel de riesgo Alto o Muy Alto en al menos
                                uno de los cuestionarios aplicados.
                            </li>
                            <li>
                                Se identificaron <strong>{groupD}</strong> trabajadores en el Grupo D (Prioridad de Intervención), quienes presentan simultáneamente
                                riesgo intralaboral alto/muy alto y estrés alto/muy alto, y requieren atención inmediata.
                            </li>
                            {needsSVE && (
                                <li>
                                    Dado que el {criticalPercent}% de la población evaluada supera el umbral del 20% en riesgo crítico, la organización tiene la
                                    obligación normativa de implementar y mantener activo el presente Programa de Vigilancia Epidemiológica.
                                </li>
                            )}
                            <li>
                                Se recomienda realizar reevaluación de los factores de riesgo psicosocial en un plazo máximo de{" "}
                                {criticalPercent > 0 ? "1 año" : "2 años"} conforme a la Resolución 2764 de 2022.
                            </li>
                        </ul>
                    </section>

                    {/* ── XIII. BIBLIOGRAFÍA ───────────────────────── */}
                    <section className="sve-section">
                        <h2 className="sve-section-title">XIII. Bibliografía</h2>
                        <ul className="sve-list" style={{fontSize:"0.8rem"}}>
                            <li>Ministerio de la Protección Social y Pontificia Universidad Javeriana. (2010). <em>Batería de instrumentos para la Evaluación de Factores de Riesgo Psicosocial.</em> Bogotá.</li>
                            <li>Ministerio de Trabajo. (2022). <em>Resolución 2764 de 2022.</em> Por la cual se adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial. Bogotá.</li>
                            <li>Ministerio de la Protección Social. (2008). <em>Resolución 2646 de 2008.</em> Bogotá.</li>
                            <li>Ministerio de Trabajo y Seguridad Social. (1996). <em>Programa de Vigilancia Epidemiológica de Factores de Riesgo Psicosocial.</em> Bogotá.</li>
                            <li>Ministerio de Trabajo. (2014). <em>Decreto 1477 de 2014.</em> Tabla de Enfermedades Laborales. Bogotá.</li>
                            <li>Comité Mixto OIT-OMS. (1992). <em>Factores psicosociales en el trabajo. Naturaleza, incidencia y prevención.</em> México: Alfa Omega.</li>
                        </ul>
                    </section>

                    {/* ── FIRMA ─────────────────────────────────────── */}
                    <div className="sve-signature">
                        <div className="sve-signature-box">
                            <div style={{height:"60px"}} />
                            <div className="sve-signature-line" />
                            <p className="sve-signature-name">{org.psychologist.fullName}</p>
                            <p className="sve-signature-detail">Psicólogo(a) Especialista en SST</p>
                            <p className="sve-signature-detail">Licencia SST: {org.psychologist.licenseNumber}</p>
                            <p className="sve-signature-detail">{today}</p>
                        </div>
                    </div>

                    {/* ── FOOTER (no-print) ─────────────────────────── */}
                    <div className="no-print mt-10 pt-6 border-t border-slate-200 flex justify-between items-center">
                        <a href={`/dashboard/organizations/${orgId}`} className="text-slate-600 font-semibold hover:underline text-sm">← Volver a la organización</a>
                        <SVEPrintButton />
                    </div>

                </div>
            </div>
        </div>
    );
}
