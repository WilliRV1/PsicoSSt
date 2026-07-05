import { scoreQuestionnaire } from "./index";

async function testScoring() {
    console.log("🚀 Starting Scoring Engine Verification...\n");

    let passed = 0;
    let failed = 0;

    function assertEq(name: string, actual: any, expected: any) {
        if (actual === expected) {
            console.log(`✅ ${name}: ${actual}`);
            passed++;
        } else {
            console.error(`❌ ${name}: expected ${expected}, got ${actual}`);
            failed++;
        }
    }

    // --- Caso 1: Claridad de Rol (A) — Todos 0 (invertidos) ---
    // Según config: ítems 53 al 59 (7 ítems). Si responde 0 (Siempre),
    // como están en "invertedItems", se convierten a 4.
    // Raw sum = 7 * 4 = 28. Transformed = 100.0
    console.log("--- Test Case 1: Claridad Rol (Invertidos) ---");
    const responses1: Record<string, number> = {};
    for (let i = 53; i <= 59; i++) responses1[String(i)] = 0;
    const result1 = scoreQuestionnaire(responses1, "A", "INTRALABORAL");
    const clarity = result1.dimensions["claridad_rol"];
    assertEq("Case 1 - Claridad Rol Raw", clarity.rawScore, 28);
    assertEq("Case 1 - Claridad Rol Transformed", clarity.transformedScore, 100.0);

    // --- Caso 2: Demandas Ambientales (A) — Todos 0 (directos) ---
    // Según config: ítems 1 al 12 (12 ítems). No invertidos.
    // Raw sum = 12 * 0 = 0. Transformed = 0.0
    console.log("\n--- Test Case 2: Demandas Ambientales (Directos) ---");
    const responses2: Record<string, number> = {};
    for (let i = 1; i <= 12; i++) responses2[String(i)] = 0;
    const result2 = scoreQuestionnaire(responses2, "A", "INTRALABORAL");
    const ambientales = result2.dimensions["demandas_ambientales"];
    assertEq("Case 2 - Demandas Amb Raw", ambientales.rawScore, 0);
    assertEq("Case 2 - Demandas Amb Transformed", ambientales.transformedScore, 0.0);

    // --- Caso 3: Estrés — Todos Siempre (0) ---
    // No hay inversión. Promedios: Grupo 1=0, G2=0, G3=0, G4=0. Total = 0.
    console.log("\n--- Test Case 3: Estrés Todos 0 ---");
    const responses3: Record<string, number> = {};
    for (let i = 1; i <= 31; i++) responses3[String(i)] = 0;
    const result3 = scoreQuestionnaire(responses3, "A", "STRESS", { jobLevel: "AUXILIAR" });
    assertEq("Case 3 - Estrés Raw", result3.total.rawScore, 0);
    assertEq("Case 3 - Estrés Transformed", result3.total.transformedScore, 0.0);

    // --- Caso 4: Estrés — Todos Nunca (3) ---
    // Promedios: 3*4 + 3*3 + 3*2 + 3*1 = 30.
    // Transformado: (30 / 61.16) * 100 = 49.0516... -> 49.1
    console.log("\n--- Test Case 4: Estrés Todos 3 ---");
    const responses4: Record<string, number> = {};
    for (let i = 1; i <= 31; i++) responses4[String(i)] = 3;
    const result4 = scoreQuestionnaire(responses4, "A", "STRESS", { jobLevel: "AUXILIAR" });
    assertEq("Case 4 - Estrés Raw", result4.total.rawScore, 30);
    assertEq("Case 4 - Estrés Transformed", result4.total.transformedScore, 49.1);

    // --- Caso 5: Integridad / Faltantes ---
    console.log("\n--- Test Case 5: Reglas de Integridad ---");
    // Liderazgo (tolerante): faltan 1
    const responses5: Record<string, number> = {};
    for (let i = 63; i <= 75; i++) responses5[String(i)] = 1; // 13 ítems. 
    delete responses5["63"]; // Falta 1
    // Respuestas dadas: 12. Suma raw original (sin imputar) = 12.
    // Imputación: avg = 12/12 = 1. Faltan 1 -> raw = 12 + 1 = 13.
    // Max = 13 * 4 = 52. Transf = (13/52)*100 = 25.0
    const result5 = scoreQuestionnaire(responses5, "A", "INTRALABORAL");
    const liderazgo = result5.dimensions["liderazgo_caracteristicas"];
    assertEq("Case 5 - Liderazgo con 1 faltante es Válido", liderazgo.isValid, true);
    assertEq("Case 5 - Liderazgo Raw con imputación", liderazgo.rawScore, 13);
    assertEq("Case 5 - Liderazgo Transformed", liderazgo.transformedScore, 25.0);

    // Falta 1 en Claridad Rol (No tolerante)
    const responses6: Record<string, number> = {};
    for (let i = 53; i <= 59; i++) responses6[String(i)] = 0; // 7 ítems.
    delete responses6["53"]; // Falta 1
    const result6 = scoreQuestionnaire(responses6, "A", "INTRALABORAL");
    const clarity2 = result6.dimensions["claridad_rol"];
    assertEq("Case 5 - Claridad Rol con 1 faltante es INVÁLIDO", clarity2.isValid, false);
    assertEq("Case 5 - Total también es INVÁLIDO", result6.total.rawScore, 0);
    
    // --- Caso 6: Filtros ---
    console.log("\n--- Test Case 6: Filtros Condicionales ---");
    const responses7: Record<string, number> = {};
    for (let i = 106; i <= 114; i++) responses7[String(i)] = 4; // Demandas emocionales
    const result7 = scoreQuestionnaire(responses7, "A", "INTRALABORAL", { hasCustomerInteraction: false });
    const emocionales = result7.dimensions["demandas_emocionales"];
    assertEq("Case 6 - Demandas emocionales filtradas a 0", emocionales.rawScore, 0);
    assertEq("Case 6 - Demandas emocionales son válidas pero 0", emocionales.isValid, true);

    console.log(`\n🏁 Verificación: ${passed} PASSED, ${failed} FAILED.`);
}

testScoring();
