import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PendingPsychologistsTable from '@/components/admin/PendingPsychologistsTable';
import { Card } from '@/components/ui';

export const revalidate = 0; // Disable caching for admin panel

export default async function PendingPsychologistsPage() {
  const session = await getServerSession(authOptions);

  // Verify admin access
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.psychologist.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isAdmin) {
    redirect('/dashboard');
  }

  // Fetch pending psychologists
  const pendingPsychologists = await prisma.psychologist.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch approved psychologists count
  const activePsychologists = await prisma.psychologist.count({
    where: { status: 'ACTIVE' },
  });

  const rejectedPsychologists = await prisma.psychologist.count({
    where: { status: 'INACTIVE' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#212121]">Gestión de Psicólogos</h1>
        <p className="text-[#666666] mt-2">
          Aprueba o rechaza solicitudes de registro de nuevos psicólogos
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#0051BA]">
              {pendingPsychologists.length}
            </div>
            <p className="text-sm text-[#666666] mt-2">Pendientes de aprobación</p>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#4CAF50]">
              {activePsychologists}
            </div>
            <p className="text-sm text-[#666666] mt-2">Psicólogos activos</p>
          </div>
        </Card>

        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#E53935]">
              {rejectedPsychologists}
            </div>
            <p className="text-sm text-[#666666] mt-2">Rechazados</p>
          </div>
        </Card>
      </div>

      {/* Pending Psychologists Table */}
      <Card header="Solicitudes Pendientes" variant="elevated">
        {pendingPsychologists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#666666]">
              No hay solicitudes pendientes en este momento
            </p>
          </div>
        ) : (
          <PendingPsychologistsTable psychologists={pendingPsychologists} />
        )}
      </Card>

      {/* Help Text */}
      <div className="bg-[#E3F2FD] border border-[#1E88E5] rounded-lg p-4">
        <p className="text-sm text-[#0051BA]">
          <strong>💡 Nota:</strong> Los psicólogos solo podrán acceder a la plataforma después
          de ser aprobados. Verifica que los datos de licencia sean válidos antes de
          aprobar.
        </p>
      </div>
    </div>
  );
}
