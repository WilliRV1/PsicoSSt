import formAConfig from "./form-a-config.json";
import formBConfig from "./form-b-config.json";
import extralaboralConfig from "./extralaboral-config.json";
import stressConfig from "./stress-config.json";
import baremos from "./baremos.json";

import { FormConfig, BaremoTable, FormType, QuestionnaireType } from "@/types/battery";

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

export {
    formAConfig,
    formBConfig,
    extralaboralConfig,
    stressConfig,
    baremos
};
