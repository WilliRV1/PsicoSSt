"use client";

import { useState } from "react";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateOrganizationModal from "@/components/dashboard/create-organization-modal";
import { useRouter } from "next/navigation";

export default function EmptyDashboardState({ firstName }: { firstName: string }) {
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                <Building2 className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl font-black text-foreground mb-2 text-center tracking-tight">
                ¡Bienvenido/a, {firstName}!
            </h1>
            
            <p className="text-lg text-muted-foreground text-center max-w-md mb-8">
                Aún no tienes empresas registradas. Para empezar a evaluar a tus trabajadores y generar reportes, crea tu primera organización.
            </p>

            <Button 
                size="lg" 
                onClick={() => setShowModal(true)}
                className="gap-2 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
                Crea tu primera organización aquí
                <ArrowRight className="w-5 h-5" />
            </Button>

            <CreateOrganizationModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                onSuccess={() => {
                    setShowModal(false);
                    router.refresh();
                }} 
            />
        </div>
    );
}
