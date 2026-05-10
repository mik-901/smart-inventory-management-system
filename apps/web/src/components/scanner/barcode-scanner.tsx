"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Camera, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type BarcodeScannerProps = {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Stop scanning after a successful scan to prevent multiple rapid triggers
        scanner.pause(true);
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // html5-qrcode continuously fires errors if it doesn't see a barcode in the frame
        // We only want to log real errors, so we ignore standard not-found errors
        if (!errorMessage.includes("NotFoundException")) {
          // console.warn(errorMessage);
        }
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScanSuccess]);

  const handleResume = () => {
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border p-4">
      <div className="flex w-full items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4" /> Scanner
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden [&>div]:!border-none" />

      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      
      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={handleResume}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Resume Scanning
        </Button>
      </div>
    </div>
  );
}
