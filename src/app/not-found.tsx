import Link from "next/link";
import { Logo } from "@/components/psicosst/logo";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <Logo className="mb-8" />
            <div className="text-center">
                <p className="text-8xl font-bold text-primary">404</p>
                <h1 className="mt-4 text-2xl font-semibold text-foreground">
                    Página no encontrada
                </h1>
                <p className="mt-2 max-w-md text-muted-foreground">
                    La página que buscas no existe o fue movida a otra ubicación.
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Ir al Dashboard
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
