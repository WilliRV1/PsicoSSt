import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PendingPsychologistsTable from '@/components/admin/PendingPsychologistsTable';
import { Card } from '@/components/ui';

export const revalidate = 0;

export default async function PendingPsychologistsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.psychologist.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) redirect('/dashboard');

  const pendingPsychologists = await prisma.psychologist.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  const activePsychologists = await prisma.psychologist.count({ where: { status: 'ACTIVE' } });
  const rejectedPsychologists = await prisma.psychologist.count({ where: { status: 'INACTIVE' } });

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#212121]">Gestión de Psicólogos</h1>
        <p className="text-[#666666] mt-1 text-sm">
          Aprueba o rechaza solicitudes de registro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#0051BA]">{pendingPsychologists.length}</div>
            <p className="text-sm text-[#666666] mt-1">Pendientes</p>
          </div>
        </Card>
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#4CAF50]">{activePsychologists}</div>
            <p className="text-sm text-[#666666] mt-1">Activos</p>
          </div>
        </Card>
        <Card variant="elevated">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#E53935]">{rejectedPsychologists}</div>
            <p className="text-sm text-[#666666] mt-1">Rechazados</p>
          </div>
        </Card>
      </div>

      <Card header="Solicitudes Pendientes" variant="elevated">
        {pendingPsychologists.length === 0 ? (
          <div className="text-center py-8 text-[#666666]">
            No hay solicitudes pendientes.
          </div>
        ) : (
          <PendingPsychologistsTable psychologists={pendingPsychologists as any} />
        )}
      </Card>

      <div className="bg-[#E3F2FD] border border-[#1E88E5] rounded-lg p-4">
        <p className="text-sm text-[#0051BA]">
          <strong>💡 Nota:</strong> Los psicólogos solo pueden acceder a la plataforma después de ser aprobados. Verifica la validez de la licencia antes de aprobar.
        </p>
      </div>
    </div>
  );
}
