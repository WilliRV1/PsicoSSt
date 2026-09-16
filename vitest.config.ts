import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    /**
     * Los archivos de prueba corren de a uno.
     *
     * Las pruebas de integración comparten UNA base de datos y limpian tablas
     * globales entre casos (`psychologist.deleteMany()` y compañía). En
     * paralelo, la limpieza de un archivo borra las filas que otro está
     * usando: aparecen violaciones de llave foránea y filas que «desaparecen»
     * a mitad de un caso, con fallos distintos en cada corrida. Serializar
     * cuesta unos segundos; depurar carreras entre archivos cuesta tardes.
     */
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
