'use client';

import React, { useState } from 'react';
import { Psychologist } from '@prisma/client';
import { Table, Button, Modal } from '@/components/ui';
import { Check, X, Eye, Loader2 } from 'lucide-react';

interface PendingPsychologistsTableProps {
  psychologists: Psychologist[];
}

export default function PendingPsychologistsTable({
  psychologists,
}: PendingPsychologistsTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Psychologist | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatedList, setUpdatedList] = useState(psychologists);

  const handleApprove = async (psychologistId: string) => {
    if (!confirm('¿Aprobar este psicólogo?')) return;

    setLoading(psychologistId);
    try {
      const response = await fetch('/api/admin/psychologists/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId,
          status: 'ACTIVE',
        }),
      });

      if (response.ok) {
        // Remove from list
        setUpdatedList((prev) =>
          prev.filter((p) => p.id !== psychologistId)
        );
      } else {
        alert('Error al aprobar el psicólogo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (psychologistId: string) => {
    if (!confirm('¿Rechazar este psicólogo? Esta acción no se puede deshacer.'))
      return;

    setLoading(psychologistId);
    try {
      const response = await fetch('/api/admin/psychologists/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId,
          status: 'INACTIVE',
        }),
      });

      if (response.ok) {
        // Remove from list
        setUpdatedList((prev) =>
          prev.filter((p) => p.id !== psychologistId)
        );
      } else {
        alert('Error al rechazar el psicólogo');
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
      <Table<Psychologist>
        columns={[
          {
            key: 'fullName',
            header: 'Nombre Completo',
            width: '25%',
          },
          {
            key: 'email',
            header: 'Email',
            width: '25%',
            render: (value) => <span className="text-[#0051BA] font-medium">{value}</span>,
          },
          {
            key: 'licenseNumber',
            header: 'Licencia',
            width: '20%',
          },
          {
            key: 'createdAt',
            header: 'Fecha Solicitud',
            width: '15%',
            render: (value) => {
              const date = new Date(value);
              return date.toLocaleDateString('es-CO');
            },
          },
          {
            key: 'id',
            header: 'Acciones',
            width: '15%',
            render: (value, row) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => {
                    setSelectedPsychologist(row);
                    setShowDetailsModal(true);
                  }}
                >
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={
                    loading === value ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                  }
                  disabled={loading !== null}
                  onClick={() => handleApprove(value)}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<X className="w-4 h-4" />}
                  disabled={loading !== null}
                  onClick={() => handleReject(value)}
                >
                  Rechazar
                </Button>
              </div>
            ),
          },
        ]}
        data={updatedList}
        keyField="id"
      />

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del Psicólogo"
        size="md"
      >
        {selectedPsychologist && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[#0051BA]">Nombre Completo</p>
              <p className="text-[#212121]">{selectedPsychologist.fullName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#0051BA]">Email</p>
              <p className="text-[#212121]">{selectedPsychologist.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-[#0051BA]">Licencia</p>
                <p className="text-[#212121]">{selectedPsychologist.licenseNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0051BA]">Tarjeta Profesional</p>
                <p className="text-[#212121]">{selectedPsychologist.professionalCard}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#0051BA]">Credencial SST</p>
              <p className="text-[#212121]">{selectedPsychologist.sstCredential}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#0051BA]">Fecha de Solicitud</p>
              <p className="text-[#212121]">
                {new Date(selectedPsychologist.createdAt).toLocaleDateString(
                  'es-CO',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-[#E8E8E8]">
              <Button
                variant="primary"
                fullWidth
                icon={<Check className="w-4 h-4" />}
                disabled={loading === selectedPsychologist.id}
                onClick={() => {
                  handleApprove(selectedPsychologist.id);
                  setShowDetailsModal(false);
                }}
              >
                {loading === selectedPsychologist.id
                  ? 'Aprobando...'
                  : 'Aprobar'}
              </Button>
              <Button
                variant="danger"
                fullWidth
                icon={<X className="w-4 h-4" />}
                disabled={loading === selectedPsychologist.id}
                onClick={() => {
                  handleReject(selectedPsychologist.id);
                  setShowDetailsModal(false);
                }}
              >
                Rechazar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
