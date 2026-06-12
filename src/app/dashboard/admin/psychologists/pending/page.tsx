import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PendingPsychologistsTable from '@/components/admin/PendingPsychologistsTable';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Gestion de Psicologos</h2>
        <p className="text-sm text-muted-foreground">
          Aprueba o rechaza solicitudes de registro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-primary">{pendingPsychologists.length}</div>
          <p className="text-sm text-muted-foreground mt-1">Pendientes</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-emerald-600">{activePsychologists}</div>
          <p className="text-sm text-muted-foreground mt-1">Activos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center">
          <div className="text-3xl font-bold text-destructive">{rejectedPsychologists}</div>
          <p className="text-sm text-muted-foreground mt-1">Rechazados</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Solicitudes Pendientes</h3>
        {pendingPsychologists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay solicitudes pendientes.
          </div>
        ) : (
          <PendingPsychologistsTable psychologists={pendingPsychologists as any} />
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los psicologos solo pueden acceder a la plataforma despues de ser aprobados. Verifica la validez de la licencia antes de aprobar.
        </p>
      </div>
    </div>
  );
}
