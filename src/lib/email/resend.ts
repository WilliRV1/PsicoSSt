import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email via Resend. Never throws — logs errors and returns false.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
    try {
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxxxxxxxxxx") {
            console.warn("[EMAIL] RESEND_API_KEY not configured, skipping email to:", to);
            return false;
        }

        const { error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "PsicoSST <onboarding@resend.dev>",
            to,
            subject,
            html,
        });

        if (error) {
            console.error("[EMAIL] Resend error:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("[EMAIL] Failed to send:", err);
        return false;
    }
}
