
import React, { useRef, useEffect, useState } from 'react';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scanIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        setError(null);
        setIsScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Start scanning loop
                initScanner();
            }
        } catch (err) {
            setError("Camera access denied or unavailable.");
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (scanIntervalRef.current) {
            window.clearInterval(scanIntervalRef.current);
        }
        setIsScanning(false);
    };

    const initScanner = () => {
        // Native BarcodeDetector (Chrome/Android)
        const hasNative = 'BarcodeDetector' in window;
        
        scanIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || !isOpen) return;

            if (hasNative) {
                try {
                    const detector = new (window as any).BarcodeDetector({ 
                        formats: ['code_128', 'code_39', 'qr_code', 'ean_13'] 
                    });
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        onScan(barcodes[0].rawValue);
                        stopCamera();
                    }
                } catch (e) {
                    console.warn("Native detection failed, retrying...");
                }
            } else {
                // Fallback: Manual Mock for testing environment if needed or simple logic
                // Real implementation would use a library like Quagga/ZXing here
            }
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square bg-gray-900 overflow-hidden">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                />
                
                {/* Scanner UI Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-brand-primary rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl -mb-1 -mr-1"></div>
                        
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse"></div>
                    </div>
                    <p className="mt-8 text-white text-xs font-black uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                        Align Barcode within frame
                    </p>
                </div>
            </div>

            <div className="p-10 flex flex-col items-center">
                {error && <p className="text-red-400 font-bold mb-4">{error}</p>}
                <button 
                    onClick={onClose}
                    className="px-10 py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-full shadow-2xl active:scale-95 transition-all"
                >
                    Abort Scan
                </button>
                <p className="mt-6 text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                    Supported: Code 128 • Code 39 • QR • EAN
                </p>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
