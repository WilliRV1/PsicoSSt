"use client";

import { Download } from "lucide-react";

export function BrowserPrintButton() {
    return (
        <button 
            onClick={() => window.print()} 
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
            <Download className="w-5 h-5" />
            Imprimir Informe
        </button>
    );
}
