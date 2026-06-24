import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreQuestionnaire } from '@/lib/scoring';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/** Generates uniform responses for N items (keys "1".."N", all with given value 0-4) */
function makeResponses(count: number, value: number): Record<string, number> {
  const r: Record<string, number> = {};
  const v = Math.max(0, Math.min(4, value));
  for (let i = 1; i <= count; i++) r[String(i)] = v;
  return r;
}

/** Returns a Date N days before today */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * GET/POST /api/dev/seed-full
 * Creates full test dataset: admin + pending psychologist, 2 orgs, 6 workers,
 * 11 assessments (intralaboral/extralaboral/stress) with scores and reports.
 * Only works outside of production.
 */
export async function GET() {
  return handler();
}

export async function POST() {
  return handler();
}

async function handler() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const log: string[] = [];
  const db = prisma as any;

  try {
    // ══════════════════════════════════════════════════════════════════
    // 1. PSYCHOLOGISTS
    // ══════════════════════════════════════════════════════════════════
    const adminHash = await bcrypt.hash('Admin123456!', 12);
    const pendingHash = await bcrypt.hash('Pendiente123!', 12);
    const psy2Hash = await bcrypt.hash('Psicologo123!', 12);

    const admin = await prisma.psychologist.upsert({
      where: { email: 'admin@psicosst.com' },
      update: { passwordHash: adminHash, status: 'ACTIVE', isAdmin: true },
      create: {
        email: 'admin@psicosst.com',
        passwordHash: adminHash,
        fullName: 'Dr. Administrador PsicoSST',
        licenseNumber: 'PSI-ADMIN-001',
        professionalCard: 'TP-12345-PSI',
        sstCredential: 'SST-2024-001',
        isAdmin: true,
        status: 'ACTIVE',
      },
    });
    log.push(`✅ Admin creado: ${admin.email}`);

    // Second active psychologist (to show multi-psychologist data)
    const psy2 = await prisma.psychologist.upsert({
      where: { email: 'psicologa2@psicosst.com' },
      update: {},
      create: {
        email: 'psicologa2@psicosst.com',
        passwordHash: psy2Hash,
        fullName: 'Dra. Claudia Bermúdez Rivas',
        licenseNumber: 'PSI-2024-099',
        professionalCard: 'TP-99887-PSI',
        sstCredential: 'SST-2024-099',
        isAdmin: false,
        status: 'ACTIVE',
      },
    });
    log.push(`✅ Psicóloga 2: ${psy2.email}`);

    // Pending psychologist (for admin approval flow testing)
    const pending = await prisma.psychologist.upsert({
      where: { email: 'pendiente@psicosst.com' },
      update: {},
      create: {
        email: 'pendiente@psicosst.com',
        passwordHash: pendingHash,
        fullName: 'Dra. María Torres Salcedo',
        licenseNumber: 'PSI-2024-200',
        professionalCard: 'TP-20024-PSI',
        sstCredential: 'SST-2024-200',
        isAdmin: false,
        status: 'PENDING',
      },
    });
    log.push(`✅ Psicóloga pendiente: ${pending.email}`);

    // ══════════════════════════════════════════════════════════════════
    // 2. SIGNATURE FOR ADMIN (small placeholder PNG — white 32×32)
    // ══════════════════════════════════════════════════════════════════
    // This is a real base64 PNG (32×32 white canvas) so the PDF render works
    const signaturePng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU5ErkJggg==';

    if (db.psychologistSignature) {
      await db.psychologistSignature.upsert({
        where: { psychologistId_signatureType: { psychologistId: admin.id, signatureType: 'drawn' } },
        update: { dataUrl: signaturePng },
        create: { psychologistId: admin.id, signatureType: 'drawn', dataUrl: signaturePng },
      });
      log.push('✅ Firma del admin registrada');
    } else {
      log.push('ℹ️ Para crear datos de prueba completos usa: npx npm run seed (script independiente)');
    }

    // ══════════════════════════════════════════════════════════════════
    // 3. ORGANIZATIONS
    // ══════════════════════════════════════════════════════════════════
    const org1 = await prisma.organization.upsert({
      where: { nit: '900.111.222-1' },
      update: {},
      create: {
        name: 'TechSolutions Colombia S.A.S.',
        nit: '900.111.222-1',
        economicSector: 'Tecnología e Información',
        city: 'Bogotá',
        department: 'Cundinamarca',
        employeeCount: 120,
        contactName: 'Jorge Ramírez Peña',
        contactEmail: 'jramirez@techsolutions.co',
        contactPhone: '3101234567',
        createdByPsychologist: admin.id,
      },
    });

    const org2 = await prisma.organization.upsert({
      where: { nit: '800.333.444-2' },
      update: {},
      create: {
        name: 'Constructora Andina Ltda.',
        nit: '800.333.444-2',
        economicSector: 'Construcción y Obras Civiles',
        city: 'Medellín',
        department: 'Antioquia',
        employeeCount: 85,
        contactName: 'Sandra Morales López',
        contactEmail: 'smorales@constructoraandina.co',
        contactPhone: '3209876543',
        createdByPsychologist: admin.id,
      },
    });

    log.push(`✅ Organizaciones: "${org1.name}" y "${org2.name}"`);

    // ══════════════════════════════════════════════════════════════════
    // 4. WORKERS
    // responseValue → uniform Likert value for all questionnaire items:
    //   0 = SIN_RIESGO/BAJO   1 = BAJO   2 = MEDIO   3 = ALTO   4 = MUY_ALTO
    // formType: 'A' for JEFATURA/PROFESIONAL, 'B' for TECNICO/AUXILIAR/OPERATIVO
    // ══════════════════════════════════════════════════════════════════
    const workersSpec = [
      /* ─── TechSolutions (org1) ─────────────────────────────────── */
      {
        docType: 'CC', docId: '79876543',
        name: 'Carlos Andrés Herrera López',
        gender: 'M', birth: '1985-03-15', marital: 'CASADO',
        edu: 'PROFESIONAL', title: 'Gerente de Tecnología', level: 'JEFATURA',
        city: 'Bogotá', stratum: 4, housing: 'PROPIA', deps: 2,
        transport: 'VEHICULO_PARTICULAR', commute: 30, customer: true,
        dept: 'Dirección de Tecnología', yearsOrg: 8, yearsPos: 3,
        contract: 'Término Indefinido', schedule: 'Diurno', hours: 45,
        orgId: org1.id, freeTime: ['FAMILIA', 'DEPORTE'],
        formType: 'A', responseValue: 0,   // → SIN_RIESGO / BAJO
        psychId: admin.id,
      },
      {
        docType: 'CC', docId: '52345678',
        name: 'Ana Lucía Vargas Soto',
        gender: 'F', birth: '1990-07-22', marital: 'SOLTERO',
        edu: 'MAESTRIA', title: 'Desarrolladora Senior', level: 'PROFESIONAL',
        city: 'Bogotá', stratum: 3, housing: 'ARRENDADA', deps: 0,
        transport: 'TRANSPORTE_MASIVO', commute: 60, customer: false,
        dept: 'Desarrollo de Software', yearsOrg: 4, yearsPos: 2,
        contract: 'Término Indefinido', schedule: 'Diurno', hours: 40,
        orgId: org1.id, freeTime: ['ESTUDIO', 'RECREACION'],
        formType: 'A', responseValue: 2,   // → MEDIO
        psychId: admin.id,
      },
      {
        docType: 'CC', docId: '1098765432',
        name: 'Diego Fernando Ospina Ríos',
        gender: 'M', birth: '1995-11-08', marital: 'SOLTERO',
        edu: 'TECNOLOGO', title: 'Especialista de Soporte TI', level: 'TECNICO',
        city: 'Bogotá', stratum: 2, housing: 'FAMILIAR', deps: 1,
        transport: 'TRANSPORTE_PUBLICO', commute: 90, customer: true,
        dept: 'Soporte Técnico', yearsOrg: 2, yearsPos: 2,
        contract: 'Término Fijo', schedule: 'Turnos', hours: 42,
        orgId: org1.id, freeTime: ['RECREACION', 'DESCANSO'],
        formType: 'A', responseValue: 3,   // → ALTO
        psychId: admin.id,
      },
      /* ─── Constructora Andina (org2) ────────────────────────────── */
      {
        docType: 'CC', docId: '71234567',
        name: 'Roberto Carlos Jiménez Cano',
        gender: 'M', birth: '1978-05-20', marital: 'CASADO',
        edu: 'BACHILLERATO', title: 'Operario de Construcción', level: 'OPERATIVO',
        city: 'Medellín', stratum: 1, housing: 'ARRENDADA', deps: 3,
        transport: 'TRANSPORTE_PUBLICO', commute: 45, customer: false,
        dept: 'Obras Civiles', yearsOrg: 10, yearsPos: 10,
        contract: 'Obra y Labor', schedule: 'Diurno', hours: 48,
        orgId: org2.id, freeTime: ['FAMILIA', 'DESCANSO'],
        formType: 'B', responseValue: 4,   // → MUY_ALTO
        psychId: admin.id,
      },
      {
        docType: 'CC', docId: '43567890',
        name: 'Patricia Elena Cárdenas Muñoz',
        gender: 'F', birth: '1982-09-14', marital: 'UNION_LIBRE',
        edu: 'TECNICO', title: 'Auxiliar Administrativa', level: 'AUXILIAR',
        city: 'Medellín', stratum: 2, housing: 'ARRENDADA', deps: 2,
        transport: 'TRANSPORTE_MASIVO', commute: 50, customer: true,
        dept: 'Administración y RRHH', yearsOrg: 6, yearsPos: 3,
        contract: 'Término Indefinido', schedule: 'Diurno', hours: 40,
        orgId: org2.id, freeTime: ['FAMILIA', 'OTRO'],
        formType: 'B', responseValue: 1,   // → BAJO
        psychId: psy2.id,  // Assigned to second psychologist
      },
      {
        docType: 'CC', docId: '32109876',
        name: 'Héctor Fabio Moreno Castro',
        gender: 'M', birth: '1970-12-03', marital: 'SEPARADO',
        edu: 'BACHILLERATO', title: 'Maestro de Obra', level: 'OPERATIVO',
        city: 'Medellín', stratum: 2, housing: 'PROPIA', deps: 4,
        transport: 'MOTOCICLETA', commute: 25, customer: false,
        dept: 'Obras Civiles', yearsOrg: 15, yearsPos: 8,
        contract: 'Obra y Labor', schedule: 'Diurno', hours: 50,
        orgId: org2.id, freeTime: ['DESCANSO', 'FAMILIA'],
        formType: 'B', responseValue: 3,   // → ALTO
        psychId: psy2.id,
      },
    ];

    const createdWorkers: Array<{ workerId: string; orgId: string; formType: string; responseValue: number; psychId: string }> = [];

    for (const w of workersSpec) {
      const worker = await prisma.worker.upsert({
        where: {
          documentType_documentId_organizationId: {
            documentType: w.docType as any,
            documentId: w.docId,
            organizationId: w.orgId,
          },
        },
        update: {},
        create: {
          documentType: w.docType as any,
          documentId: w.docId,
          fullName: w.name,
          gender: w.gender,
          birthDate: new Date(w.birth),
          maritalStatus: w.marital,
          educationLevel: w.edu as any,
          jobTitle: w.title,
          jobLevel: w.level as any,
          residenceCity: w.city,
          socioeconomicStratum: String(w.stratum),
          housingType: w.housing as any,
          dependentsCount: w.deps,
          freeTimeUsage: w.freeTime as any,
          transportMeans: w.transport as any,
          displacementTime: w.commute,
          hasCustomerInteraction: w.customer,
          departmentArea: w.dept,
          yearsInCompany: w.yearsOrg,
          yearsInPosition: w.yearsPos,
          contractType: w.contract,
          workSchedule: w.schedule,
          hoursPerWeek: String(w.hours),
          organizationId: w.orgId,
        },
      });
      createdWorkers.push({
        workerId: worker.id,
        orgId: w.orgId,
        formType: w.formType,
        responseValue: w.responseValue,
        psychId: w.psychId,
      });
    }
    log.push(`✅ ${createdWorkers.length} trabajadores creados`);

    // ══════════════════════════════════════════════════════════════════
    // 5. ASSESSMENTS + SCORING + REPORTS
    // Each worker gets 1–3 assessments spread over the last 90 days
    // ══════════════════════════════════════════════════════════════════
    const aiRecommendations = [
      `Basado en los resultados, se sugiere fortalecer los canales de comunicación con el equipo de liderazgo, implementar reuniones de retroalimentación quincenales y revisar la distribución de cargas de trabajo para prevenir el agotamiento.`,
      `Se recomienda diseñar un programa de desarrollo de competencias emocionales, establecer pausas activas programadas dos veces al día y crear espacios de escucha activa para fortalecer el clima laboral.`,
      `Es prioritario intervenir el factor de demandas cuantitativas mediante la redistribución de tareas. Se sugiere revisar los objetivos, establecer prioridades claras y apoyar al trabajador con herramientas de gestión del tiempo.`,
      `Los resultados evidencian riesgo muy alto en múltiples dimensiones. Se recomienda intervención inmediata: referir al médico laboral, ajustar condiciones de trabajo, reducir horas extras y asignar apoyo psicosocial individualizado.`,
      `Se recomienda fortalecer el apoyo social en el trabajo mediante actividades de integración de equipo, mejorar los canales de comunicación vertical y horizontal, y garantizar un trato equitativo y respetuoso en todos los niveles jerárquicos.`,
      `El programa de intervención debe enfocarse en el control sobre el trabajo: ampliar la autonomía en la toma de decisiones, proporcionar capacitación continua y clarificar funciones y responsabilidades del cargo.`,
    ];

    let totalAssessments = 0;
    const reportStatuses = ['DRAFT', 'REVIEWED', 'SIGNED', 'DRAFT', 'REVIEWED', 'DRAFT'];

    for (let i = 0; i < createdWorkers.length; i++) {
      const { workerId, orgId, formType, responseValue, psychId } = createdWorkers[i];

      const intraItems = formType === 'A' ? 123 : 97;
      const baseDate = daysAgo(90 - i * 12); // spread across 3 months

      // ── INTRALABORAL ──────────────────────────────────────────────
      const intraResponses = makeResponses(intraItems, responseValue);

      const intraAssessment = await prisma.assessment.create({
        data: {
          workerId,
          psychologistId: psychId,
          organizationId: orgId,
          formType: formType as any,
          questionnaireType: 'INTRALABORAL',
          assessmentDate: baseDate,
          status: 'SCORED',
          completedAt: baseDate,
        },
      });

      await prisma.responseSet.create({
        data: {
          assessmentId: intraAssessment.id,
          responses: intraResponses,
          totalItems: intraItems,
          isComplete: true,
          submittedAt: baseDate,
        },
      });

      const intraScored = scoreQuestionnaire(intraResponses, formType as any, 'INTRALABORAL', {
        jobLevel: workersSpec[i].level as any,
        hasCustomerInteraction: workersSpec[i].customer,
      });

      await prisma.scoredResult.create({
        data: {
          assessmentId: intraAssessment.id,
          dimensionScores: intraScored.dimensions as any,
          domainScores: intraScored.domains as any,
          totalScores: intraScored.total as any,
          overallRiskCategory: intraScored.total.riskCategory as any,
        },
      });

      const reportStatus = reportStatuses[i % reportStatuses.length];
      await db.report.create({
        data: {
          assessmentId: intraAssessment.id,
          psychologistId: psychId,
          reportType: 'individual',
          reportData: {
            recommendations: 'Ver sección de recomendaciones generadas por IA.',
            completedAt: baseDate.toISOString(),
          },
          status: reportStatus,
          recommendationsAI: aiRecommendations[i % aiRecommendations.length],
          ...(reportStatus === 'SIGNED' ? {
            signedBy: admin.email,
            signedAt: new Date(),
            isFinalized: true,
          } : {}),
        },
      });

      totalAssessments++;

      // ── EXTRALABORAL (workers 0, 1, 3, 4) ────────────────────────
      if ([0, 1, 3, 4].includes(i)) {
        const extraDate = new Date(baseDate);
        extraDate.setDate(extraDate.getDate() + 2);
        const extraVal = Math.min(4, responseValue + 1);
        const extraResponses = makeResponses(31, extraVal);

        const extraAssessment = await prisma.assessment.create({
          data: {
            workerId,
            psychologistId: psychId,
            organizationId: orgId,
            formType: formType as any,
            questionnaireType: 'EXTRALABORAL',
            assessmentDate: extraDate,
            status: 'SCORED',
            completedAt: extraDate,
          },
        });

        await prisma.responseSet.create({
          data: {
            assessmentId: extraAssessment.id,
            responses: extraResponses,
            totalItems: 31,
            isComplete: true,
            submittedAt: extraDate,
          },
        });

        const extraScored = scoreQuestionnaire(extraResponses, formType as any, 'EXTRALABORAL');

        await prisma.scoredResult.create({
          data: {
            assessmentId: extraAssessment.id,
            dimensionScores: extraScored.dimensions as any,
            domainScores: extraScored.domains as any,
            totalScores: extraScored.total as any,
            overallRiskCategory: extraScored.total.riskCategory as any,
          },
        });

        await db.report.create({
          data: {
            assessmentId: extraAssessment.id,
            psychologistId: psychId,
            reportType: 'individual',
            reportData: {},
            status: 'DRAFT',
            recommendationsAI: `Mejorar el equilibrio trabajo-vida personal: establecer límites claros del horario laboral, fomentar el uso de tiempo libre para actividades recreativas y fortalecer la red de apoyo familiar y social del trabajador.`,
          },
        });

        totalAssessments++;
      }

      // ── STRESS (workers 0, 2, 3, 5) ───────────────────────────────
      if ([0, 2, 3, 5].includes(i)) {
        const stressDate = new Date(baseDate);
        stressDate.setDate(stressDate.getDate() + 4);
        const stressVal = Math.min(4, responseValue);
        const stressResponses = makeResponses(31, stressVal);

        // Determine gender and occupational group for stress baremos
        const gender = workersSpec[i].gender === 'F' ? 'F' : 'M';
        const group = ['JEFATURA', 'PROFESIONAL'].includes(workersSpec[i].level)
          ? 'profesionales_tecnicos'
          : 'auxiliares_operativos';

        const stressAssessment = await prisma.assessment.create({
          data: {
            workerId,
            psychologistId: psychId,
            organizationId: orgId,
            formType: formType as any,
            questionnaireType: 'STRESS',
            assessmentDate: stressDate,
            status: 'SCORED',
            completedAt: stressDate,
          },
        });

        await prisma.responseSet.create({
          data: {
            assessmentId: stressAssessment.id,
            responses: stressResponses,
            totalItems: 31,
            isComplete: true,
            submittedAt: stressDate,
          },
        });

        const stressScored = scoreQuestionnaire(stressResponses, formType as any, 'STRESS', {
          gender,
          occupationalGroup: group,
        });

        await prisma.scoredResult.create({
          data: {
            assessmentId: stressAssessment.id,
            dimensionScores: stressScored.dimensions as any,
            domainScores: stressScored.domains as any,
            totalScores: stressScored.total as any,
            overallRiskCategory: stressScored.total.riskCategory as any,
          },
        });

        await db.report.create({
          data: {
            assessmentId: stressAssessment.id,
            psychologistId: psychId,
            reportType: 'individual',
            reportData: {},
            status: 'DRAFT',
            recommendationsAI: `Implementar estrategias de manejo del estrés: sesiones de mindfulness, técnicas de respiración, actividad física regular y apoyo psicológico individual si los síntomas persisten o se agravan.`,
          },
        });

        totalAssessments++;
      }
    }

    log.push(`✅ ${totalAssessments} evaluaciones creadas con puntuaciones y reportes`);

    // ══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ══════════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      message: '🎉 Datos de prueba creados exitosamente',
      credentials: {
        admin: {
          email: 'admin@psicosst.com',
          password: 'Admin123456!',
          role: 'Administrador (isAdmin: true, status: ACTIVE)',
          note: 'Usa estas credenciales para iniciar sesión. Deberás configurar MFA en el primer ingreso.',
        },
        psicologa2: {
          email: 'psicologa2@psicosst.com',
          password: 'Psicologo123!',
          role: 'Psicóloga activa (status: ACTIVE)',
        },
        pendiente: {
          email: 'pendiente@psicosst.com',
          password: 'Pendiente123!',
          role: 'Pendiente de aprobación (status: PENDING)',
          note: 'Úsala para probar el flujo de aprobación desde el panel admin.',
        },
      },
      stats: {
        psychologists: { active: 2, pending: 1 },
        organizations: 2,
        workers: createdWorkers.length,
        assessments: totalAssessments,
      },
      log,
    });
  } catch (error) {
    console.error('[SEED-FULL] Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, log }, { status: 500 });
  }
}
