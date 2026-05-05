"use client";

import { useRef, useState } from "react";
import { Camera, SquareDashedMousePointer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function BarcodeScanner({ onScan }: { onScan: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(false);
  const [active, setActive] = useState(false);

  const startScan = async () => {
    if (!("BarcodeDetector" in window)) {
      toast.error("Native BarcodeDetector is not available in this browser.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    scanningRef.current = true;
    setActive(true);

    const detector = new (window as unknown as { BarcodeDetector: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
      formats: ["ean_13", "code_128", "qr_code"]
    });

    const scanFrame = async () => {
      if (!videoRef.current || !scanningRef.current) return;
      const codes = await detector.detect(videoRef.current).catch(() => []);
      if (codes.length > 0) {
        onScan(codes[0].rawValue);
        toast.success(`Scanned ${codes[0].rawValue}`);
        stopScan();
        return;
      }
      requestAnimationFrame(scanFrame);
    };

    requestAnimationFrame(scanFrame);
  };

  const stopScan = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    scanningRef.current = false;
    setActive(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SquareDashedMousePointer className="size-4 text-primary" />
          Barcode Scanner
        </div>
        <Button size="sm" variant={active ? "destructive" : "secondary"} onClick={active ? stopScan : startScan}>
          <Camera />
          {active ? "Stop" : "Scan"}
        </Button>
      </div>
      <video ref={videoRef} className="aspect-video w-full bg-slate-950 object-cover" muted playsInline />
    </Card>
  );
}
