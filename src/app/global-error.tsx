"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body>
                <div
                    style={{
                        display: "flex",
                        minHeight: "100vh",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "system-ui, sans-serif",
                        backgroundColor: "#fafafa",
                        padding: "1rem",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <p
                            style={{
                                fontSize: "5rem",
                                fontWeight: "bold",
                                color: "#dc2626",
                                margin: 0,
                            }}
                        >
                            500
                        </p>
                        <h1
                            style={{
                                marginTop: "1rem",
                                fontSize: "1.5rem",
                                fontWeight: 600,
                                color: "#0a0a0a",
                            }}
                        >
                            Error crítico
                        </h1>
                        <p
                            style={{
                                marginTop: "0.5rem",
                                color: "#737373",
                                maxWidth: "28rem",
                            }}
                        >
                            La aplicación encontró un error grave. Intenta
                            recargar la página.
                        </p>
                        {error.digest && (
                            <p
                                style={{
                                    marginTop: "0.5rem",
                                    fontSize: "0.75rem",
                                    color: "#a3a3a3",
                                }}
                            >
                                Código: {error.digest}
                            </p>
                        )}
                        <div
                            style={{
                                marginTop: "2rem",
                                display: "flex",
                                gap: "1rem",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                onClick={reset}
                                style={{
                                    height: "2.5rem",
                                    padding: "0 1.5rem",
                                    borderRadius: "0.375rem",
                                    backgroundColor: "#18181b",
                                    color: "#fafafa",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Recargar
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
