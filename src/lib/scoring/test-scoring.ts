import { scoreQuestionnaire } from "./index";

/**
 * Manual test script to verify scoring engine logic
 */
async function testScoring() {
    console.log("🚀 Starting Scoring Engine Verification...\n");

    // Case 1: Intralaboral Form A - Claridad de Rol (Protector)
    // Scale: 0=Siempre, 4=Nunca.
    // Protector: 0 Siempre -> 0 Riesgo (No inversion)
    // Responses: 1, 0, 2, 0, 1, 1, 0 (Worker has clarity)
    // Raw sum = 1+0+2+0+1+1+0 = 5
    // Max = 28
    // Transf = (5/28)*100 = 17.86
    // Baremo: [7.2, 17.9] is MEDIO risk.
    console.log("--- Test Case 1: Protector Dimension (Claridad de Rol) ---");
    const responsesCase1 = {
        "79": 1, "80": 0, "81": 2, "82": 0, "83": 1, "84": 1, "85": 0
    };
    const result1 = scoreQuestionnaire(responsesCase1, "A", "INTRALABORAL");
    const clarity = result1.dimensions.claridad_rol;
    console.log(`Raw Score: ${clarity.rawScore} (Expected: 5)`);
    console.log(`Risk Category: ${clarity.riskCategory} (Expected: MEDIO)`);

    if (clarity.rawScore === 5 && clarity.riskCategory === "MEDIO") {
        console.log("✅ Case 1 PASSED");
    } else {
        console.log("❌ Case 1 FAILED");
    }

    // Case 2: Inversion Logic - Demandas (Riesgo)
    // Protector (Liderazgo) Item 1 = 0 (Siempre) -> 0 Riesgo
    // Riesgo (Demandas) Item 43 = 0 (Siempre) -> 4 Riesgo (Inverted)
    console.log("\n--- Test Case 2: Inversion Logic ---");
    const responsesCase2 = { "1": 0, "43": 0 };
    const result2 = scoreQuestionnaire(responsesCase2, "A", "INTRALABORAL");
    const lider = result2.dimensions.liderazgo_caracteristicas;
    const ambi = result2.dimensions.demandas_ambientales;
    console.log(`Liderazgo (Item 1=0): Raw=${lider.rawScore} (Expected 0)`);
    console.log(`Demandas (Item 43=0): Raw=${ambi.rawScore} (Expected 4)`);
    if (lider.rawScore === 0 && ambi.rawScore === 4) {
        console.log("✅ Case 2 PASSED");
    } else {
        console.log("❌ Case 2 FAILED");
    }

    // Case 3: Stress Questionnaire
    // Scale 0-3. All items inverted to ensure Always (0) = High Risk (3).
    // If I answer "Siempre" (0) to all 8 items of Fisiológicos
    // Raw should be 8 * 3 = 24. Transformed = 100.
    console.log("\n--- Test Case 3: Stress Questionnaire ---");
    const responsesCase3: Record<string, number> = {};
    for (let i = 1; i <= 31; i++) responsesCase3[String(i)] = 0; // All "Siempre"
    const result3 = scoreQuestionnaire(responsesCase3, "A", "STRESS", { occupationalGroup: "auxiliares_operativos" });
    const fisio = result3.dimensions.sintomas_fisiologicos;
    console.log(`Fisiológicos (All 0): Raw=${fisio.rawScore} (Expected 24)`);
    console.log(`Total Stress Risk: ${result3.total.riskCategory} (Expected: MUY_ALTO)`);
    if (fisio.rawScore === 24 && result3.total.riskCategory === "MUY_ALTO") {
        console.log("✅ Case 3 PASSED");
    } else {
        console.log("❌ Case 3 FAILED");
    }

    console.log("\n🏁 Final Verification Completed.");
}

testScoring();
