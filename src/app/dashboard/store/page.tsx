import { CREDIT_PACKAGES } from "@/config/credit-packages";
import { Icons } from "@/components/icons";
import {
  Check,
  Star,
  ShieldCheck,
  Zap,
  HeadphonesIcon,
  RefreshCw,
  ShoppingCart,
  Clock,
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

export default function StorePage() {
  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-16 pt-4">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            Planes
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Adquiere créditos para realizar evaluaciones de batería de riesgo psicosocial en tus empresas. Cada evaluación de un trabajador consume 1 crédito.
          </p>
        </div>

        {/* Decorative Graphic */}
        <div className="hidden md:flex gap-4 shrink-0 relative">
           <div className="w-20 h-20 bg-card rounded-2xl shadow-sm border border-border flex items-center justify-center relative z-10">
             <div className="w-10 h-10 text-info">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
             </div>
           </div>
           <div className="w-40 h-32 bg-gradient-to-br from-primary to-teal-dark rounded-2xl shadow-lg flex items-center justify-center relative z-20 -ml-8 mt-4">
             <ShoppingCart className="w-16 h-16 text-primary-foreground" />
           </div>
           {/* Decorative dots */}
           <div className="absolute -right-8 -top-4 opacity-20">
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-foreground rounded-full" />
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Próximamente banner */}
      <div className="rounded-xl p-4 flex gap-3 border" style={{ background: "var(--color-risk-medium-bg)", borderColor: "var(--color-risk-medium-border)", color: "var(--color-risk-medium-text)" }}>
        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">Pagos en línea próximamente</h3>
          <p className="text-sm mt-1">La pasarela de pago está en configuración. Para adquirir créditos contáctanos directamente.</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CREDIT_PACKAGES.slice(0, 3).map((pkg) => (
          <div 
            key={pkg.id} 
            className={`flex flex-col bg-card rounded-2xl overflow-hidden relative ${
              pkg.popular 
              ? "border-2 border-primary shadow-lg shadow-primary/5 z-10" 
              : "border border-border shadow-sm"
            }`}
          >
            {pkg.popular && (
              <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest text-center py-2 flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-primary-foreground" />
                MÁS POPULAR
              </div>
            )}
            
            <div className={`p-8 flex-1 flex flex-col ${!pkg.popular ? "pt-10" : ""}`}>
              <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
              <div className="mt-4 flex items-baseline gap-2 mb-8">
                <span className="text-[4rem] font-bold tracking-tight text-foreground leading-none">
                  {pkg.credits}
                </span>
                <span className="text-sm font-medium text-muted-foreground">créditos</span>
              </div>
              
              <ul className="space-y-4 flex-1 mb-8">
                {getFeaturesForPackage(pkg).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto border-t border-border pt-6">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium mb-1">Total a pagar</span>
                    <span className="text-[22px] font-bold text-foreground leading-none">
                      $ {(pkg.priceCOP).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-[11px] text-muted-foreground font-medium mb-1">Por crédito</span>
                    <span className="text-[13px] font-medium text-muted-foreground">
                      $ {(pkg.pricePerCredit).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
                
                <div className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Próximamente</span>
                </div>
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
             className="flex flex-col bg-card border border-border shadow-sm rounded-2xl overflow-hidden relative"
           >
             <div className="p-8 flex-1 flex flex-col pt-10">
               <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
               <div className="mt-4 flex items-baseline gap-2 mb-8">
                 <span className="text-[4rem] font-bold tracking-tight text-foreground leading-none">
                   {pkg.credits}
                 </span>
                 <span className="text-sm font-medium text-muted-foreground">créditos</span>
               </div>
               
               <ul className="space-y-4 flex-1 mb-8">
                 {getFeaturesForPackage(pkg).map((feature, idx) => (
                   <li key={idx} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                     <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                     <span>{feature}</span>
                   </li>
                 ))}
               </ul>
 
               <div className="mt-auto border-t border-border pt-6">
                 <div className="flex justify-between items-end mb-4">
                   <div className="flex flex-col">
                     <span className="text-[11px] text-muted-foreground font-medium mb-1">Total a pagar</span>
                     <span className="text-[22px] font-bold text-foreground leading-none">
                       $ {(pkg.priceCOP).toLocaleString("es-CO")}
                     </span>
                   </div>
                   <div className="text-right flex flex-col">
                     <span className="text-[11px] text-muted-foreground font-medium mb-1">Por crédito</span>
                     <span className="text-[13px] font-medium text-muted-foreground">
                       $ {(pkg.pricePerCredit).toLocaleString("es-CO")}
                     </span>
                   </div>
                 </div>
                 
                 <div className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                   <Clock className="w-4 h-4" />
                   <span>Próximamente</span>
                 </div>
               </div>
             </div>
           </div>
          ))}
        </div>
      )}
      
      {/* Footer Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-12 border-t border-border">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center shrink-0 border border-primary/20">
            <ShieldCheck className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-1">Compra 100% segura</h4>
            <p className="text-[12px] text-muted-foreground leading-relaxed">Tus pagos están protegidos y encriptados.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center shrink-0 border border-primary/20">
            <Zap className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-1">Acceso inmediato</h4>
            <p className="text-[12px] text-muted-foreground leading-relaxed">Los créditos se reflejan en tu cuenta al instante.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center shrink-0 border border-primary/20">
            <HeadphonesIcon className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-1">Soporte especializado</h4>
            <p className="text-[12px] text-muted-foreground leading-relaxed">Te acompañamos en todo momento.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center shrink-0 border border-primary/20">
            <RefreshCw className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-foreground mb-1">Actualizaciones constantes</h4>
            <p className="text-[12px] text-muted-foreground leading-relaxed">Mejoras y nuevas funcionalidades cada semana.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/faq" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
          ¿Dudas sobre los créditos? <span className="text-primary">Ver preguntas frecuentes &gt;</span>
        </Link>
      </div>
      
    </div>
  );
}
