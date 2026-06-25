import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import colombiaData from "@/config/colombia.json";

const FormTooltip = ({ text }: { text: string }) => (
    <Tooltip>
        <TooltipTrigger type="button" tabIndex={-1} className="ml-1 cursor-help">
            <Info className="h-4 w-4 text-gray-400 hover:text-indigo-600 transition-colors inline-block" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px]">
            <p className="text-xs font-normal leading-relaxed">{text}</p>
        </TooltipContent>
    </Tooltip>
);

const SELECT_CLASS = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export const EMPTY_WORKER_FORM = {
    documentType: "CC",
    documentId: "",
    fullName: "",
    gender: "",
    birthYear: "",
    birthDate: "",
    maritalStatus: "",
    educationLevel: "",
    profession: "",
    jobTitle: "",
    jobLevel: "",
    residenceCity: "",
    residenceDepartment: "",
    socioeconomicStratum: "",
    housingType: "",
    dependentsCount: "",
    freeTimeUsage: [],
    departmentArea: "",
    lessThanOneYearInCompany: false,
    yearsInCompany: "",
    lessThanOneYearInPosition: false,
    yearsInPosition: "",
    contractType: "",
    workSchedule: "",
    hoursPerDay: "",
    hoursPerWeek: "",
    paymentModality: "",
    workCity: "",
    workDepartment: "",
    transportMeans: "",
    displacementTime: "",
    hasCustomerInteraction: true
};

const LocationSelector = ({ form, setForm, deptKey, cityKey }: { form: any, setForm: any, deptKey: string, cityKey: string }) => {
    const selectedDept = form[deptKey] || "";
    const selectedCity = form[cityKey] || "";

    const isKnownDept = colombiaData.some(d => d.departamento === selectedDept);
    const showCustomDept = selectedDept === "OTRO" || (selectedDept !== "" && !isKnownDept);

    const deptObj = colombiaData.find(d => d.departamento === selectedDept);
    const knownCities = deptObj ? deptObj.ciudades : [];
    
    const isKnownCity = knownCities.includes(selectedCity);
    const showCustomCity = showCustomDept || selectedCity === "OTRO" || (selectedCity !== "" && !isKnownCity);

    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label className="text-xs text-gray-500">Departamento</Label>
                {showCustomDept ? (
                    <div className="flex gap-2 items-center mt-1">
                        <Input 
                            value={selectedDept === "OTRO" ? "" : selectedDept} 
                            onChange={e => setForm((f:any) => ({ ...f, [deptKey]: e.target.value }))} 
                            className="border-gray-300 bg-gray-50 h-9"
                            placeholder="Escriba el departamento" 
                            autoFocus={selectedDept === "OTRO"}
                        />
                        <button type="button" onClick={() => setForm((f:any) => ({ ...f, [deptKey]: "", [cityKey]: "" }))} className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">Lista</button>
                    </div>
                ) : (
                    <select 
                        value={selectedDept} 
                        onChange={e => setForm((f:any) => ({ ...f, [deptKey]: e.target.value, [cityKey]: "" }))} 
                        className={`${SELECT_CLASS} border-gray-300 bg-gray-50 mt-1`}
                    >
                        <option value="">Seleccione...</option>
                        {colombiaData.map(d => <option key={d.departamento} value={d.departamento}>{d.departamento}</option>)}
                        <option value="OTRO">Otro / Escribir...</option>
                    </select>
                )}
            </div>
            <div>
                <Label className="text-xs text-gray-500">Ciudad / municipio</Label>
                {showCustomCity ? (
                    <div className="flex gap-2 items-center mt-1">
                        <Input 
                            value={selectedCity === "OTRO" ? "" : selectedCity} 
                            onChange={e => setForm((f:any) => ({ ...f, [cityKey]: e.target.value }))} 
                            className="border-gray-300 bg-gray-50 h-9"
                            placeholder="Escriba la ciudad" 
                            autoFocus={selectedCity === "OTRO"}
                        />
                        {!showCustomDept && (
                            <button type="button" onClick={() => setForm((f:any) => ({ ...f, [cityKey]: "" }))} className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">Lista</button>
                        )}
                    </div>
                ) : (
                    <select 
                        value={selectedCity} 
                        onChange={e => setForm((f:any) => ({ ...f, [cityKey]: e.target.value }))} 
                        className={`${SELECT_CLASS} border-gray-300 bg-gray-50 mt-1`}
                        disabled={!selectedDept}
                    >
                        <option value="">{selectedDept ? "Seleccione..." : "Seleccione dpto"}</option>
                        {knownCities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        {selectedDept && <option value="OTRO">Otro / Escribir...</option>}
                    </select>
                )}
            </div>
        </div>
    );
};

const AutocompleteSelector = ({ form, setForm, fieldKey, options, placeholder }: { form: any, setForm: any, fieldKey: string, options: string[], placeholder: string }) => {
    const selectedValue = form[fieldKey] || "";
    const isKnown = options.includes(selectedValue);
    
    // Si no hay opciones previas creadas en la empresa, mostramos directamente el input
    const noOptionsAvailable = options.length === 0;
    
    // Show custom input if "OTRO" is selected, if current value is unknown, or if there are no options
    const showCustom = noOptionsAvailable || selectedValue === "OTRO" || (selectedValue !== "" && !isKnown);

    return (
        <div>
            {showCustom ? (
                <div className="mt-1">
                    <div className="flex gap-2 items-center">
                        <Input 
                            value={selectedValue === "OTRO" ? "" : selectedValue} 
                            onChange={e => setForm((f:any) => ({ ...f, [fieldKey]: e.target.value }))} 
                            className="border-gray-300 bg-gray-50 h-9"
                            placeholder={placeholder} 
                            autoFocus={selectedValue === "OTRO"}
                        />
                        {!noOptionsAvailable && (
                            <button type="button" onClick={() => setForm((f:any) => ({ ...f, [fieldKey]: "" }))} className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">Cancelar</button>
                        )}
                    </div>
                    {((selectedValue === "OTRO" || selectedValue !== "") && !isKnown) && (
                        <p className="text-[11px] text-gray-500 mt-1 italic">
                            Se guardará como una nueva opción para la empresa.
                        </p>
                    )}
                </div>
            ) : (
                <select 
                    value={selectedValue} 
                    onChange={e => setForm((f:any) => ({ ...f, [fieldKey]: e.target.value }))} 
                    className={`${SELECT_CLASS} border-gray-300 bg-gray-50 mt-1`}
                >
                    <option value="">Seleccione...</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value="OTRO" className="font-semibold text-indigo-600">+ Crear nuevo...</option>
                </select>
            )}
        </div>
    );
};

export const WorkerFormFields = ({ form, setForm, organizationId }: { form: any, setForm: any, organizationId?: string }) => {
    const [existingDepartments, setExistingDepartments] = useState<string[]>([]);
    const [existingJobTitles, setExistingJobTitles] = useState<string[]>([]);

    useEffect(() => {
        if (organizationId) {
            fetch(`/api/organizations/${organizationId}/departments`)
                .then(res => res.json())
                .then(data => {
                    if (data.departments) setExistingDepartments(data.departments);
                    if (data.jobTitles) setExistingJobTitles(data.jobTitles);
                })
                .catch(err => console.error("Error fetching autocomplete data:", err));
        }
    }, [organizationId]);

    return (
        <div className="space-y-8">
            <div className="bg-white text-black p-6 border rounded-lg shadow-sm">
                <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-4">
                            <span className="font-bold whitespace-nowrap">Fecha de aplicación:</span>
                            <span className="text-gray-400 italic text-sm">dd mm aaaa (Sólo lectura en creación)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold whitespace-nowrap">del respondiente (ID):</span>
                            <div className="flex gap-2">
                                <select value={form.documentType} onChange={e => setForm((f:any) => ({ ...f, documentType: e.target.value }))} className="border border-gray-300 p-1 text-sm bg-white rounded">
                                    <option value="CC">CC</option>
                                    <option value="CE">CE</option>
                                    <option value="TI">TI</option>
                                    <option value="PA">PA</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                                <Input required value={form.documentId} onChange={e => setForm((f:any) => ({ ...f, documentId: e.target.value }))} className="border-gray-300 h-8" placeholder="Número" />
                            </div>
                        </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 max-w-[200px]">
                        Libertad y Orden<br/>
                        Ministerio de la Protección Social<br/>
                        República de Colombia<br/>
                        SUBCENTRO DE SEGURIDAD SOCIAL<br/>
                        Y RIESGOS PROFESIONALES
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-2">FICHA DE DATOS GENERALES</h2>
                    <p className="text-sm text-gray-600">
                        Las siguientes son algunas preguntas que se refieren a información general de usted o su ocupación.
                        Por favor seleccione una sola respuesta para cada pregunta y márquela o escríbala en la casilla. Escriba con letra clara y legible.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* 1. Nombre completo */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            1. Nombre completo:
                            <FormTooltip text="Escriba sus nombres y apellidos completos, tal cual aparecen en su documento de identidad." />
                        </Label>
                        <Input required value={form.fullName} onChange={e => setForm((f:any) => ({ ...f, fullName: e.target.value }))} className="border-gray-300 bg-gray-50" />
                    </div>

                    {/* 2. Sexo */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            2. Sexo:
                            <FormTooltip text="Seleccione el sexo con el que se identifica actualmente." />
                        </Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" value="M" checked={form.gender === "M"} onChange={e => setForm((f:any) => ({ ...f, gender: e.target.value }))} /> Masculino
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" value="F" checked={form.gender === "F"} onChange={e => setForm((f:any) => ({ ...f, gender: e.target.value }))} /> Femenino
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="gender" value="NO_BINARIO" checked={form.gender === "NO_BINARIO"} onChange={e => setForm((f:any) => ({ ...f, gender: e.target.value }))} /> No Binario
                            </label>
                        </div>
                    </div>

                    {/* 3. Año de nacimiento */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            3. Año de nacimiento:
                            <FormTooltip text="Escriba los 4 dígitos de su año de nacimiento (ej. 1985)." />
                        </Label>
                        <Input type="number" value={form.birthYear} onChange={e => setForm((f:any) => ({ ...f, birthYear: e.target.value }))} className="border-gray-300 bg-gray-50 max-w-[150px]" />
                    </div>

                    {/* 4. Último nivel de estudios */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            4. Último nivel de estudios que alcanzó (marque una sola opción)
                            <FormTooltip text="Seleccione el nivel educativo más alto que haya culminado exitosamente. Si está estudiando actualmente, marque el nivel inmediatamente anterior completado." />
                        </Label>
                        <select required value={form.educationLevel} onChange={e => setForm((f:any) => ({ ...f, educationLevel: e.target.value }))} className={`${SELECT_CLASS} border-gray-300 bg-gray-50`}>
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

                    {/* 5. Ocupación o profesión */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            5. ¿Cuál es su ocupación o profesión?
                            <FormTooltip text="Escriba la profesión, oficio o disciplina en la que se formó o especializó (ej. Contador, Soldador, Psicólogo)." />
                        </Label>
                        <Input value={form.profession} onChange={e => setForm((f:any) => ({ ...f, profession: e.target.value }))} className="border-gray-300 bg-gray-50" />
                    </div>

                    {/* 6. Lugar de residencia */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            6. Lugar de residencia actual:
                            <FormTooltip text="La ciudad y departamento donde vive habitualmente en este momento." />
                        </Label>
                        <LocationSelector form={form} setForm={setForm} deptKey="residenceDepartment" cityKey="residenceCity" />
                    </div>

                    {/* 7. Estrato */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            7. Seleccione y marque el estrato de los servicios públicos de su vivienda
                            <FormTooltip text="Corresponde al estrato socioeconómico que aparece en el recibo de servicios públicos de su lugar de residencia habitual." />
                        </Label>
                        <div className="flex flex-wrap gap-4">
                            {["1", "2", "3", "4", "5", "6", "Finca", "No_se"].map(opt => (
                                <label key={opt} className="flex items-center gap-1">
                                    <input type="radio" name="stratum" value={opt} checked={form.socioeconomicStratum === opt} onChange={e => setForm((f:any) => ({ ...f, socioeconomicStratum: e.target.value }))} /> 
                                    {opt === "No_se" ? "No sé" : opt}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 8. Tipo de vivienda */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            8. Tipo de vivienda
                            <FormTooltip text="Familiar: vive con familiares y no paga arriendo. Propia: está a su nombre o de su cónyuge. Arriendo: paga alquiler." />
                        </Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1">
                                <input type="radio" name="housing" value="Propia" checked={form.housingType === "Propia"} onChange={e => setForm((f:any) => ({ ...f, housingType: e.target.value }))} /> Propia
                            </label>
                            <label className="flex items-center gap-1">
                                <input type="radio" name="housing" value="Arriendo" checked={form.housingType === "Arriendo"} onChange={e => setForm((f:any) => ({ ...f, housingType: e.target.value }))} /> En arriendo
                            </label>
                            <label className="flex items-center gap-1">
                                <input type="radio" name="housing" value="Familiar" checked={form.housingType === "Familiar"} onChange={e => setForm((f:any) => ({ ...f, housingType: e.target.value }))} /> Familiar
                            </label>
                        </div>
                    </div>

                    {/* 9. Dependientes */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            9. Número de personas que dependen económicamente de usted (aunque vivan en otro lugar)
                            <FormTooltip text="Incluya hijos, padres, cónyuge u otros familiares que dependan total o parcialmente de sus ingresos económicos para subsistir." />
                        </Label>
                        <Input type="number" value={form.dependentsCount} onChange={e => setForm((f:any) => ({ ...f, dependentsCount: e.target.value }))} className="border-gray-300 bg-gray-50 max-w-[150px]" />
                    </div>

                    {/* 10. Lugar de trabajo */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            10. Lugar donde trabaja actualmente:
                            <FormTooltip text="La ciudad y departamento donde se encuentra la sede principal en la que usted labora." />
                        </Label>
                        <LocationSelector form={form} setForm={setForm} deptKey="workDepartment" cityKey="workCity" />
                    </div>

                    {/* 11. Tiempo en empresa */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            11. ¿Hace cuántos años que trabaja en esta empresa?
                            <FormTooltip text="Tiempo total de antigüedad en la organización, sin importar si ha cambiado de cargo." />
                        </Label>
                        <div className="space-y-2 pl-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={form.lessThanOneYearInCompany} onChange={e => setForm((f:any) => ({ ...f, lessThanOneYearInCompany: e.target.checked, yearsInCompany: e.target.checked ? "0" : "" }))} />
                                Si lleva menos de un año marque esta opción
                            </label>
                            {!form.lessThanOneYearInCompany && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm">Si lleva más de un año, anote cuántos años:</span>
                                    <Input type="number" value={form.yearsInCompany} onChange={e => setForm((f:any) => ({ ...f, yearsInCompany: e.target.value }))} className="border-gray-300 bg-gray-50 w-[100px] h-8" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 12. Nombre del cargo */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            12. ¿Cuál es el nombre del cargo que ocupa en la empresa?
                            <FormTooltip text="El nombre oficial de su puesto de trabajo en la organización." />
                        </Label>
                        <AutocompleteSelector 
                            form={form} 
                            setForm={setForm} 
                            fieldKey="jobTitle" 
                            options={existingJobTitles} 
                            placeholder="Escriba el cargo" 
                        />
                    </div>

                    {/* 13. Tipo de cargo */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            13. Seleccione el tipo de cargo que más se parece al que usted desempeña
                            <FormTooltip text="Jefatura: si tiene personal a cargo. Profesional: si su puesto exige título técnico o profesional. Auxiliar: apoyo administrativo. Operativo: tareas manuales, de planta o servicios." />
                        </Label>
                        <select required value={form.jobLevel} onChange={e => setForm((f:any) => ({ ...f, jobLevel: e.target.value }))} className={`${SELECT_CLASS} border-gray-300 bg-gray-50`}>
                            <option value="">Seleccione...</option>
                            <option value="JEFATURA">Jefatura - tiene personal a cargo</option>
                            <option value="PROFESIONAL">Profesional, analista, técnico, tecnólogo</option>
                            <option value="AUXILIAR">Auxiliar, asistente administrativo, asistente técnico</option>
                            <option value="OPERATIVO">Operario, operador, ayudante, servicios generales</option>
                        </select>
                    </div>

                    {/* 14. Tiempo en el cargo */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            14. ¿Hace cuántos años que desempeña el cargo u oficio actual en esta empresa?
                            <FormTooltip text="Años laborando exclusivamente en su puesto actual, no el total en la empresa." />
                        </Label>
                        <div className="space-y-2 pl-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={form.lessThanOneYearInPosition} onChange={e => setForm((f:any) => ({ ...f, lessThanOneYearInPosition: e.target.checked, yearsInPosition: e.target.checked ? "0" : "" }))} />
                                Si lleva menos de un año marque esta opción
                            </label>
                            {!form.lessThanOneYearInPosition && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm">Si lleva más de un año, anote cuántos años:</span>
                                    <Input type="number" value={form.yearsInPosition} onChange={e => setForm((f:any) => ({ ...f, yearsInPosition: e.target.value }))} className="border-gray-300 bg-gray-50 w-[100px] h-8" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 15. Departamento/área */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            15. Escriba el nombre del departamento, área o sección de la empresa en el que trabaja
                            <FormTooltip text="El área, gerencia, departamento o proceso al cual pertenece su cargo." />
                        </Label>
                        <AutocompleteSelector 
                            form={form} 
                            setForm={setForm} 
                            fieldKey="departmentArea" 
                            options={existingDepartments} 
                            placeholder="Escriba el departamento o área" 
                        />
                    </div>

                    {/* 16. Tipo de contrato */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            16. Seleccione el tipo de contrato que tiene actualmente (marque una sola opción)
                            <FormTooltip text="El tipo de vinculación formal que tiene con la organización en este momento." />
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="flex items-center gap-2"><input type="radio" name="contract" value="Temporal_menos_1_ano" checked={form.contractType === "Temporal_menos_1_ano"} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} /> Temporal de menos de 1 año</label>
                            <label className="flex items-center gap-2"><input type="radio" name="contract" value="Temporal_1_ano_o_mas" checked={form.contractType === "Temporal_1_ano_o_mas"} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} /> Temporal de 1 año o más</label>
                            <label className="flex items-center gap-2"><input type="radio" name="contract" value="Termino_indefinido" checked={form.contractType === "Termino_indefinido"} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} /> Término indefinido</label>
                            <label className="flex items-center gap-2"><input type="radio" name="contract" value="Cooperado" checked={form.contractType === "Cooperado"} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} /> Cooperado (cooperativa)</label>
                            <label className="flex items-center gap-2"><input type="radio" name="contract" value="Prestacion_servicios" checked={form.contractType === "Prestacion_servicios"} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} /> Prestación de servicios</label>
                            <label className="flex items-center gap-2"><input type="radio" name="contract" value="No_se" checked={form.contractType === "No_se"} onChange={e => setForm((f:any) => ({ ...f, contractType: e.target.value }))} /> No sé</label>
                        </div>
                    </div>

                    {/* 17. Horas diarias */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            17. Indique cuántas horas diarias de trabajo están establecidas habitualmente por la empresa para su cargo
                            <FormTooltip text="Las horas que normalmente debe cumplir al día según su contrato o acuerdo con la empresa. Si su horario es muy variable, anote el promedio de horas que suele trabajar al día." />
                        </Label>
                        <div>
                            <Input 
                                type="text" 
                                value={form.hoursPerDay} 
                                onChange={e => setForm((f:any) => ({ ...f, hoursPerDay: e.target.value }))} 
                                onBlur={(e) => {
                                    let val = e.target.value.trim();
                                    if (!val) return;
                                    
                                    val = val.replace(',', '.');
                                    let decimal = parseFloat(val);
                                    let isConverted = false;

                                    if (val.includes(':')) {
                                        const parts = val.split(':');
                                        const h = parseInt(parts[0]) || 0;
                                        const m = parseInt(parts[1]) || 0;
                                        decimal = h + (m / 60);
                                        isConverted = true;
                                    } else if (val.endsWith('.30')) {
                                        decimal = parseInt(val.split('.')[0]) + 0.5;
                                        isConverted = true;
                                    } else if (val.endsWith('.15')) {
                                        decimal = parseInt(val.split('.')[0]) + 0.25;
                                        isConverted = true;
                                    } else if (val.endsWith('.45')) {
                                        decimal = parseInt(val.split('.')[0]) + 0.75;
                                        isConverted = true;
                                    }

                                    if (isConverted || !isNaN(decimal)) {
                                        // Redondear a 2 decimales máximo para evitar números como 7.3333333
                                        const finalStr = Number(decimal.toFixed(2)).toString();
                                        setForm((f:any) => ({ ...f, hoursPerDay: finalStr }));
                                    }
                                }}
                                className="border-gray-300 bg-gray-50 max-w-[150px]" 
                                placeholder="Ej: 8 o 7:30"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Puedes escribir horas y minutos (ej. 7:30). Se convertirá a decimal (7.5).
                            </p>
                        </div>
                    </div>

                    {/* 18. Tipo de salario */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-1">
                            18. Seleccione y marque el tipo de salario que recibe (marque una sola opción)
                            <FormTooltip text="Fijo: sueldo base que no varía. Fijo y variable: sueldo base más comisiones o bonos. Todo variable: pago exclusivo por producción, comisión o a destajo." />
                        </Label>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2"><input type="radio" name="payment" value="Fijo" checked={form.paymentModality === "Fijo"} onChange={e => setForm((f:any) => ({ ...f, paymentModality: e.target.value }))} /> Fijo (diario, semanal, quincenal o mensual)</label>
                            <label className="flex items-center gap-2"><input type="radio" name="payment" value="Fijo_y_variable" checked={form.paymentModality === "Fijo_y_variable"} onChange={e => setForm((f:any) => ({ ...f, paymentModality: e.target.value }))} /> Una parte fija y otra variable</label>
                            <label className="flex items-center gap-2"><input type="radio" name="payment" value="Todo_variable" checked={form.paymentModality === "Todo_variable"} onChange={e => setForm((f:any) => ({ ...f, paymentModality: e.target.value }))} /> Todo variable (a destajo, por producción, por comisión)</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
