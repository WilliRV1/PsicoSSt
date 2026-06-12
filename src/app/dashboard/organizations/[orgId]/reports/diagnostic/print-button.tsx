"use client";

export function PrintButton() {
    return (
        <button 
            onClick={() => window.print()} 
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 012-2H5a2 2 0 01-2 2v4a2 2 0 002 2h2m2 4h6" />
            </svg>
            Imprimir Informe Diagnóstico
        </button>
    );
}
