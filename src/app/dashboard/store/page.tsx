import { CREDIT_PACKAGES, formatCOP } from "@/config/credit-packages";
import { CheckoutButton } from "@/components/store/CheckoutButton";
import { Icons } from "@/components/icons";
import { 
  CheckCircle2, 
  XCircle, 
  Info,
  Check,
  Star,
  ShieldCheck,
  Zap,
  HeadphonesIcon,
  RefreshCw,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";

function getFeaturesForPackage(pkg: any) {
  const base = [`Equivale a ${pkg.credits} evaluaciones completas (Intralaboral, Extralaboral, Estrés)`];
  
  if (pkg.id === "starter") {
    return [...base, "Acceso a todas las funcionalidades básicas"];
  }
  if (pkg.id === "profesional") {
    return [
      ...base,
      `Ahorro del ${pkg.discount}% respecto al paquete base`,
      "Soporte prioritario por correo"
    ];
  }
  if (pkg.id === "business") {
    return [
      ...base,
      `Ahorro del ${pkg.discount}% respecto al paquete base`,
      "Soporte prioritario por correo y chat",
      "Reportes y analítica avanzada"
    ];
  }
  if (pkg.id === "enterprise" || pkg.id === "corporativo") {
    return [
      ...base,
      `Ahorro del ${pkg.discount}% respecto al paquete base`,
      "Soporte prioritario 24/7",
      "Reportes y analítica avanzada",
      "Onboarding personalizado"
    ];
  }
  return base;
}

export default function StorePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-16 pt-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-[#00B49F]" />
            Seguimiento
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed">
            Adquiere créditos para realizar evaluaciones de batería de riesgo psicosocial en tus empresas. Cada evaluación de un trabajador consume 1 crédito.
          </p>
        </div>

        {/* Decorative Graphic (Matches Mockup visually) */}
        <div className="hidden md:flex gap-4 shrink-0 relative">
           <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center relative z-10">
             <div className="w-10 h-10 text-[#0088CC]">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
             </div>
           </div>
           <div className="w-40 h-32 bg-gradient-to-br from-[#00A3FF] to-[#0055FF] rounded-2xl shadow-lg flex items-center justify-center relative z-20 -ml-8 mt-4">
             <ShoppingCart className="w-16 h-16 text-white" />
           </div>
           {/* Decorative dots */}
           <div className="absolute -right-8 -top-4 opacity-20">
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-slate-900 dark:bg-white rounded-full" />
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Alerts */}
      {status === "approved" && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex gap-3 text-emerald-800 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">¡Pago Exitoso!</h3>
            <p className="text-sm mt-1">Tus créditos han sido añadidos a tu cuenta. Puedes verificarlos en la barra superior.</p>
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

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CREDIT_PACKAGES.slice(0, 3).map((pkg) => (
          <div 
            key={pkg.id} 
            className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden relative ${
              pkg.popular 
              ? "border-2 border-[#00B49F] shadow-lg shadow-teal-500/5 z-10" 
              : "border border-slate-200 dark:border-slate-800 shadow-sm"
            }`}
          >
            {pkg.popular && (
              <div className="bg-[#00B49F] text-white text-xs font-bold uppercase tracking-widest text-center py-2 flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-white" />
                MÁS POPULAR
              </div>
            )}
            
            <div className={`p-8 flex-1 flex flex-col ${!pkg.popular ? "pt-10" : ""}`}>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
              <div className="mt-4 flex items-baseline gap-2 mb-8">
                <span className="text-[4rem] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {pkg.credits}
                </span>
                <span className="text-sm font-medium text-slate-500">créditos</span>
              </div>
              
              <ul className="space-y-4 flex-1 mb-8">
                {getFeaturesForPackage(pkg).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    <Check className="w-5 h-5 text-[#00B49F] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium mb-1">Total a pagar</span>
                    <span className="text-[22px] font-bold text-slate-900 dark:text-white leading-none">
                      $ {(pkg.priceCOP).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium mb-1">Por crédito</span>
                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                      $ {(pkg.pricePerCredit).toLocaleString("es-CO")}
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

      {/* Render the rest of the packages (Enterprise, Corporativo) if they exist */}
      {CREDIT_PACKAGES.length > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {CREDIT_PACKAGES.slice(3).map((pkg) => (
             <div 
             key={pkg.id} 
             className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden relative"
           >
             <div className="p-8 flex-1 flex flex-col pt-10">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
               <div className="mt-4 flex items-baseline gap-2 mb-8">
                 <span className="text-[4rem] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                   {pkg.credits}
                 </span>
                 <span className="text-sm font-medium text-slate-500">créditos</span>
               </div>
               
               <ul className="space-y-4 flex-1 mb-8">
                 {getFeaturesForPackage(pkg).map((feature, idx) => (
                   <li key={idx} className="flex items-start gap-3 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
                     <Check className="w-5 h-5 text-[#00B49F] shrink-0 mt-0.5" />
                     <span>{feature}</span>
                   </li>
                 ))}
               </ul>
 
               <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-6">
                 <div className="flex justify-between items-end mb-4">
                   <div className="flex flex-col">
                     <span className="text-[11px] text-slate-500 font-medium mb-1">Total a pagar</span>
                     <span className="text-[22px] font-bold text-slate-900 dark:text-white leading-none">
                       $ {(pkg.priceCOP).toLocaleString("es-CO")}
                     </span>
                   </div>
                   <div className="text-right flex flex-col">
                     <span className="text-[11px] text-slate-500 font-medium mb-1">Por crédito</span>
                     <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                       $ {(pkg.pricePerCredit).toLocaleString("es-CO")}
                     </span>
                   </div>
                 </div>
                 
                 <CheckoutButton 
                   packageId={pkg.id} 
                   priceCOP={pkg.priceCOP} 
                   popular={false}
                 />
               </div>
             </div>
           </div>
          ))}
        </div>
      )}
      
      {/* Footer Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Compra 100% segura</h4>
            <p className="text-[12px] text-slate-500 leading-relaxed">Tus pagos están protegidos y encriptados.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
            <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Acceso inmediato</h4>
            <p className="text-[12px] text-slate-500 leading-relaxed">Los créditos se reflejan en tu cuenta al instante.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <HeadphonesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Soporte especializado</h4>
            <p className="text-[12px] text-slate-500 leading-relaxed">Te acompañamos en todo momento.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Actualizaciones constantes</h4>
            <p className="text-[12px] text-slate-500 leading-relaxed">Mejoras y nuevas funcionalidades cada semana.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/faq" className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          ¿Dudas sobre los créditos? <span className="text-[#00B49F]">Ver preguntas frecuentes &gt;</span>
        </Link>
      </div>
      
    </div>
  );
}
