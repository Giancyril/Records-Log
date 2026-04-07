// frontend/src/utils/signature.ts
import type { RefObject } from "react";
import SignatureCanvas from "react-signature-canvas";

type StrokePoint = { x: number; y: number; time: number };
export type SignatureData = Array<Array<StrokePoint>>;

export function getSignatureData(sigRef: RefObject<SignatureCanvas | null>): SignatureData | null {
  if (!sigRef.current || sigRef.current.isEmpty()) return null;

  // Get raw point data instead of rendering to PNG
  return sigRef.current.toData();
}

export function signatureToDisplay(data: string | SignatureData | null): string {
  if (!data) return "";
  if (typeof data === "string") {
    if (data.startsWith("data:image/")) return data; // legacy support
    try {
      data = JSON.parse(data);
    } catch {
      return "";
    }
  }

  if (!Array.isArray(data)) return "";
  
  // Reconstruct on a temporary canvas
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  
  const strokes = data as SignatureData;
  strokes.forEach(stroke => {
    if (stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
  });
  
  return canvas.toDataURL("image/png");
}