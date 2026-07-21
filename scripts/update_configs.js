const fs = require('fs');
const path = require('path');

const baremosPath = path.join(__dirname, 'src/config/battery/baremos.json');
const baremosData = JSON.parse(fs.readFileSync(baremosPath, 'utf8'));

const updates = {
    demandas_ambientales: { sinRiesgo: [0, 22.9], bajo: [23.0, 31.3], medio: [31.4, 39.6], alto: [39.7, 47.9], muyAlto: [48.0, 100] },
    demandas_emocionales: { sinRiesgo: [0, 19.4], bajo: [19.5, 27.8], medio: [27.9, 38.9], alto: [39.0, 47.2], muyAlto: [47.3, 100] },
    demandas_cuantitativas: { sinRiesgo: [0, 16.7], bajo: [16.8, 33.3], medio: [33.4, 41.7], alto: [41.8, 50.0], muyAlto: [50.1, 100] },
    influencia_trabajo_extralaboral: { sinRiesgo: [0, 12.5], bajo: [12.6, 25.0], medio: [25.1, 31.3], alto: [31.4, 50.0], muyAlto: [50.1, 100] },
    demandas_carga_mental: { sinRiesgo: [0, 50.0], bajo: [50.1, 65.0], medio: [65.1, 75.0], alto: [75.1, 85.0], muyAlto: [85.1, 100] },
    demandas_jornada: { sinRiesgo: [0, 25.0], bajo: [25.1, 37.5], medio: [37.6, 45.8], alto: [45.9, 58.3], muyAlto: [58.4, 100] },
    claridad_rol: { sinRiesgo: [0, 5.0], bajo: [5.1, 15.0], medio: [15.1, 30.0], alto: [30.1, 45.0], muyAlto: [45.1, 100] },
    capacitacion: { sinRiesgo: [0, 4.2], bajo: [4.3, 16.7], medio: [16.8, 25.0], alto: [25.1, 45.8], muyAlto: [45.9, 100] },
    oportunidades_desarrollo: { sinRiesgo: [0, 12.5], bajo: [12.6, 25.0], medio: [25.1, 37.5], alto: [37.6, 56.3], muyAlto: [56.4, 100] },
    control_autonomia: { sinRiesgo: [0, 33.3], bajo: [33.4, 50.0], medio: [50.1, 66.7], alto: [66.8, 75.0], muyAlto: [75.1, 100] }
};

for (const [key, thresholds] of Object.entries(updates)) {
    if (baremosData.intralaboral_b.dimensions[key]) {
        baremosData.intralaboral_b.dimensions[key] = thresholds;
    } else {
        console.warn(`Key '${key}' not found in intralaboral_b.dimensions!`);
    }
}
fs.writeFileSync(baremosPath, JSON.stringify(baremosData, null, 4));
console.log('Updated baremos.json with Table 30 Forma B values.');

const formAConfigPath = path.join(__dirname, 'src/config/battery/form-a-config.json');
const formAData = JSON.parse(fs.readFileSync(formAConfigPath, 'utf8'));
const dimA = formAData.dimensions.find(d => d.key === 'demandas_ambientales');
if (dimA) dimA.invertedItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
fs.writeFileSync(formAConfigPath, JSON.stringify(formAData, null, 4));
console.log('Updated form-a-config.json invertedItems.');

const formBConfigPath = path.join(__dirname, 'src/config/battery/form-b-config.json');
const formBData = JSON.parse(fs.readFileSync(formBConfigPath, 'utf8'));
const dimB = formBData.dimensions.find(d => d.key === 'demandas_ambientales');
if (dimB) dimB.invertedItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
fs.writeFileSync(formBConfigPath, JSON.stringify(formBData, null, 4));
console.log('Updated form-b-config.json invertedItems.');
