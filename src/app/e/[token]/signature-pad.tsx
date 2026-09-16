"use client";

import { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
    onChange: (dataUrl: string | null) => void;
}

/**
 * Firma dibujada con dedo/mouse — sin librería externa, canvas + pointer
 * events. Devuelve un PNG base64 vía onChange; null mientras esté vacío.
 */
export default function SignaturePad({ onChange }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const hasDrawnRef = useRef(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(ratio, ratio);
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#0B0F14";
        }
    }, []);

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);
        drawingRef.current = true;
        const ctx = canvas.getContext("2d")!;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (!hasDrawnRef.current) {
            hasDrawnRef.current = true;
            setHasDrawn(true);
        }
    };

    const end = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        if (hasDrawnRef.current) {
            onChange(canvasRef.current!.toDataURL("image/png"));
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawnRef.current = false;
        setHasDrawn(false);
        onChange(null);
    };

    return (
        <div className="space-y-2">
            <div className="relative border-2 border-dashed border-border rounded-xl bg-white overflow-hidden touch-none">
                <canvas
                    ref={canvasRef}
                    className="w-full h-40 touch-none cursor-crosshair"
                    onPointerDown={start}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerLeave={end}
                />
                {!hasDrawn && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                        Firma aquí con el dedo o el mouse
                    </span>
                )}
            </div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={clear}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                    Borrar firma
                </button>
            </div>
        </div>
    );
}
