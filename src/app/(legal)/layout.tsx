import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-foreground">
                        PsicoSST
                    </Link>
                    <div className="flex gap-4 text-sm">
                        <Link href="/login" className="text-muted-foreground hover:text-foreground">
                            Iniciar sesion
                        </Link>
                        <Link href="/register" className="text-primary hover:underline">
                            Registrarse
                        </Link>
                    </div>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-6 py-12">
                {children}
            </main>
            <footer className="border-t border-border py-8">
                <div className="max-w-3xl mx-auto px-6 flex gap-6 text-sm text-muted-foreground">
                    <Link href="/terms" className="hover:text-foreground">Terminos y Condiciones</Link>
                    <Link href="/privacy" className="hover:text-foreground">Politica de Privacidad</Link>
                </div>
            </footer>
        </div>
    );
}
