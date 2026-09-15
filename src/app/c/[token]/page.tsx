import CompanyLinkFlow from "./company-link-flow";

export const metadata = {
    title: "Evaluación de Riesgo Psicosocial — PsicoSST",
};

export default async function PublicCompanyLinkPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return <CompanyLinkFlow token={token} />;
}
