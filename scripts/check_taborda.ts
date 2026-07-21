import { prisma } from './src/lib/prisma';

async function main() {
    const t = await prisma.assessment.findFirst({
        where: {
            worker: { fullName: { contains: 'TABORDA' } },
            questionnaireType: 'INTRALABORAL'
        },
        include: { scoredResult: true }
    });
    
    console.log('Taborda Overall Risk:', t?.scoredResult?.overallRiskCategory);
    console.log('Taborda Total Scores:', JSON.stringify(t?.scoredResult?.totalScores, null, 2));
}

main().finally(() => prisma.$disconnect());
