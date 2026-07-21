"use client";

import { Icons } from "@/components/icons";

interface ComingSoonProps {
    title: string;
    description: string;
    iconName?: keyof typeof Icons;
}

export function ComingSoon({ title, description, iconName = "dashboard" }: ComingSoonProps) {
    const Icon = Icons[iconName] || Icons.dashboard;
    
    return (
        <div className="flex-1 h-[calc(100vh-8rem)] flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping duration-1000"></div>
                    <div className="relative bg-indigo-50 border-2 border-indigo-100 w-20 h-20 rounded-full flex items-center justify-center shadow-sm">
                        <Icon className="w-10 h-10 text-indigo-600" />
                    </div>
                </div>
                
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Próximamente</h1>
                    <p className="text-xl font-medium text-foreground mb-4">{title}</p>
                    <p className="text-muted-foreground leading-relaxed">
                        {description} Estamos trabajando duro para traerte esta funcionalidad muy pronto.
                    </p>
                </div>
                
                <div className="pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm font-bold text-muted-foreground">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                        En Desarrollo
                    </div>
                </div>
            </div>
        </div>
    );
}
