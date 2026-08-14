import { redirect } from "next/navigation";

// Workers no longer have a global list — each worker is managed within their organization.
export default function WorkersPage() {
    redirect("/dashboard/organizations");
}
