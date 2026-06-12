"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileDown,
} from "lucide-react";

interface Action {
  id: string;
  measure: string;
  responsible: string;
  dueDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  riskCategory: string | null;
  area: string | null;
  notes: string | null;
}

interface Plan {
  id: string;
  title: string;
  period: string;
  status: string;
  actions: Action[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En ejecución",
  DONE: "Cumplido",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border border-blue-200",
  DONE: "bg-green-100 text-green-800 border border-green-200",
  CANCELLED: "bg-gray-100 text-gray-600 border border-gray-200",
};

const STATUS_CYCLE: Record<string, "PENDING" | "IN_PROGRESS" | "DONE"> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PENDING",
};

const RISK_LABELS: Record<string, string> = {
  SIN_RIESGO: "Sin Riesgo",
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
  MUY_ALTO: "Muy Alto",
};

const RISK_COLORS: Record<string, string> = {
  SIN_RIESGO: "bg-green-100 text-green-800 border border-green-200",
  BAJO: "bg-lime-100 text-lime-800 border border-lime-200",
  MEDIO: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  ALTO: "bg-orange-100 text-orange-800 border border-orange-200",
  MUY_ALTO: "bg-red-100 text-red-800 border border-red-200",
};

const PLAN_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border border-gray-200",
};

const PLAN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  CLOSED: "Cerrado",
};

const emptyAction = {
  measure: "",
  responsible: "",
  dueDate: "",
  riskCategory: "",
  area: "",
  notes: "",
};

export default function InterventionPlanPanel({ orgId }: { orgId: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("Plan de Intervención Psicosocial");
  const [newPlanPeriod, setNewPlanPeriod] = useState("2025");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState({ ...emptyAction });
  const [savingAction, setSavingAction] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetch(`/api/organizations/${orgId}/intervention-plan`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orgId]);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setCreatingPlan(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/intervention-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPlanTitle, period: newPlanPeriod }),
      });
      const created = await res.json();
      setPlan(created);
      setShowNewPlanForm(false);
    } finally {
      setCreatingPlan(false);
    }
  }

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setSavingAction(true);
    try {
      const body: Record<string, string> = {
        planId: plan.id,
        measure: newAction.measure,
        responsible: newAction.responsible,
      };
      if (newAction.dueDate) body.dueDate = newAction.dueDate;
      if (newAction.riskCategory) body.riskCategory = newAction.riskCategory;
      if (newAction.area) body.area = newAction.area;
      if (newAction.notes) body.notes = newAction.notes;

      const res = await fetch("/api/intervention-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const action: Action = await res.json();
      setPlan((prev) =>
        prev ? { ...prev, actions: [...prev.actions, action] } : prev
      );
      setNewAction({ ...emptyAction });
      setShowAddAction(false);
    } finally {
      setSavingAction(false);
    }
  }

  async function handleToggleStatus(action: Action) {
    if (action.status === "CANCELLED") return;
    const nextStatus = STATUS_CYCLE[action.status];
    if (!nextStatus) return;
    setUpdatingId(action.id);
    try {
      await fetch(`/api/intervention-actions/${action.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              actions: prev.actions.map((a) =>
                a.id === action.id ? { ...a, status: nextStatus } : a
              ),
            }
          : prev
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const handleDownloadPDF = async () => {
    if (!plan) return;
    setDownloadingPDF(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/intervention-plan/pdf`);
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plan-intervencion.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al generar el PDF del plan");
    } finally {
      setDownloadingPDF(false);
    }
  };

  async function handleDeleteAction(actionId: string) {
    setUpdatingId(actionId);
    try {
      await fetch(`/api/intervention-actions/${actionId}`, {
        method: "DELETE",
      });
      setPlan((prev) =>
        prev
          ? { ...prev, actions: prev.actions.filter((a) => a.id !== actionId) }
          : prev
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex items-center gap-3 text-muted-foreground text-sm">
        <Clock className="w-4 h-4 animate-spin" />
        Cargando plan de intervención…
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm p-6">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="rounded-full bg-muted p-4">
            <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-base">Sin plan de intervención</p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta organización aún no tiene un plan de intervención registrado.
            </p>
          </div>

          {!showNewPlanForm ? (
            <button
              onClick={() => setShowNewPlanForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear Plan de Intervención
            </button>
          ) : (
            <form
              onSubmit={handleCreatePlan}
              className="w-full max-w-md bg-muted/50 rounded-xl border border-border p-5 text-left flex flex-col gap-4"
            >
              <p className="font-semibold text-sm">Nuevo plan</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Título
                </label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Período
                </label>
                <input
                  type="text"
                  value={newPlanPeriod}
                  onChange={(e) => setNewPlanPeriod(e.target.value)}
                  required
                  placeholder="Ej: 2025"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewPlanForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPlan}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {creatingPlan ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Crear plan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">{plan.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Período: {plan.period}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  PLAN_STATUS_COLORS[plan.status] ??
                  "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <FileDown className="h-3.5 w-3.5" />
            {downloadingPDF ? "Generando..." : "Exportar PDF"}
          </button>
          <button
            onClick={() => setShowAddAction((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar medida
          </button>
        </div>
      </div>

      {/* Add action form */}
      {showAddAction && (
        <form
          onSubmit={handleAddAction}
          className="border-b border-border bg-muted/40 px-5 py-5 flex flex-col gap-4"
        >
          <p className="text-sm font-semibold">Nueva medida de intervención</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Medida <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newAction.measure}
                onChange={(e) =>
                  setNewAction((p) => ({ ...p, measure: e.target.value }))
                }
                required
                rows={2}
                placeholder="Describe la medida de intervención…"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newAction.responsible}
                onChange={(e) =>
                  setNewAction((p) => ({ ...p, responsible: e.target.value }))
                }
                required
                placeholder="Nombre del responsable"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Fecha límite
              </label>
              <input
                type="date"
                value={newAction.dueDate}
                onChange={(e) =>
                  setNewAction((p) => ({ ...p, dueDate: e.target.value }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nivel de riesgo
              </label>
              <select
                value={newAction.riskCategory}
                onChange={(e) =>
                  setNewAction((p) => ({ ...p, riskCategory: e.target.value }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Sin especificar</option>
                <option value="SIN_RIESGO">Sin Riesgo</option>
                <option value="BAJO">Bajo</option>
                <option value="MEDIO">Medio</option>
                <option value="ALTO">Alto</option>
                <option value="MUY_ALTO">Muy Alto</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Área
              </label>
              <input
                type="text"
                value={newAction.area}
                onChange={(e) =>
                  setNewAction((p) => ({ ...p, area: e.target.value }))
                }
                placeholder="Área o departamento"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notas (opcional)
              </label>
              <textarea
                value={newAction.notes}
                onChange={(e) =>
                  setNewAction((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                placeholder="Observaciones adicionales…"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddAction(false);
                setNewAction({ ...emptyAction });
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingAction}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {savingAction ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Guardar medida
            </button>
          </div>
        </form>
      )}

      {/* Actions table */}
      {plan.actions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
          <AlertTriangle className="w-7 h-7 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Sin medidas registradas. Agrega la primera medida de intervención.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Medida
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                  Responsable
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                  Fecha límite
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Área
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Riesgo
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plan.actions.map((action) => (
                <tr
                  key={action.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 leading-snug">{action.measure}</p>
                    {action.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {action.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {action.responsible}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {action.dueDate
                      ? new Date(action.dueDate).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {action.area ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {action.riskCategory ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          RISK_COLORS[action.riskCategory] ??
                          "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {RISK_LABELS[action.riskCategory] ?? action.riskCategory}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {action.status !== "CANCELLED" ? (
                      <button
                        onClick={() => handleToggleStatus(action)}
                        disabled={updatingId === action.id}
                        title="Haz clic para avanzar el estado"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-75 disabled:opacity-50 ${
                          STATUS_COLORS[action.status] ??
                          "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {updatingId === action.id ? (
                          <Clock className="w-3 h-3 animate-spin" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        {STATUS_LABELS[action.status] ?? action.status}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[action.status]
                        }`}
                      >
                        {STATUS_LABELS[action.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      disabled={updatingId === action.id}
                      title="Eliminar medida"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
