'use client';

import React, { useState } from 'react';
import { Psychologist } from '@/generated/prisma';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, Loader2 } from 'lucide-react';

interface PendingPsychologistsTableProps {
  psychologists: Psychologist[];
}

export default function PendingPsychologistsTable({
  psychologists,
}: PendingPsychologistsTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPsychologist, setSelectedPsychologist] = useState<Psychologist | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatedList, setUpdatedList] = useState(psychologists);

  const handleApprove = async (psychologistId: string) => {
    if (!confirm('Aprobar este psicologo?')) return;

    setLoading(psychologistId);
    try {
      const response = await fetch('/api/admin/psychologists/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psychologistId, status: 'ACTIVE' }),
      });

      if (response.ok) {
        setUpdatedList((prev) => prev.filter((p) => p.id !== psychologistId));
      } else {
        alert('Error al aprobar el psicologo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (psychologistId: string) => {
    if (!confirm('Rechazar este psicologo? Esta accion no se puede deshacer.')) return;

    setLoading(psychologistId);
    try {
      const response = await fetch('/api/admin/psychologists/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psychologistId, status: 'INACTIVE' }),
      });

      if (response.ok) {
        setUpdatedList((prev) => prev.filter((p) => p.id !== psychologistId));
      } else {
        alert('Error al rechazar el psicologo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre Completo</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Licencia</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Solicitud</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {updatedList.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{p.fullName}</td>
                <td className="px-4 py-3 text-primary font-medium">{p.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.licenseNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setSelectedPsychologist(p); setShowDetailsModal(true); }}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    <Button
                      size="sm"
                      disabled={loading !== null}
                      onClick={() => handleApprove(p.id)}
                    >
                      {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={loading !== null}
                      onClick={() => handleReject(p.id)}
                    >
                      <X className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPsychologist && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Detalles del Psicologo</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-primary">Nombre Completo</p>
                <p className="text-foreground">{selectedPsychologist.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Email</p>
                <p className="text-foreground">{selectedPsychologist.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-primary">Licencia</p>
                  <p className="text-foreground">{selectedPsychologist.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Tarjeta Profesional</p>
                  <p className="text-foreground">{selectedPsychologist.professionalCard}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Credencial SST</p>
                <p className="text-foreground">{selectedPsychologist.sstCredential}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Fecha de Solicitud</p>
                <p className="text-foreground">
                  {new Date(selectedPsychologist.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  className="flex-1"
                  disabled={loading === selectedPsychologist.id}
                  onClick={() => { handleApprove(selectedPsychologist.id); setShowDetailsModal(false); }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {loading === selectedPsychologist.id ? 'Aprobando...' : 'Aprobar'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={loading === selectedPsychologist.id}
                  onClick={() => { handleReject(selectedPsychologist.id); setShowDetailsModal(false); }}
                >
                  <X className="w-4 h-4 mr-1" /> Rechazar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
