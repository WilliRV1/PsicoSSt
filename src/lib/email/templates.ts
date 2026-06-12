const APP_URL = process.env.APP_URL || "http://localhost:3000";

function layout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#18181b;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">PsicoSST</h1>
    </div>
    <div style="padding:32px">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center">
      <p style="margin:0;color:#a1a1aa;font-size:12px">PsicoSST — Plataforma de Riesgo Psicosocial</p>
      <p style="margin:4px 0 0;color:#a1a1aa;font-size:11px">Conforme a la Resolucion 2764 de 2022</p>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmail(fullName: string) {
    return {
        subject: "Bienvenido a PsicoSST - Registro recibido",
        html: layout(`
            <h2 style="margin:0 0 16px;color:#18181b;font-size:18px">Hola ${fullName},</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 16px">
                Tu solicitud de registro en PsicoSST ha sido recibida correctamente.
            </p>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 16px">
                Un administrador revisara tus credenciales profesionales y aprobara tu cuenta.
                Te notificaremos por correo cuando tu cuenta este activa.
            </p>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 8px">
                Al ser aprobado, recibiras <strong>5 creditos de prueba gratis</strong> para que
                conozcas la plataforma.
            </p>
        `),
    };
}

export function accountApprovedEmail(fullName: string) {
    return {
        subject: "Tu cuenta PsicoSST ha sido aprobada",
        html: layout(`
            <h2 style="margin:0 0 16px;color:#18181b;font-size:18px">Hola ${fullName},</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 16px">
                Tu cuenta en PsicoSST ha sido <strong style="color:#16a34a">aprobada</strong>.
                Ya puedes iniciar sesion y comenzar a utilizar la plataforma.
            </p>
            <div style="text-align:center;margin:24px 0">
                <a href="${APP_URL}/login" style="display:inline-block;background:#18181b;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                    Iniciar Sesion
                </a>
            </div>
            <p style="color:#71717a;font-size:13px;margin:0">
                Tienes 5 creditos de prueba para comenzar.
            </p>
        `),
    };
}

export function accountRejectedEmail(fullName: string) {
    return {
        subject: "Actualizacion sobre tu registro en PsicoSST",
        html: layout(`
            <h2 style="margin:0 0 16px;color:#18181b;font-size:18px">Hola ${fullName},</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 16px">
                Lamentamos informarte que tu solicitud de registro en PsicoSST no ha sido aprobada
                en este momento.
            </p>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 16px">
                Esto puede deberse a que no pudimos verificar tus credenciales profesionales.
                Si crees que es un error, por favor contactanos para resolver la situacion.
            </p>
        `),
    };
}

export function paymentReceiptEmail(
    fullName: string,
    packageName: string,
    credits: number,
    priceCOP: number,
    paymentRef: string,
    date: Date
) {
    const formattedPrice = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(priceCOP);

    const formattedDate = date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return {
        subject: `Recibo de compra - ${credits} creditos PsicoSST`,
        html: layout(`
            <h2 style="margin:0 0 16px;color:#18181b;font-size:18px">Recibo de compra</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 20px">
                Hola ${fullName}, tu compra ha sido procesada exitosamente.
            </p>
            <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:20px;margin:0 0 20px">
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                    <tr>
                        <td style="padding:6px 0;color:#71717a">Paquete</td>
                        <td style="padding:6px 0;color:#18181b;text-align:right;font-weight:600">${packageName}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#71717a">Creditos</td>
                        <td style="padding:6px 0;color:#18181b;text-align:right;font-weight:600">${credits}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#71717a">Total pagado</td>
                        <td style="padding:6px 0;color:#18181b;text-align:right;font-weight:700;font-size:16px">${formattedPrice}</td>
                    </tr>
                    <tr style="border-top:1px solid #e4e4e7">
                        <td style="padding:10px 0 6px;color:#71717a;font-size:12px">Referencia</td>
                        <td style="padding:10px 0 6px;color:#71717a;text-align:right;font-size:12px">${paymentRef}</td>
                    </tr>
                    <tr>
                        <td style="padding:2px 0 6px;color:#71717a;font-size:12px">Fecha</td>
                        <td style="padding:2px 0 6px;color:#71717a;text-align:right;font-size:12px">${formattedDate}</td>
                    </tr>
                </table>
            </div>
            <p style="color:#71717a;font-size:12px;margin:0">
                Los creditos ya estan disponibles en tu cuenta. No tienen fecha de vencimiento.
            </p>
        `),
    };
}

export function passwordResetEmail(fullName: string, code: string) {
    return {
        subject: "Codigo de recuperacion - PsicoSST",
        html: layout(`
            <h2 style="margin:0 0 16px;color:#18181b;font-size:18px">Recuperar contrasena</h2>
            <p style="color:#3f3f46;line-height:1.6;margin:0 0 16px">
                Hola ${fullName}, recibimos una solicitud para restablecer tu contrasena.
                Usa el siguiente codigo:
            </p>
            <div style="text-align:center;margin:24px 0">
                <div style="display:inline-block;background:#f4f4f5;border:2px solid #e4e4e7;border-radius:12px;padding:16px 40px;letter-spacing:8px;font-size:32px;font-weight:700;color:#18181b;font-family:monospace">
                    ${code}
                </div>
            </div>
            <p style="color:#ef4444;font-size:13px;font-weight:600;margin:0 0 12px;text-align:center">
                Este codigo expira en 10 minutos. Maximo 3 intentos.
            </p>
            <p style="color:#71717a;font-size:12px;margin:0">
                Si no solicitaste este cambio, ignora este correo. Tu contrasena no sera modificada.
            </p>
        `),
    };
}
