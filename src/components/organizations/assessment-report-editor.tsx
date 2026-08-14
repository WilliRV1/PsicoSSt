'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, FileText, CheckCircle } from 'lucide-react';

interface AssessmentReportEditorProps {
  organizationId: string;
  year: number;
}

export function AssessmentReportEditor({ organizationId, year }: AssessmentReportEditorProps) {
  const [fieldFindings, setFieldFindings] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/organizations/${organizationId}/reports?year=${year}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setFieldFindings(data[0].fieldFindings || '');
            setStatus(data[0].status || 'DRAFT');
          }
        }
      } catch (e) {
        console.error('Error loading report', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [organizationId, year]);

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true);
    const newStatus = publish ? 'PUBLISHED' : 'DRAFT';
    try {
      const res = await fetch(`/api/organizations/${organizationId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          fieldFindings,
          status: newStatus
        })
      });
      
      if (res.ok) {
        setStatus(newStatus);
        toast.success(publish ? 'Hallazgos publicados con éxito' : 'Hallazgos guardados como borrador');
      } else {
        toast.error('Error al guardar los hallazgos');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Triangulación Cualitativa (Hallazgos de Campo) - {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-slate-500 mb-2">
            Describa los hallazgos observacionales, entrevistas y otros métodos cualitativos que complementan la evaluación psicométrica cuantitativa. Esto se integrará en el Informe Técnico.
          </p>
          <Textarea 
            value={fieldFindings}
            onChange={(e) => setFieldFindings(e.target.value)}
            placeholder="Ej: Se observó alta tensión durante las entrevistas grupales en el área operativa. Los trabajadores manifestaron sobrecarga por rotación de turnos..."
            className="min-h-[200px]"
            disabled={isLoading || status === 'PUBLISHED'}
          />
        </div>
        {status === 'PUBLISHED' && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Estos hallazgos ya han sido publicados y consolidados.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-slate-500">
          Estado actual: <span className="font-semibold">{status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}</span>
        </div>
        <div className="flex gap-2">
          {status !== 'PUBLISHED' && (
            <>
              <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving || isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Borrador
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving || isLoading || fieldFindings.length < 10}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar y Publicar
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
