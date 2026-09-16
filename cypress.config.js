// Archivo CommonJS (sin "type": "module" en package.json) — convertir a
// `import` real rompería la carga de este config en tiempo de ejecución.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents() {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,

    // Video desactivado para velocidad
    video: false,
    
    // Capturas de pantalla en fallos
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/screenshots",
    
    // Optimización de ejecución
    defaultCommandTimeout: 15000,
    
    // Archivos de soporte
    supportFile: "cypress/support/e2e.js",
  },
});
