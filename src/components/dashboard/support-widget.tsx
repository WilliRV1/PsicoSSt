"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function SupportWidget() {
    // WhatsApp number provided: 3136336446
    const whatsappUrl = "https://wa.me/573136336446?text=Hola,%20necesito%20soporte%20con%20PsicoSST";

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group relative"
            >
                <MessageCircle className="w-7 h-7" />
                
                {/* Tooltip */}
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Soporte en línea
                    {/* Arrow */}
                    <span className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-gray-900"></span>
                </span>
                
                {/* Ping animation */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20 group-hover:animate-ping"></span>
            </Link>
        </div>
    );
}
