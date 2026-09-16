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

const SELECT_CLASS =
    "flex h-11 w-full rounded-xl border border-input bg-muted/50 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-ring";
const INPUT_CLASS =
    "w-full h-11 rounded-xl border border-input bg-muted/50 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-ring";

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
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="max-w-lg w-full bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
                <div>
                    <h1 className="text-lg font-bold text-foreground">Antes de empezar, cuéntanos de ti</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Esta información es necesaria para calificar correctamente tu evaluación. Tus respuestas son
                        confidenciales.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Sexo</label>
                        <div className="flex gap-4">
                            {[
                                { v: "M", l: "Masculino" },
                                { v: "F", l: "Femenino" },
                                { v: "NO_BINARIO", l: "No binario" },
                            ].map((o) => (
                                <label key={o.v} className="flex items-center gap-2 text-sm">
                                    <input type="radio" name="gender" checked={form.gender === o.v} onChange={() => setForm((f) => ({ ...f, gender: o.v }))} />
                                    {o.l}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fecha de nacimiento</label>
                        <input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} className={INPUT_CLASS} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Estado civil</label>
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
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Último nivel de estudios</label>
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
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Ocupación o profesión</label>
                        <input value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} className={INPUT_CLASS} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Lugar de residencia</label>
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
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Estrato de tu vivienda</label>
                        <div className="flex flex-wrap gap-3">
                            {["1", "2", "3", "4", "5", "6", "Finca", "No_se"].map((opt) => (
                                <label key={opt} className="flex items-center gap-1.5 text-sm">
                                    <input type="radio" name="stratum" checked={form.socioeconomicStratum === opt} onChange={() => setForm((f) => ({ ...f, socioeconomicStratum: opt }))} />
                                    {opt === "No_se" ? "No sé" : opt}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tipo de vivienda</label>
                        <div className="flex gap-4">
                            {[
                                { v: "Propia", l: "Propia" },
                                { v: "Arriendo", l: "En arriendo" },
                                { v: "Familiar", l: "Familiar" },
                            ].map((o) => (
                                <label key={o.v} className="flex items-center gap-1.5 text-sm">
                                    <input type="radio" name="housing" checked={form.housingType === o.v} onChange={() => setForm((f) => ({ ...f, housingType: o.v }))} />
                                    {o.l}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Personas que dependen económicamente de ti</label>
                        <input type="number" inputMode="numeric" value={form.dependentsCount} onChange={(e) => setForm((f) => ({ ...f, dependentsCount: e.target.value }))} className={`${INPUT_CLASS} max-w-[140px]`} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Lugar donde trabajas</label>
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
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">¿Hace cuántos años trabajas en esta empresa?</label>
                        <label className="flex items-center gap-2 text-sm mb-2">
                            <input
                                type="checkbox"
                                checked={form.lessThanOneYearInCompany}
                                onChange={(e) => setForm((f) => ({ ...f, lessThanOneYearInCompany: e.target.checked, yearsInCompany: e.target.checked ? "0" : "" }))}
                            />
                            Llevo menos de un año
                        </label>
                        {!form.lessThanOneYearInCompany && (
                            <input type="number" inputMode="numeric" value={form.yearsInCompany} onChange={(e) => setForm((f) => ({ ...f, yearsInCompany: e.target.value }))} className={`${INPUT_CLASS} max-w-[140px]`} placeholder="Años" />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tipo de contrato</label>
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
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Horas de trabajo al día</label>
                        <input value={form.hoursPerDay} onChange={(e) => setForm((f) => ({ ...f, hoursPerDay: e.target.value }))} className={`${INPUT_CLASS} max-w-[140px]`} placeholder="Ej: 8" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tipo de salario</label>
                        <div className="flex flex-col gap-2">
                            {[
                                { v: "Fijo", l: "Fijo (diario, semanal, quincenal o mensual)" },
                                { v: "Fijo_y_variable", l: "Una parte fija y otra variable" },
                                { v: "Todo_variable", l: "Todo variable (comisión, producción)" },
                            ].map((o) => (
                                <label key={o.v} className="flex items-center gap-2 text-sm">
                                    <input type="radio" name="payment" checked={form.paymentModality === o.v} onChange={() => setForm((f) => ({ ...f, paymentModality: o.v }))} />
                                    {o.l}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Medio de transporte principal</label>
                        <input value={form.transportMeans} onChange={(e) => setForm((f) => ({ ...f, transportMeans: e.target.value }))} className={INPUT_CLASS} placeholder="Ej: Bus, moto, a pie" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tiempo de desplazamiento al trabajo (minutos)</label>
                        <input type="number" inputMode="numeric" value={form.displacementTime} onChange={(e) => setForm((f) => ({ ...f, displacementTime: e.target.value }))} className={`${INPUT_CLASS} max-w-[140px]`} />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                >
                    {isSubmitting ? "Guardando..." : "Continuar"}
                </button>
            </div>
        </div>
    );
}
