import formAConfig from "./form-a-config.json";
import formBConfig from "./form-b-config.json";
import extralaboralConfig from "./extralaboral-config.json";
import stressConfig from "./stress-config.json";
import baremos from "./baremos.json";

import { FormConfig, BaremoTable, FormType, QuestionnaireType } from "@/types/battery";
import items from "./items.json";

export const getFormConfig = (formType: FormType, questionnaireType: QuestionnaireType): FormConfig | null => {
    if (questionnaireType === "INTRALABORAL") {
        return formType === "A" ? (formAConfig as FormConfig) : (formBConfig as FormConfig);
    }
    if (questionnaireType === "EXTRALABORAL") {
        return extralaboralConfig as unknown as FormConfig;
    }
    if (questionnaireType === "STRESS") {
        return stressConfig as unknown as FormConfig;
    }
    return null;
};

export const getBaremos = () => baremos;

/**
 * Enunciado de un ítem, transcrito de los cuadernillos oficiales.
 *
 * Sin ellos la aplicación sólo servía para transcribir: mostraba "¿Pregunta
 * 47?" y el profesional tenía que leer del cuadernillo impreso. Son el texto
 * literal del instrumento validado y no deben reformularse — cambiar la
 * redacción de un reactivo invalida su comparación con los baremos.
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
    baremos
};
