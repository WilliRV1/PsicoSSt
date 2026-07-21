import { esCO } from './dictionaries/es-CO';

// Default to es-CO for now, but ready to expand
export const getDictionary = (locale: string = 'es-CO') => {
  switch (locale) {
    case 'es-CO':
      return esCO;
    default:
      return esCO;
  }
};

export type Dictionary = typeof esCO;
