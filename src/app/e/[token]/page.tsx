import InvitationFlow from "./invitation-flow";

export const metadata = {
    title: "Evaluación de Riesgo Psicosocial — PsicoSST",
};

export default async function PublicInvitationPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return <InvitationFlow token={token} />;
}
