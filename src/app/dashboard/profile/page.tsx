import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SignatureSection from "./signature-section";
import ProfileForm from "./profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: {
            fullName: true,
            email: true,
            licenseNumber: true,
            professionalCard: true,
            sstCredential: true,
            signature: true,
            status: true,
            createdAt: true
        }
    });

    if (!psychologist) redirect("/login");

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in">
            {/* Header Contextual */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Mi Perfil Profesional</h1>
                    <p className="mt-2 text-sm text-muted-foreground font-medium max-w-lg">
                        Aquí puedes actualizar tus credenciales y gestionar tu firma digital.
                        Toda la información aquí registrada se utiliza para validar legalmente tus informes de riesgo psicosocial.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                        {psychologist.fullName.charAt(0)}
                    </div>
                    <div>
                        <p className="text-xs font-black text-foreground uppercase tracking-tighter leading-none">{psychologist.fullName}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{psychologist.status} ✨</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 1. Información de Perfil (Edición) */}
                <ProfileForm initialData={{
                    fullName: psychologist.fullName,
                    email: psychologist.email,
                    licenseNumber: psychologist.licenseNumber,
                    professionalCard: psychologist.professionalCard,
                    sstCredential: psychologist.sstCredential
                }} />

                {/* 2. Firma Digital */}
                <SignatureSection initialSignature={psychologist.signature} />

                {/* 3. Seguridad Adicional */}
                <Card className="bg-muted">
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Seguridad de la cuenta</h3>
                                <p className="text-xs text-muted-foreground mt-1">Tu cuenta está protegida con Autenticación de Dos Factores (MFA).</p>
                            </div>
                            <Button variant="outline" className="bg-card text-xs py-1.5">
                                Cambiar Contraseña
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <footer className="text-center text-[10px] text-muted-foreground font-medium py-4">
                PsicoSST v1.0 • Cumplimiento Resolución 2764 de 2022
            </footer>
        </div>
    );
}
