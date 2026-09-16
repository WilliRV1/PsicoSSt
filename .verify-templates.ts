import fs from "node:fs";
async function main() {
    const { compileTypstPdf } = await import("./src/lib/reports/typst");
    const pairs: [string, string][] = [["individual.typ","individual-a"],["individual.typ","individual-extra"],["individual.typ","individual-stress"],["individual.typ","individual-invalido"],["sociodemographic.typ","sociodemographic"],["collective.typ","collective-executive"],["collective.typ","collective-technical"],["diagnostic.typ","diagnostic-full"],["diagnostic.typ","diagnostic-small"],["intervention.typ","intervention"],["sve.typ","sve"]];
    let bad = 0;
    for (const [tpl, fx] of pairs) { try { await compileTypstPdf(tpl, JSON.parse(fs.readFileSync(`typst/fixtures/${fx}.json`, "utf8"))); } catch (e: any) { bad++; console.log(`FALLA ${tpl}/${fx}: ${e.message}`); } }
    console.log(bad ? `${bad} fallan` : "11/11 compilan"); process.exit(bad ? 1 : 0);
}
main();
