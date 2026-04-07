// frontend/src/utils/signature.ts
import type { RefObject } from "react";
import SignatureCanvas from "react-signature-canvas";

export function getSignatureData(sigRef: RefObject<SignatureCanvas | null>): string {
  if (!sigRef.current || sigRef.current.isEmpty()) return "";
  
  // Get raw point data instead of rendering to PNG
  const data = sigRef.current.toData(); // Returns stroke point arrays
  return JSON.stringify(data);
}

export function signatureToDisplay(data: string): string {
  // Convert stored path data back to a data URL for display
  if (!data) return "";
  if (data.startsWith("data:image/")) return data; // legacy support
  
  // Reconstruct on a temporary canvas
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  
  const strokes: Array<Array<{x: number, y: number}>> = JSON.parse(data);
  strokes.forEach(stroke => {
    if (stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
  });
  
  return canvas.toDataURL("image/png");
}