import { prisma } from './src/lib/prisma';
import { scoreQuestionnaire } from './src/lib/scoring';
import { FormType, QuestionnaireType } from './src/types/battery';

async function main() {
    console.log("Fetching assessments with responses...");
    const assessments = await prisma.assessment.findMany({
        where: { responseSet: { isNot: null } },
        include: {
            worker: true,
            responseSet: true,
            scoredResult: true
        }
    });

    console.log(`Found ${assessments.length} assessments to rescore.`);
    let successCount = 0;
    
    for (const assessment of assessments) {
        if (!assessment.responseSet || !assessment.responseSet.responses) {
            continue;
        }

        const rawResponses = assessment.responseSet.responses as any;
        
        // Metadata for scoring
        const metadata = {
            occupationalGroup: assessment.worker.jobLevel === "AUXILIAR" || assessment.worker.jobLevel === "OPERATIVO" ? "auxiliares_operativos" : "jefes_profesionales_tecnicos",
            gender: assessment.worker.gender,
            jobLevel: assessment.worker.jobLevel,
            hasCustomerInteraction: assessment.worker.hasCustomerInteraction
        };

        const scoredResultData = scoreQuestionnaire(
            rawResponses,
            assessment.formType as FormType,
            assessment.questionnaireType as QuestionnaireType,
            metadata
        );

        // Update database
        await prisma.scoredResult.update({
            where: { assessmentId: assessment.id },
            data: {
                dimensionScores: scoredResultData.dimensions as any,
                domainScores: scoredResultData.domains as any,
                totalScores: scoredResultData.total as any,
                overallRiskCategory: scoredResultData.total.riskCategory
            }
        });

        successCount++;
    }

    console.log(`Successfully rescored ${successCount} assessments.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
