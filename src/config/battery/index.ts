import formAConfig from "./form-a-config.json";
import formBConfig from "./form-b-config.json";
import extralaboralConfig from "./extralaboral-config.json";
import stressConfig from "./stress-config.json";
import climaConfig from "./clima-config.json";
import baremos from "./baremos.json";

import { FormConfig, FormType, QuestionnaireType } from "@/types/battery";
import items from "./items.json";

/**
 * Configuración de ítems y dimensiones de un instrumento. La selección por
 * tipo y forma vive en `src/config/instruments`; aquí sólo se resuelve el JSON
 * sin ramificar por instrumento.
 */
const CONFIGS: Record<QuestionnaireType, (formType: FormType) => FormConfig> = {
    INTRALABORAL: (formType) => (formType === "A" ? formAConfig : formBConfig) as FormConfig,
    EXTRALABORAL: () => extralaboralConfig as unknown as FormConfig,
    STRESS: () => stressConfig as unknown as FormConfig,
    CLIMA: () => climaConfig as unknown as FormConfig,
};

export const getFormConfig = (formType: FormType, questionnaireType: QuestionnaireType): FormConfig | null => {
    const resolve = CONFIGS[questionnaireType];
    return resolve ? resolve(formType) : null;
};

export const getBaremos = () => baremos;

/**
 * Enunciado de un ítem, transcrito de los cuadernillos oficiales.
 *
 * Sin ellos la aplicación sólo servía para transcribir: mostraba "¿Pregunta
 * 47?" y el profesional tenía que leer del cuadernillo impreso. Son el texto
 * literal del instrumento validado y no deben reformularse — cambiar la
 * redacción de un reactivo invalida su comparación con los baremos.
 *
 * El intralaboral se indexa por forma (A/B); los demás, por instrumento.
 */
export const getItemText = (
    questionnaireType: QuestionnaireType,
    formType: FormType,
    item: number
): string | null => {
    const grupo =
        questionnaireType === "INTRALABORAL"
            ? (items as Record<string, Record<string, string>>)[formType]
            : (items as Record<string, Record<string, string>>)[questionnaireType];
    return grupo?.[String(item)] ?? null;
};

export {
    formAConfig,
    formBConfig,
    extralaboralConfig,
    stressConfig,
    climaConfig,
    baremos
};
