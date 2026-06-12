import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PsychologistList } from "./psychologist-list";

export default async function AdminPsychologistsPage() {
    const session = await auth();

    if (!session?.user || !session.user.isAdmin) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground">Administracion de Psicologos</h2>
                <p className="text-sm text-muted-foreground">
                    Gestiona el acceso, aprueba registros y supervisa el estado de los profesionales.
                </p>
            </div>
            <PsychologistList />
        </div>
    );
}
