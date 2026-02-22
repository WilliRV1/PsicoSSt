'use client';

import React, { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Button, Card, FormInput } from '@/components/ui';
import { Upload, Trash2, Save, Loader2 } from 'lucide-react';

interface Signature {
  type: 'drawn' | 'uploaded';
  data?: string;
  fileName?: string;
  uploadedAt?: string;
}

export default function SignatureSection() {
  const [signatures, setSignatures] = useState<Record<string, Signature | null>>({
    drawn: null,
    uploaded: null,
  });
  const [activeTab, setActiveTab] = useState<'drawn' | 'uploaded'>('drawn');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Drawn signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Load signatures on mount
  useEffect(() => {
    const loadSignatures = async () => {
      try {
        const response = await fetch('/api/profile/signature');
        if (response.ok) {
          const data = await response.json();
          setSignatures({
            drawn: data.drawn || null,
            uploaded: data.uploaded || null,
          });
        }
      } catch (error) {
        console.error('Error loading signatures:', error);
      }
    };

    loadSignatures();
  }, []);

  // Initialize signature pad
  useEffect(() => {
    if (activeTab === 'drawn' && canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      // Set canvas resolution
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 81, 186)',
      });

      // Load existing drawn signature if available
      if (signatures.drawn?.data) {
        signaturePadRef.current.fromDataURL(signatures.drawn.data);
      }
    }
  }, [activeTab, signatures.drawn?.data]);

  // Handle drawn signature save
  const handleSaveDrawnSignature = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setMessage({ type: 'error', text: 'Please draw your signature' });
      return;
    }

    setLoading(true);
    try {
      const dataUrl = signaturePadRef.current.toDataURL();
      const response = await fetch('/api/profile/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureType: 'drawn',
          dataUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSignatures((prev) => ({
          ...prev,
          drawn: {
            type: 'drawn',
            data: dataUrl,
            uploadedAt: new Date().toISOString(),
          },
        }));
        setMessage({ type: 'success', text: 'Signature saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save signature' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving signature' });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG and PNG files are allowed' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);

      setLoading(true);
      try {
        const response = await fetch('/api/profile/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signatureType: 'uploaded',
            imageUrl: base64,
            fileName: file.name,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSignatures((prev) => ({
            ...prev,
            uploaded: {
              type: 'uploaded',
              data: base64,
              fileName: file.name,
              uploadedAt: new Date().toISOString(),
            },
          }));
          setMessage({ type: 'success', text: 'Signature uploaded successfully' });
        } else {
          setMessage({ type: 'error', text: 'Failed to upload signature' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error uploading signature' });
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Handle delete signature
  const handleDeleteSignature = async (type: 'drawn' | 'uploaded') => {
    if (!confirm(`Delete ${type} signature?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/profile/signature?signatureType=${type}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSignatures((prev) => ({
          ...prev,
          [type]: null,
        }));
        if (type === 'drawn') {
          signaturePadRef.current?.clear();
        } else {
          setPreviewUrl('');
        }
        setMessage({ type: 'success', text: `${type} signature deleted` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting signature' });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle clear drawn signature (without deleting)
  const handleClearDrawnSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <Card header="Firma Digital" variant="elevated">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E8E8E8]">
          {(['drawn', 'uploaded'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 font-medium text-sm border-b-2 transition-colors
                ${
                  activeTab === tab
                    ? 'border-[#0051BA] text-[#0051BA]'
                    : 'border-transparent text-[#666666] hover:text-[#212121]'
                }
              `}
            >
              {tab === 'drawn' ? '✏️ Dibujar' : '📤 Subir imagen'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-3 rounded text-sm ${
              message.type === 'success'
                ? 'bg-[#C8E6C9] text-[#2E7D32]'
                : 'bg-[#FFCDD2] text-[#B71C1C]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Drawn Signature Tab */}
        {activeTab === 'drawn' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">
                Dibuja tu firma
              </label>
              <canvas
                ref={canvasRef}
                className="border-2 border-dashed border-[#0051BA] rounded-lg w-full h-48 bg-white cursor-crosshair"
              />
              <p className="text-xs text-[#666666] mt-2">
                Usa el ratón o dispositivo táctil para dibujar tu firma
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleClearDrawnSignature}
                disabled={loading}
              >
                Borrar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveDrawnSignature}
                disabled={loading}
                icon={loading ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              >
                {loading ? 'Guardando...' : 'Guardar firma'}
              </Button>
              {signatures.drawn && (
                <Button
                  variant="danger"
                  onClick={() => handleDeleteSignature('drawn')}
                  disabled={loading}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Eliminar
                </Button>
              )}
            </div>

            {signatures.drawn && (
              <div className="p-3 bg-[#F5F5F5] rounded">
                <p className="text-sm text-[#666666] mb-2">Firma guardada</p>
                <img
                  src={signatures.drawn.data}
                  alt="Firma guardada"
                  className="max-h-20 border border-[#E8E8E8] rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Upload Signature Tab */}
        {activeTab === 'uploaded' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">
                Sube tu firma (JPG o PNG)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png"
                disabled={loading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full p-8 border-2 border-dashed border-[#0051BA] rounded-lg hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-[#0051BA]" />
                  <span className="text-sm font-medium text-[#0051BA]">
                    Haz clic para seleccionar archivo
                  </span>
                  <span className="text-xs text-[#666666]">
                    JPG o PNG, máx. 5MB
                  </span>
                </div>
              </button>
            </div>

            {previewUrl && (
              <div className="p-3 bg-[#F5F5F5] rounded">
                <p className="text-sm text-[#666666] mb-2">Vista previa</p>
                <img
                  src={previewUrl}
                  alt="Firma"
                  className="max-h-32 border border-[#E8E8E8] rounded"
                />
              </div>
            )}

            <div className="flex gap-2">
              {signatures.uploaded && (
                <Button
                  variant="danger"
                  onClick={() => handleDeleteSignature('uploaded')}
                  disabled={loading}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Eliminar
                </Button>
              )}
            </div>

            {signatures.uploaded && (
              <div className="p-3 bg-[#C8E6C9] rounded text-sm text-[#2E7D32]">
                ✓ Firma guardada
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
