import { CREDIT_PACKAGES, formatCOP } from "@/config/credit-packages";
import { CheckoutButton } from "@/components/store/CheckoutButton";
import { Icons } from "@/components/icons";
import { Coins, CheckCircle2, XCircle, Info, Sparkles } from "lucide-react";
import Link from "next/link";

export default function StorePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Icons.shoppingCart className="w-6 h-6 text-teal-500" />
          Tienda de Créditos
        </h1>
        <p className="text-text-secondary">
          Adquiere créditos para realizar evaluaciones de batería de riesgo psicosocial en tus empresas. Cada evaluación de un trabajador consume 1 crédito.
        </p>
      </div>

      {status === "approved" && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex gap-3 text-emerald-800 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">¡Pago Exitoso!</h3>
            <p className="text-sm mt-1">Tus créditos han sido añadidos a tu cuenta. Puedes verificarlos en la barra superior.</p>
            <div className="mt-3">
              <Link href="/dashboard" className="text-sm font-medium underline underline-offset-2 hover:text-emerald-900 dark:hover:text-emerald-300">
                Volver al Centro de Control
              </Link>
            </div>
          </div>
        </div>
      )}

      {status === "failure" && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 flex gap-3 text-red-800 dark:text-red-400">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Pago Rechazado</h3>
            <p className="text-sm mt-1">Tu pago no pudo ser procesado por Mercado Pago. Por favor, intenta nuevamente con otro medio de pago.</p>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Pago Pendiente</h3>
            <p className="text-sm mt-1">Tu pago está siendo procesado por Mercado Pago. Tus créditos se añadirán automáticamente cuando se confirme la transacción.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <div 
            key={pkg.id} 
            className={`flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
              pkg.popular 
              ? "border-teal-500 shadow-md shadow-teal-500/10 scale-[1.02] md:scale-105 z-10" 
              : "border-border hover:border-border-focus"
            }`}
          >
            {pkg.popular && (
              <div className="bg-teal-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Más Popular
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">
                  {pkg.credits}
                </span>
                <span className="text-sm font-medium text-text-muted">créditos</span>
              </div>
              
              <div className="mt-6 space-y-4 flex-1">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0">
                    <Coins className="w-4 h-4 text-amber-500" />
                  </div>
                  <span>
                    Equivale a <strong>{pkg.credits} evaluaciones</strong> completas (Intralaboral, Extralaboral, Estrés)
                  </span>
                </div>
                
                {pkg.discount > 0 && (
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <Icons.arrowDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>
                      Ahorras un <strong>{pkg.discount}%</strong> respecto al paquete base
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted font-medium mb-1">Total a pagar</span>
                    <span className="text-2xl font-bold text-foreground leading-none">
                      {formatCOP(pkg.priceCOP)}
                    </span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-xs text-text-muted">por crédito</span>
                    <span className="text-sm font-medium text-text-secondary">
                      {formatCOP(pkg.pricePerCredit)}
                    </span>
                  </div>
                </div>
                
                <CheckoutButton 
                  packageId={pkg.id} 
                  priceCOP={pkg.priceCOP} 
                  popular={pkg.popular}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-text-muted bg-surface p-6 rounded-xl border border-border">
        <p className="flex items-center justify-center gap-2 mb-2">
          <Icons.shield className="w-4 h-4 text-teal-500" />
          Pagos procesados de forma segura por Mercado Pago
        </p>
        <p>
          Al adquirir un paquete aceptas nuestros Términos y Condiciones. Los créditos no caducan y están enlazados a tu cuenta profesional.
        </p>
      </div>
    </div>
  );
}
