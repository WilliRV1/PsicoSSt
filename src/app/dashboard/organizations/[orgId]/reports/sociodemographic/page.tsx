import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ClientSociodemographicPage from "./client-page";

interface PageProps {
    params: Promise<{ orgId: string }>;
}

export default async function SociodemographicReportPage({ params }: PageProps) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) redirect("/login");

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            psychologist: {
                select: {
                    fullName: true,
                    licenseNumber: true
                }
            }
        }
    });

    if (!org || (org.createdByPsychologist !== session.user.id && !session.user.isAdmin)) {
        return notFound();
    }

    return <ClientSociodemographicPage orgId={orgId} orgInfo={{
        organizationName: org.name,
        organizationNit: org.nit,
        psychologistName: org.psychologist.fullName,
        psychologistLicense: org.psychologist.licenseNumber,
        reportDate: new Date().toLocaleDateString('es-CO')
    }} />;
}
