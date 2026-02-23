/**
 * PsicoSST — Seed de datos de prueba
 * Ejecutar: npx tsx prisma/seed.ts
 *
 * Crea:
 *   - 1 psicólogo admin (admin@psicosst.com / Admin123456!)
 *   - 1 psicólogo activo adicional (psicologa2@psicosst.com / Psicologo123!)
 *   - 1 psicólogo pendiente de aprobación (pendiente@psicosst.com / Pendiente123!)
 *   - 2 organizaciones (empresa tech + constructora)
 *   - 6 trabajadores con perfiles demográficos completos
 *   - 11 evaluaciones (intralaboral/extralaboral/estrés) con diferentes niveles de riesgo
 *   - Resultados puntuados (ScoredResult) para cada evaluación
 *   - Informes (Report) con recomendaciones IA de ejemplo
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env and .env.local (if exists)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Prisma with pg adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResponses(count: number, value: number): Record<string, number> {
  const v = Math.max(0, Math.min(4, value));
  const r: Record<string, number> = {};
  for (let i = 1; i <= count; i++) r[String(i)] = v;
  return r;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Pre-calculated scored results for different risk levels
// (matches what the scoring engine would produce for uniform response values)
type RiskCat = 'SIN_RIESGO' | 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY_ALTO';

interface ScoreBlock {
  rawScore: number;
  maxPossible: number;
  transformedScore: number;
  riskCategory: RiskCat;
  riskLevel: number;
}

function buildTotalScore(pct: number): ScoreBlock {
  const cats: RiskCat[] = ['SIN_RIESGO', 'BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO'];
  let cat: RiskCat;
  if (pct < 20) cat = 'SIN_RIESGO';
  else if (pct < 40) cat = 'BAJO';
  else if (pct < 60) cat = 'MEDIO';
  else if (pct < 80) cat = 'ALTO';
  else cat = 'MUY_ALTO';
  return { rawScore: Math.round(pct * 4.92), maxPossible: 492, transformedScore: pct, riskCategory: cat, riskLevel: cats.indexOf(cat) + 1 };
}

/** Simplified scored result — suitable for dashboard charts */
function makeScoredResult(val: number, questionnaireType: string, formType: string) {
  // Map responseValue (0-4) to a transformed percentage (0-100)
  // responseValue=0 → ~5% (SIN_RIESGO), 1 → ~25% (BAJO), 2 → ~50% (MEDIO), 3 → ~75% (ALTO), 4 → ~92% (MUY_ALTO)
  const pctMap: Record<number, number> = { 0: 5, 1: 25, 2: 50, 3: 75, 4: 92 };
  const pct = pctMap[val] ?? 50;
  const total = buildTotalScore(pct);

  // Create 4 sample dimensions at slightly different percentages
  const dimPcts = [pct - 8, pct - 3, pct + 3, pct + 8].map(p => Math.max(0, Math.min(100, p)));

  const dimensionScores: Record<string, object> = {};
  const domainScores: Record<string, object> = {};

  if (questionnaireType === 'INTRALABORAL') {
    const dims = formType === 'A'
      ? ['liderazgo_caracteristicas', 'relaciones_sociales', 'retroalimentacion_desempeno', 'claridad_rol', 'capacitacion', 'control_autonomia', 'demandas_cuantitativas', 'demandas_emocionales', 'demandas_carga_mental', 'demandas_jornada', 'reconocimiento_compensacion', 'recompensas_pertenencia']
      : ['liderazgo_caracteristicas', 'relaciones_sociales', 'retroalimentacion_desempeno', 'claridad_rol', 'capacitacion', 'control_autonomia', 'demandas_cuantitativas', 'demandas_carga_mental', 'demandas_jornada', 'reconocimiento_compensacion'];
    dims.forEach((key, i) => {
      const p = Math.max(0, Math.min(100, pct + (i % 3 === 0 ? -10 : i % 3 === 1 ? 5 : 0)));
      dimensionScores[key] = { ...buildTotalScore(p), dimensionKey: key };
    });

    const domains = [
      { key: 'liderazgo_relaciones', dims: dims.slice(0, 3) },
      { key: 'control_trabajo', dims: dims.slice(3, 6) },
      { key: 'demandas_trabajo', dims: dims.slice(6, dims.length - 2) },
      { key: 'recompensa', dims: dims.slice(-2) },
    ];
    domains.forEach(d => {
      domainScores[d.key] = { ...buildTotalScore(pct + (d.dims.length % 2 === 0 ? 2 : -2)), domainKey: d.key };
    });
  } else if (questionnaireType === 'EXTRALABORAL') {
    const dims = ['tiempo_fuera_trabajo', 'relaciones_familiares', 'comunicacion_relaciones', 'situacion_economica', 'caracteristicas_vivienda', 'influencia_entorno', 'desplazamiento'];
    dims.forEach((key, i) => {
      const p = Math.max(0, Math.min(100, pct + (i % 3 === 0 ? -8 : i % 3 === 1 ? 4 : -2)));
      dimensionScores[key] = { ...buildTotalScore(p), dimensionKey: key };
    });
  } else {
    // STRESS
    const dims = ['sintomas_fisiologicos', 'sintomas_sociales', 'sintomas_laborales', 'sintomas_psicoemocionales'];
    dims.forEach((key, i) => {
      const p = Math.max(0, Math.min(100, pct + (i % 2 === 0 ? 5 : -5)));
      dimensionScores[key] = { ...buildTotalScore(p), dimensionKey: key };
    });
  }

  return { dimensionScores, domainScores, totalScores: total, overallRiskCategory: total.riskCategory };
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed de PsicoSST...\n');

  // ── 1. Psychologists ─────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123456!', 12);
  const psy2Hash = await bcrypt.hash('Psicologo123!', 12);
  const pendingHash = await bcrypt.hash('Pendiente123!', 12);

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
  console.log(`✅ Admin: ${admin.email}`);

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
  console.log(`✅ Psicóloga 2: ${psy2.email}`);

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
  console.log(`✅ Pendiente: ${pending.email} (status: PENDING)`);

  // ── 2. Signature for admin ────────────────────────────────────────────────
  // A real 32x32 white PNG as base64 placeholder
  const signaturePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU5ErkJggg==';
  await prisma.psychologistSignature.upsert({
    where: { psychologistId_signatureType: { psychologistId: admin.id, signatureType: 'drawn' } },
    update: { dataUrl: signaturePng },
    create: { psychologistId: admin.id, signatureType: 'drawn', dataUrl: signaturePng },
  });
  console.log('✅ Firma del admin registrada');

  // ── 3. Organizations ──────────────────────────────────────────────────────
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
  console.log(`✅ Organizaciones: "${org1.name}" y "${org2.name}"`);

  // ── 4. Workers ────────────────────────────────────────────────────────────
  // responseValue: 0=SIN_RIESGO, 1=BAJO, 2=MEDIO, 3=ALTO, 4=MUY_ALTO
  // formType: 'A' for professional/leadership, 'B' for technical/operational
  const workersSpec = [
    /* TechSolutions — org1 */
    {
      docType: 'CC', docId: '79876543',
      name: 'Carlos Andrés Herrera López',
      gender: 'M', birth: '1985-03-15', marital: 'CASADO',
      edu: 'PROFESIONAL', title: 'Gerente de Tecnología', level: 'JEFATURA',
      city: 'Bogotá', stratum: 4, housing: 'PROPIA', deps: 2,
      transport: 'VEHICULO_PARTICULAR', commute: 30, customer: true,
      dept: 'Dirección de Tecnología', yearsOrg: 8, yearsPos: 3,
      contract: 'Término Indefinido', schedule: 'Diurno', hours: 45,
      freeTime: ['FAMILIA', 'DEPORTE'] as string[],
      orgId: org1.id, formType: 'A', rv: 0, psychId: admin.id, // SIN_RIESGO
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
      freeTime: ['ESTUDIO', 'RECREACION'] as string[],
      orgId: org1.id, formType: 'A', rv: 2, psychId: admin.id, // MEDIO
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
      freeTime: ['RECREACION', 'DESCANSO'] as string[],
      orgId: org1.id, formType: 'A', rv: 3, psychId: admin.id, // ALTO
    },
    /* Constructora — org2 */
    {
      docType: 'CC', docId: '71234567',
      name: 'Roberto Carlos Jiménez Cano',
      gender: 'M', birth: '1978-05-20', marital: 'CASADO',
      edu: 'BACHILLERATO', title: 'Operario de Construcción', level: 'OPERATIVO',
      city: 'Medellín', stratum: 1, housing: 'ARRENDADA', deps: 3,
      transport: 'TRANSPORTE_PUBLICO', commute: 45, customer: false,
      dept: 'Obras Civiles', yearsOrg: 10, yearsPos: 10,
      contract: 'Obra y Labor', schedule: 'Diurno', hours: 48,
      freeTime: ['FAMILIA', 'DESCANSO'] as string[],
      orgId: org2.id, formType: 'B', rv: 4, psychId: admin.id, // MUY_ALTO
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
      freeTime: ['FAMILIA', 'OTRO'] as string[],
      orgId: org2.id, formType: 'B', rv: 1, psychId: psy2.id, // BAJO
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
      freeTime: ['DESCANSO', 'FAMILIA'] as string[],
      orgId: org2.id, formType: 'B', rv: 3, psychId: psy2.id, // ALTO
    },
  ];

  const createdWorkers: { worker: any; spec: typeof workersSpec[0] }[] = [];

  for (const w of workersSpec) {
    const worker = await prisma.worker.upsert({
      where: {
        documentType_documentId_organizationId: {
          documentType: w.docType,
          documentId: w.docId,
          organizationId: w.orgId,
        },
      },
      update: {},
      create: {
        documentType: w.docType,
        documentId: w.docId,
        fullName: w.name,
        gender: w.gender,
        birthDate: new Date(w.birth),
        maritalStatus: w.marital,
        educationLevel: w.edu,
        jobTitle: w.title,
        jobLevel: w.level,
        residenceCity: w.city,
        socioeconomicStratum: w.stratum,
        housingType: w.housing,
        dependentsCount: w.deps,
        freeTimeUsage: w.freeTime,
        transportMeans: w.transport,
        displacementTime: w.commute,
        hasCustomerInteraction: w.customer,
        departmentArea: w.dept,
        yearsInCompany: w.yearsOrg,
        yearsInPosition: w.yearsPos,
        contractType: w.contract,
        workSchedule: w.schedule,
        hoursPerWeek: w.hours,
        organizationId: w.orgId,
      },
    });
    createdWorkers.push({ worker, spec: w });
    console.log(`  👤 ${w.name} (${w.level})`);
  }
  console.log(`✅ ${createdWorkers.length} trabajadores creados`);

  // ── 5. Assessments + Scores + Reports ─────────────────────────────────────
  const aiRecommendations = [
    `Fortalecer el liderazgo participativo, implementar pausas activas y revisar la carga laboral para prevenir el agotamiento. Reuniones de retroalimentación quincenales ayudarán a mejorar la comunicación.`,
    `Diseñar un programa de bienestar que incluya actividades de integración de equipo, sesiones de mindfulness y clarificación de roles para reducir la ambigüedad laboral.`,
    `Redistribuir la carga de trabajo, establecer prioridades claras y proporcionar herramientas de gestión del tiempo. Evaluar la posibilidad de turnos alternativos para reducir el estrés.`,
    `Intervención inmediata requerida: reducir horas extras, ajustar condiciones físicas del ambiente de trabajo, asignar apoyo psicosocial individualizado y remitir al médico laboral.`,
    `El trabajador presenta factores protectores sólidos. Mantener las condiciones actuales, promover el reconocimiento de logros y garantizar la continuidad de los beneficios actuales.`,
    `Revisar la ergonomía del puesto de trabajo, implementar rotación de tareas, fomentar el apoyo entre compañeros y fortalecer la comunicación con los superiores inmediatos.`,
  ];

  const reportStatuses = ['DRAFT', 'REVIEWED', 'SIGNED', 'DRAFT', 'REVIEWED', 'DRAFT'];
  let totalAssessments = 0;

  for (let i = 0; i < createdWorkers.length; i++) {
    const { worker, spec } = createdWorkers[i];
    const baseDate = daysAgo(90 - i * 12);

    // ── INTRALABORAL ─────────────────────────────────────────────────────
    const intraItems = spec.formType === 'A' ? 123 : 97;
    const intraResponses = makeResponses(intraItems, spec.rv);
    const intraScored = makeScoredResult(spec.rv, 'INTRALABORAL', spec.formType);

    const intraA = await prisma.assessment.create({
      data: {
        workerId: worker.id,
        psychologistId: spec.psychId,
        organizationId: spec.orgId,
        formType: spec.formType,
        questionnaireType: 'INTRALABORAL',
        assessmentDate: baseDate,
        status: 'SCORED',
        completedAt: baseDate,
      },
    });
    await prisma.responseSet.create({
      data: {
        assessmentId: intraA.id,
        responses: intraResponses,
        totalItems: intraItems,
        isComplete: true,
        submittedAt: baseDate,
      },
    });
    await prisma.scoredResult.create({
      data: {
        assessmentId: intraA.id,
        dimensionScores: intraScored.dimensionScores,
        domainScores: intraScored.domainScores,
        totalScores: intraScored.totalScores,
        overallRiskCategory: intraScored.overallRiskCategory,
      },
    });
    const rStatus = reportStatuses[i % reportStatuses.length];
    await prisma.report.create({
      data: {
        assessmentId: intraA.id,
        psychologistId: spec.psychId,
        reportType: 'individual',
        reportData: { type: 'INTRALABORAL', completedAt: baseDate.toISOString() },
        status: rStatus,
        recommendationsAI: aiRecommendations[i % aiRecommendations.length],
        ...(rStatus === 'SIGNED' ? { signedBy: admin.email, signedAt: new Date(), isFinalized: true } : {}),
      },
    });
    totalAssessments++;

    // ── EXTRALABORAL (workers 0, 1, 3, 4) ───────────────────────────────
    if ([0, 1, 3, 4].includes(i)) {
      const extraDate = new Date(baseDate);
      extraDate.setDate(extraDate.getDate() + 2);
      const extraVal = Math.min(4, spec.rv + 1);
      const extraResponses = makeResponses(31, extraVal);
      const extraScored = makeScoredResult(extraVal, 'EXTRALABORAL', spec.formType);

      const extraA = await prisma.assessment.create({
        data: {
          workerId: worker.id,
          psychologistId: spec.psychId,
          organizationId: spec.orgId,
          formType: spec.formType,
          questionnaireType: 'EXTRALABORAL',
          assessmentDate: extraDate,
          status: 'SCORED',
          completedAt: extraDate,
        },
      });
      await prisma.responseSet.create({
        data: { assessmentId: extraA.id, responses: extraResponses, totalItems: 31, isComplete: true, submittedAt: extraDate },
      });
      await prisma.scoredResult.create({
        data: {
          assessmentId: extraA.id,
          dimensionScores: extraScored.dimensionScores,
          domainScores: extraScored.domainScores,
          totalScores: extraScored.totalScores,
          overallRiskCategory: extraScored.overallRiskCategory,
        },
      });
      await prisma.report.create({
        data: {
          assessmentId: extraA.id,
          psychologistId: spec.psychId,
          reportType: 'individual',
          reportData: { type: 'EXTRALABORAL' },
          status: 'DRAFT',
          recommendationsAI: `Mejorar el equilibrio trabajo-vida personal: establecer límites claros del horario laboral y fortalecer la red de apoyo familiar.`,
        },
      });
      totalAssessments++;
    }

    // ── STRESS (workers 0, 2, 3, 5) ─────────────────────────────────────
    if ([0, 2, 3, 5].includes(i)) {
      const stressDate = new Date(baseDate);
      stressDate.setDate(stressDate.getDate() + 4);
      const stressVal = spec.rv;
      const stressResponses = makeResponses(31, stressVal);
      const stressScored = makeScoredResult(stressVal, 'STRESS', spec.formType);

      const stressA = await prisma.assessment.create({
        data: {
          workerId: worker.id,
          psychologistId: spec.psychId,
          organizationId: spec.orgId,
          formType: spec.formType,
          questionnaireType: 'STRESS',
          assessmentDate: stressDate,
          status: 'SCORED',
          completedAt: stressDate,
        },
      });
      await prisma.responseSet.create({
        data: { assessmentId: stressA.id, responses: stressResponses, totalItems: 31, isComplete: true, submittedAt: stressDate },
      });
      await prisma.scoredResult.create({
        data: {
          assessmentId: stressA.id,
          dimensionScores: stressScored.dimensionScores,
          domainScores: stressScored.domainScores,
          totalScores: stressScored.totalScores,
          overallRiskCategory: stressScored.overallRiskCategory,
        },
      });
      await prisma.report.create({
        data: {
          assessmentId: stressA.id,
          psychologistId: spec.psychId,
          reportType: 'individual',
          reportData: { type: 'STRESS' },
          status: 'DRAFT',
          recommendationsAI: `Implementar estrategias de manejo del estrés: sesiones de mindfulness, técnicas de respiración y apoyo psicológico individual si los síntomas persisten.`,
        },
      });
      totalAssessments++;
    }
  }

  console.log(`✅ ${totalAssessments} evaluaciones creadas con puntuaciones y reportes`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  🎉  SEED COMPLETADO EXITOSAMENTE');
  console.log('════════════════════════════════════════════════════════');
  console.log('\n🔑 CREDENCIALES DE ACCESO:');
  console.log('  📧 Admin:      admin@psicosst.com      🔑 Admin123456!');
  console.log('  📧 Psicóloga:  psicologa2@psicosst.com 🔑 Psicologo123!');
  console.log('  📧 Pendiente:  pendiente@psicosst.com  🔑 Pendiente123!');
  console.log('\n  ⚠️  Nota: En el primer login, deberás configurar MFA (2FA).');
  console.log('       Descarga Google Authenticator y escanea el QR.\n');
  console.log('📊 DATOS CREADOS:');
  console.log(`  • 3 psicólogos (1 admin, 1 activo, 1 pendiente)`);
  console.log(`  • 2 organizaciones`);
  console.log(`  • 6 trabajadores`);
  console.log(`  • ${totalAssessments} evaluaciones con diferentes niveles de riesgo`);
  console.log(`  • Riesgos: SIN_RIESGO ▸ BAJO ▸ MEDIO ▸ ALTO ▸ MUY_ALTO`);
  console.log('════════════════════════════════════════════════════════\n');
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
