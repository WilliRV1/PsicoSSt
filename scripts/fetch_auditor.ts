import { prisma } from './src/lib/prisma';
import fs from 'fs';

async function main() {
    console.log("Fetching assessments from Neon Database...");
    
    const count = await prisma.assessment.count();
    console.log(`Total assessments in DB: ${count}`);

    const assessments = await prisma.assessment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { scoredResult: true, worker: true, responseSet: true }
    });

    const formatAssessment = (a: any) => {
        if (!a) return null;
        return {
            Type: a.questionnaireType,
            Status: a.status,
            AssessmentID: a.id,
            WorkerInfo: {
                Name: a.worker?.fullName,
                Document: `${a.worker?.documentType} ${a.worker?.documentId}`,
                JobLevel: a.worker?.jobLevel,
            },
            RawResponsesObj: a.responseSet?.responses ? (typeof a.responseSet.responses === 'string' ? JSON.parse(a.responseSet.responses) : a.responseSet.responses) : null,
            RawResponsesString: (() => {
                if (!a.responseSet?.responses) return '';
                const r = typeof a.responseSet.responses === 'string' ? JSON.parse(a.responseSet.responses) : a.responseSet.responses;
                const keys = Object.keys(r).map(Number).filter(k => !isNaN(k)).sort((x, y) => x - y);
                return keys.map(k => r[k]).join(',');
            })(),
            CalculatedResult: {
                OverallRisk: a.scoredResult?.overallRiskCategory,
                TotalScore: a.scoredResult?.totalScore,
                TotalTransformedScore: a.scoredResult?.totalTransformedScore,
                Dimensions: typeof a.scoredResult?.dimensionScores === 'string' 
                            ? JSON.parse(a.scoredResult.dimensionScores) 
                            : a.scoredResult?.dimensionScores,
                Domains: typeof a.scoredResult?.domainScores === 'string' 
                            ? JSON.parse(a.scoredResult.domainScores) 
                            : a.scoredResult?.domainScores,
            }
        };
    };

    const results = assessments.map(formatAssessment).filter(Boolean);

    const artifactPath = 'C:/Users/delfo/.gemini/antigravity/brain/7b8bc537-dd32-4dd1-9ef3-a3c78bf27b50/auditoria_baremos.json';
    fs.writeFileSync(artifactPath, JSON.stringify(results, null, 2));
    console.log(`Data successfully dumped to ${artifactPath}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
