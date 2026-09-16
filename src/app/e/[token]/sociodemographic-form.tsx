"use client";

import { useState } from "react";
import { toast } from "sonner";
import colombiaData from "@/config/colombia.json";
import { getErrorMessage } from "@/lib/utils";

interface SociodemographicFormProps {
    token: string;
    onDone: () => void;
}

const EMPTY_FORM = {
    gender: "",
    birthDate: "",
    maritalStatus: "",
    educationLevel: "",
    profession: "",
    residenceDepartment: "",
    residenceCity: "",
    socioeconomicStratum: "",
    housingType: "",
    dependentsCount: "",
    workDepartment: "",
    workCity: "",
    lessThanOneYearInCompany: false,
    yearsInCompany: "",
    contractType: "",
    hoursPerDay: "",
    paymentModality: "",
    transportMeans: "",
    displacementTime: "",
};

// `text-base` (16px) y no `text-sm`: por debajo de 16px Safari en iOS hace
// zoom automático al enfocar el campo y el formulario queda desplazado a la
// derecha. La altura sube a 52px para que el objetivo táctil sea cómodo.
const SELECT_CLASS =
    "flex h-13 w-full rounded-xl border border-input bg-muted/50 px-4 text-base font-medium outline-none focus:ring-2 focus:ring-ring";
const INPUT_CLASS =
    "w-full h-13 rounded-xl border border-input bg-muted/50 px-4 text-base font-medium outline-none focus:ring-2 focus:ring-ring";

/** La etiqueta es la pregunta que lee el trabajador: caja alta a 12px con
 *  tracking ancho es lo que peor se lee a un brazo de distancia. */
const LABEL_CLASS = "block text-[15px] font-semibold text-foreground mb-2";

/**
 * Opción en fila completa: el objetivo del dedo es toda la fila, no el
 * círculo de 16px del radio nativo — que se conserva por accesibilidad y
 * porque un `<label>` que lo envuelve ya lo activa al tocar cualquier punto.
 */
function RadioRow({
    name,
    label,
    checked,
    onSelect,
}: {
    name: string;
    label: string;
    checked: boolean;
    onSelect: () => void;
}) {
    return (
        <label
            className={`flex items-center gap-3 min-h-[52px] px-4 py-2.5 rounded-xl border cursor-pointer transition-colors touch-manipulation select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                checked ? "border-primary bg-teal-light" : "border-border bg-muted/40 active:bg-muted"
            }`}
        >
            <input type="radio" name={name} checked={checked} onChange={onSelect} className="h-5 w-5 shrink-0 accent-primary" />
            <span className={`text-base leading-snug ${checked ? "font-semibold text-teal-dark" : "text-foreground"}`}>
                {label}
            </span>
        </label>
    );
}

/** Variante compacta para listas de opciones muy cortas (estrato), donde
 *  ocho filas completas serían una pantalla entera de scroll. */
function RadioChip({
    name,
    label,
    checked,
    onSelect,
}: {
    name: string;
    label: string;
    checked: boolean;
    onSelect: () => void;
}) {
    return (
        <label
            className={`flex items-center justify-center min-h-[48px] px-2 rounded-xl border text-[15px] font-semibold cursor-pointer transition-colors touch-manipulation select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                checked ? "border-primary bg-teal-light text-teal-dark" : "border-border bg-muted/40 text-foreground active:bg-muted"
            }`}
        >
            <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
            {label}
        </label>
    );
}

/**
 * Sociodemográficos que hoy diligencia el psicólogo manualmente al crear el
 * trabajador (ver WorkerFormFields.tsx) — versión reducida para que el
 * propio trabajador los llene una sola vez en el flujo de autoservicio,
 * justo después de firmar el consentimiento. Se copia en vez de compartirse
 * con WorkerFormFields por el mismo motivo que public-questionnaire-form.tsx:
 * no arriesgar el formulario del dashboard, que ya funciona.
 */
export default function SociodemographicForm({ token, onDone }: SociodemographicFormProps) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const deptObj = colombiaData.find((d) => d.departamento === form.residenceDepartment);
    const workDeptObj = colombiaData.find((d) => d.departamento === form.workDepartment);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/public/invitations/${token}/sociodemographics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar tus datos");
            onDone();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-svh flex items-center justify-center px-4 py-8">
            <div className="max-w-lg w-full bg-card border border-border rounded-2xl shadow-sm p-5 sm:p-6 space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-foreground leading-snug">Antes de empezar, cuéntanos de ti</h1>
                    <p className="text-[15px] leading-relaxed text-muted-foreground mt-1.5">
                        Esta información es necesaria para calificar correctamente tu evaluación. Tus respuestas son
                        confidenciales.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className={LABEL_CLASS}>Sexo</label>
                        <div className="flex flex-col gap-2">
                            {[
                                { v: "M", l: "Masculino" },
                                { v: "F", l: "Femenino" },
                                { v: "NO_BINARIO", l: "No binario" },
                            ].map((o) => (
                                <RadioRow
                                    key={o.v}
                                    name="gender"
                                    label={o.l}
                                    checked={form.gender === o.v}
                                    onSelect={() => setForm((f) => ({ ...f, gender: o.v }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Fecha de nacimiento</label>
                        <input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} className={INPUT_CLASS} />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Estado civil</label>
                        <select value={form.maritalStatus} onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Soltero(a)">Soltero(a)</option>
                            <option value="Casado(a)">Casado(a)</option>
                            <option value="Union_libre">Unión libre</option>
                            <option value="Separado(a)_Divorciado(a)">Separado(a) / Divorciado(a)</option>
                            <option value="Viudo(a)">Viudo(a)</option>
                        </select>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Último nivel de estudios</label>
                        <select value={form.educationLevel} onChange={(e) => setForm((f) => ({ ...f, educationLevel: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Ninguno">Ninguno</option>
                            <option value="Primaria_incompleta">Primaria incompleta</option>
                            <option value="Primaria_completa">Primaria completa</option>
                            <option value="Bachillerato_incompleto">Bachillerato incompleto</option>
                            <option value="Bachillerato_completo">Bachillerato completo</option>
                            <option value="Tecnico_tecnologo_incompleto">Técnico / tecnológico incompleto</option>
                            <option value="Tecnico_tecnologo_completo">Técnico / tecnológico completo</option>
                            <option value="Profesional_incompleto">Profesional incompleto</option>
                            <option value="Profesional_completo">Profesional completo</option>
                            <option value="Carrera_militar_policia">Carrera militar / policía</option>
                            <option value="Posgrado_incompleto">Posgrado incompleto</option>
                            <option value="Posgrado_completo">Posgrado completo</option>
                        </select>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Ocupación o profesión</label>
                        <input value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} className={INPUT_CLASS} />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Lugar de residencia</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select
                                value={form.residenceDepartment}
                                onChange={(e) => setForm((f) => ({ ...f, residenceDepartment: e.target.value, residenceCity: "" }))}
                                className={SELECT_CLASS}
                            >
                                <option value="">Departamento</option>
                                {colombiaData.map((d) => (
                                    <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
                                ))}
                            </select>
                            <select
                                value={form.residenceCity}
                                onChange={(e) => setForm((f) => ({ ...f, residenceCity: e.target.value }))}
                                className={SELECT_CLASS}
                                disabled={!deptObj}
                            >
                                <option value="">Ciudad</option>
                                {deptObj?.ciudades.map((c: string) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Estrato de tu vivienda</label>
                        <div className="grid grid-cols-4 gap-2">
                            {["1", "2", "3", "4", "5", "6", "Finca", "No_se"].map((opt) => (
                                <RadioChip
                                    key={opt}
                                    name="stratum"
                                    label={opt === "No_se" ? "No sé" : opt}
                                    checked={form.socioeconomicStratum === opt}
                                    onSelect={() => setForm((f) => ({ ...f, socioeconomicStratum: opt }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Tipo de vivienda</label>
                        <div className="flex flex-col gap-2">
                            {[
                                { v: "Propia", l: "Propia" },
                                { v: "Arriendo", l: "En arriendo" },
                                { v: "Familiar", l: "Familiar" },
                            ].map((o) => (
                                <RadioRow
                                    key={o.v}
                                    name="housing"
                                    label={o.l}
                                    checked={form.housingType === o.v}
                                    onSelect={() => setForm((f) => ({ ...f, housingType: o.v }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Personas que dependen económicamente de ti</label>
                        <input type="number" inputMode="numeric" value={form.dependentsCount} onChange={(e) => setForm((f) => ({ ...f, dependentsCount: e.target.value }))} className={`${INPUT_CLASS} max-w-[160px]`} />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Lugar donde trabajas</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select
                                value={form.workDepartment}
                                onChange={(e) => setForm((f) => ({ ...f, workDepartment: e.target.value, workCity: "" }))}
                                className={SELECT_CLASS}
                            >
                                <option value="">Departamento</option>
                                {colombiaData.map((d) => (
                                    <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
                                ))}
                            </select>
                            <select
                                value={form.workCity}
                                onChange={(e) => setForm((f) => ({ ...f, workCity: e.target.value }))}
                                className={SELECT_CLASS}
                                disabled={!workDeptObj}
                            >
                                <option value="">Ciudad</option>
                                {workDeptObj?.ciudades.map((c: string) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>¿Hace cuántos años trabajas en esta empresa?</label>
                        <label
                            className={`flex items-center gap-3 min-h-[52px] px-4 py-2.5 mb-2 rounded-xl border cursor-pointer transition-colors touch-manipulation select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                                form.lessThanOneYearInCompany ? "border-primary bg-teal-light" : "border-border bg-muted/40 active:bg-muted"
                            }`}
                        >
                            <input
                                type="checkbox"
                                className="h-5 w-5 shrink-0 accent-primary"
                                checked={form.lessThanOneYearInCompany}
                                onChange={(e) => setForm((f) => ({ ...f, lessThanOneYearInCompany: e.target.checked, yearsInCompany: e.target.checked ? "0" : "" }))}
                            />
                            <span className={`text-base leading-snug ${form.lessThanOneYearInCompany ? "font-semibold text-teal-dark" : "text-foreground"}`}>
                                Llevo menos de un año
                            </span>
                        </label>
                        {!form.lessThanOneYearInCompany && (
                            <input type="number" inputMode="numeric" value={form.yearsInCompany} onChange={(e) => setForm((f) => ({ ...f, yearsInCompany: e.target.value }))} className={`${INPUT_CLASS} max-w-[160px]`} placeholder="Años" />
                        )}
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Tipo de contrato</label>
                        <select value={form.contractType} onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))} className={SELECT_CLASS}>
                            <option value="">Seleccione...</option>
                            <option value="Temporal_menos_1_ano">Temporal de menos de 1 año</option>
                            <option value="Temporal_1_ano_o_mas">Temporal de 1 año o más</option>
                            <option value="Termino_indefinido">Término indefinido</option>
                            <option value="Cooperado">Cooperado (cooperativa)</option>
                            <option value="Prestacion_servicios">Prestación de servicios</option>
                            <option value="No_se">No sé</option>
                        </select>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Horas de trabajo al día</label>
                        <input type="number" inputMode="numeric" value={form.hoursPerDay} onChange={(e) => setForm((f) => ({ ...f, hoursPerDay: e.target.value }))} className={`${INPUT_CLASS} max-w-[160px]`} placeholder="Ej: 8" />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Tipo de salario</label>
                        <div className="flex flex-col gap-2">
                            {[
                                { v: "Fijo", l: "Fijo (diario, semanal, quincenal o mensual)" },
                                { v: "Fijo_y_variable", l: "Una parte fija y otra variable" },
                                { v: "Todo_variable", l: "Todo variable (comisión, producción)" },
                            ].map((o) => (
                                <RadioRow
                                    key={o.v}
                                    name="payment"
                                    label={o.l}
                                    checked={form.paymentModality === o.v}
                                    onSelect={() => setForm((f) => ({ ...f, paymentModality: o.v }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Medio de transporte principal</label>
                        <input value={form.transportMeans} onChange={(e) => setForm((f) => ({ ...f, transportMeans: e.target.value }))} className={INPUT_CLASS} placeholder="Ej: Bus, moto, a pie" />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Tiempo de desplazamiento al trabajo (minutos)</label>
                        <input type="number" inputMode="numeric" value={form.displacementTime} onChange={(e) => setForm((f) => ({ ...f, displacementTime: e.target.value }))} className={`${INPUT_CLASS} max-w-[160px]`} />
                    </div>
                </div>

                {/* Deliberadamente NO va pegado abajo: el formulario no valida
                    nada, así que un «Continuar» siempre visible invita a
                    enviarlo vacío desde el primer campo. Al final del recorrido
                    natural cumple su función sin ese riesgo. */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full min-h-[52px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
                >
                    {isSubmitting ? "Guardando..." : "Continuar"}
                </button>
            </div>
        </div>
    );
}
