const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
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
