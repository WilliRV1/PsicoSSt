const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    console.log("Fetching assessments...");
    
    // Get Intralaboral Forma A (JEFATURA, PROFESIONAL, TECNICO)
    const intralaboralA = await prisma.assessment.findFirst({
        where: { 
            status: 'COMPLETED', 
            questionnaireType: 'INTRALABORAL',
            worker: { jobLevel: { in: ['JEFATURA', 'PROFESIONAL', 'TECNICO'] } }
        },
        include: { scoredResult: true, worker: true }
    });

    // Get Intralaboral Forma B (AUXILIAR, OPERATIVO)
    const intralaboralB = await prisma.assessment.findFirst({
        where: { 
            status: 'COMPLETED', 
            questionnaireType: 'INTRALABORAL',
            worker: { jobLevel: { in: ['AUXILIAR', 'OPERATIVO'] } }
        },
        include: { scoredResult: true, worker: true }
    });

    const extralaboral = await prisma.assessment.findFirst({
        where: { status: 'COMPLETED', questionnaireType: 'EXTRALABORAL' },
        include: { scoredResult: true, worker: true }
    });

    const stress = await prisma.assessment.findFirst({
        where: { status: 'COMPLETED', questionnaireType: 'STRESS' },
        include: { scoredResult: true, worker: true }
    });

    const results = [
        { label: 'Intralaboral Forma A', data: intralaboralA },
        { label: 'Intralaboral Forma B', data: intralaboralB },
        { label: 'Extralaboral', data: extralaboral },
        { label: 'Estrés', data: stress }
    ];

    fs.writeFileSync('C:/Users/delfo/.gemini/antigravity/brain/7b8bc537-dd32-4dd1-9ef3-a3c78bf27b50/scratch/auditor_data.json', JSON.stringify(results, null, 2));
    console.log("Data dumped to scratch/auditor_data.json");
}

main().catch(console.error).finally(() => prisma.$disconnect());
