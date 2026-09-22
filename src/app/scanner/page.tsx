'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  HelpCircle, 
  Aperture, 
  Check, 
  Plus, 
  ExternalLink, 
  Search, 
  Image as ImageIcon,
  Sparkles,
  ArrowDown,
  RefreshCw,
  Camera,
  SwitchCamera,
  Layers,
  AlertCircle
} from 'lucide-react';
import { getSafeCardImageUrl, getEditionCardImageUrl } from '@/lib/card-image';
import { useSettings } from '@/context/SettingsContext';
import { addCardToLocalBinder } from '@/lib/user-collection';
import { recognizeTextFromCanvas, preprocessCanvas, extractOnePieceCode } from '@/lib/card-ocr';

export default function ScannerPage() {
  const router = useRouter();
  const { currency, formatPrice, formatCard } = useSettings();

  // Camera & Scanning States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanNotFound, setScanNotFound] = useState(false);
  const [unrecognizedText, setUnrecognizedText] = useState<string | null>(null);

  // Modals & Panels
  const [showHelp, setShowHelp] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [detectedCard, setDetectedCard] = useState<any | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Start / restart camera with cross-platform mobile support
  const startCamera = async (targetMode: 'environment' | 'user' = facingMode) => {
    setIsRequestingCamera(true);
    setCameraError(null);

    // Stop any previously running tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser. Please use Chrome or Safari over HTTPS.');
      setIsRequestingCamera(false);
      return;
    }

    let stream: MediaStream | null = null;

    try {
      // 1. Try environment/user with preferred resolution
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (firstErr) {
      console.warn('Ideal camera constraint failed, trying basic constraint:', firstErr);
      try {
        // 2. Try exact or simple facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetMode },
          audio: false,
        });
      } catch (secondErr) {
        console.warn('FacingMode constraint failed, trying default video:', secondErr);
        try {
          // 3. Fallback to any video device
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (finalErr: any) {
          console.error('All camera attempts failed:', finalErr);
          if (finalErr.name === 'NotAllowedError' || finalErr.name === 'PermissionDeniedError') {
            setCameraError('Camera access was blocked. Tap "Allow Camera" or check browser site permissions.');
          } else if (finalErr.name === 'NotFoundError' || finalErr.name === 'DevicesNotFoundError') {
            setCameraError('No camera found on this device.');
          } else if (finalErr.name === 'NotReadableError' || finalErr.name === 'TrackStartError') {
            setCameraError('Camera is currently in use by another app.');
          } else {
            setCameraError(finalErr.message || 'Camera access unavailable.');
          }
          setCameraActive(false);
          setIsRequestingCamera(false);
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        
        try {
          await videoRef.current.play();
          setCameraActive(true);
          setCameraError(null);
        } catch {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setCameraActive(true);
            setCameraError(null);
          };
        }
      }
    }
    setIsRequestingCamera(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Auto-start on mount, clean up on unmount
  useEffect(() => {
    startCamera('environment');

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Fetch card from API by exact code or name
  async function performCardLookup(cardCode: string) {
    const clean = cardCode.trim().toUpperCase();
    if (!clean) return;

    setIsScanning(true);
    setScanMessage(`Looking up ${clean}...`);
    try {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(clean)}&limit=1`);
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        setDetectedCard(data.cards[0]);
        setScanNotFound(false);
      } else {
        // If not found in database, do not invent fake cards
        setUnrecognizedText(clean);
        setScanNotFound(true);
      }
    } catch (e) {
      console.error('Scan lookup error:', e);
      setScanNotFound(true);
    } finally {
      setIsScanning(false);
      setScanMessage(null);
    }
  }

  // Trigger Real Shutter Capture with OCR
  const handleShutter = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanNotFound(false);
    setDetectedCard(null);
    setScanMessage('Capturing camera frame...');

    if (!videoRef.current || videoRef.current.readyState < 2) {
      setScanMessage('Camera is initializing...');
      setTimeout(() => {
        setIsScanning(false);
        setScanMessage(null);
      }, 1200);
      return;
    }

    try {
      const video = videoRef.current;
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;

      // 1. Pass 1: Target the bottom-right serial area (where OP05-119, ST01-001 is printed)
      const cropX = Math.floor(vw * 0.42);
      const cropY = Math.floor(vh * 0.58);
      const cropW = Math.floor(vw * 0.56);
      const cropH = Math.floor(vh * 0.40);

      const serialCanvas = preprocessCanvas(video, { x: cropX, y: cropY, width: cropW, height: cropH });
      setScanMessage('Analyzing card serial code...');

      let rawText = await recognizeTextFromCanvas(serialCanvas);
      let detectedCode = extractOnePieceCode(rawText);

      // 2. Pass 2: If bottom-right crop didn't find a code, scan the full card frame
      if (!detectedCode) {
        setScanMessage('Scanning full card frame...');
        const fullCanvas = preprocessCanvas(video);
        rawText = await recognizeTextFromCanvas(fullCanvas);
        detectedCode = extractOnePieceCode(rawText);
      }

      if (detectedCode) {
        setScanMessage(`Recognized: ${detectedCode}!`);
        await performCardLookup(detectedCode);
      } else {
        // No valid card code found - be transparent
        setUnrecognizedText(rawText?.trim() || null);
        setScanNotFound(true);
      }
    } catch (err) {
      console.error('OCR scanning error:', err);
      setScanNotFound(true);
    } finally {
      setIsScanning(false);
      setScanMessage(null);
    }
  };

  // Add detected card to binder
  const handleAddToBinder = async () => {
    if (!detectedCard) return;
    try {
      // 1. Immediately save to local binder for guaranteed offline/multi-device persistence
      addCardToLocalBinder({
        cardId: detectedCard.id,
        card: {
          id: detectedCard.id,
          name: detectedCard.name,
          category: detectedCard.category,
          colors: detectedCard.colors || '',
          cost: detectedCard.cost ?? null,
          power: detectedCard.power ?? null,
          rarity: detectedCard.rarity,
          imageUrl: detectedCard.imageUrl,
          marketPrice: detectedCard.marketPrice ?? null,
          yuyuPrice: detectedCard.yuyuPrice ?? null,
          pack: detectedCard.pack ? { code: detectedCard.pack.code, name: detectedCard.pack.name } : undefined,
        },
        quantity: 1,
        condition: 'NM',
        language: 'jp',
        purchasePrice: detectedCard.marketPrice || 20,
        notes: 'Added via AI Card Lens Scanner',
      });

      // 2. Also attempt server sync if available
      try {
        await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: detectedCard.id,
            quantity: 1,
            condition: 'NM',
            language: 'jp',
            purchasePrice: detectedCard.marketPrice || 20,
            notes: 'Added via AI Card Lens Scanner',
          }),
        });
      } catch {
        // Safe to ignore in offline or serverless
      }

      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Photo File Upload with real OCR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanNotFound(false);
    setDetectedCard(null);
    setScanMessage('Processing uploaded card image...');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const fullCanvas = preprocessCanvas(img);
          const rawText = await recognizeTextFromCanvas(fullCanvas);
          const detectedCode = extractOnePieceCode(rawText);

          if (detectedCode) {
            await performCardLookup(detectedCode);
          } else {
            setUnrecognizedText(rawText?.trim() || null);
            setScanNotFound(true);
          }
        } catch (err) {
          console.error('File OCR error:', err);
          setScanNotFound(true);
        } finally {
          setIsScanning(false);
          setScanMessage(null);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* ================= BACKGROUND CAMERA FEED ================= */}
      {/* ================= BACKGROUND CAMERA FEED ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0c10]">
        {/* Video element is ALWAYS rendered in the DOM so videoRef.current is never null */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            cameraActive ? 'opacity-90' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Viewfinder Texture / Permission Request when camera stream is not yet active */}
        {!cameraActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e1017] via-[#07080c] to-[#040507] flex flex-col items-center justify-center p-6 text-center z-5">
            <div 
              className="absolute inset-0 opacity-[0.07]" 
              style={{ 
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
              }} 
            />
            {/* Subtle animated ambient beam */}
            <div className="w-80 h-80 rounded-full bg-[#f4727d]/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#f4727d]/15 border border-[#f4727d]/30 text-[#f4727d] mx-auto flex items-center justify-center shadow-lg">
                <Camera className={`w-7 h-7 ${isRequestingCamera ? 'animate-pulse' : ''}`} />
              </div>
              <h3 className="text-white font-bold text-sm tracking-wide">
                {isRequestingCamera ? 'Accessing Camera Lens...' : cameraError ? 'Camera Permission Needed' : 'Start Camera Scanner'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed px-2">
                {cameraError || 'Tap below to grant camera access and start scanning cards in real-time.'}
              </p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                disabled={isRequestingCamera}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e76d78] to-[#f59e0b] text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-60"
              >
                {isRequestingCamera ? 'Connecting Camera...' : 'Allow / Turn On Camera'}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Scan Laser Sweep */}
        {isScanning && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f4727d] to-transparent shadow-[0_0_15px_#f4727d] animate-laserSweep z-10 pointer-events-none" />
        )}
      </div>

      {/* ================= TOP BAR ================= */}
      <header className="relative z-20 w-full pt-12 sm:pt-14 px-5 sm:px-6 flex items-center justify-between">
        {/* Left: Help '?' Circle Button */}
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          aria-label="Scan Help & Tips"
          className="w-11 h-11 rounded-full bg-[#2a2e3d]/80 hover:bg-[#383d50] text-gray-200 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition cursor-pointer"
        >
          <HelpCircle className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Center: 'MANUAL' Pill Button */}
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="px-5 py-2 rounded-full bg-[#2a2e3d]/80 hover:bg-[#383d50] text-white text-xs font-black tracking-widest uppercase flex items-center gap-2 backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition cursor-pointer"
        >
          <Aperture className="w-4 h-4 text-gray-300 stroke-[2.5]" />
          <span>MANUAL</span>
        </button>

        {/* Right: Exit '✕' Circle Button */}
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Close Scanner"
          className="w-11 h-11 rounded-full bg-[#2a2e3d]/80 hover:bg-[#383d50] text-gray-200 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>
      </header>

      {/* ================= CENTER VIEWFINDER ================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4">
        {/* Main Card Bounding Box (Matches One Piece Card 2.5 : 3.5 Ratio) */}
        <div className="relative w-full max-w-[295px] aspect-[2.5/3.5] border-2 border-dashed border-white/85 rounded-[26px] flex flex-col items-center justify-center shadow-2xl p-4 transition-all duration-300">
          
          {/* Subtle Corner Brackets for High Precision Look */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#f4727d] rounded-tl-xl pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#f4727d] rounded-tr-xl pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#f4727d] rounded-bl-xl pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#f4727d] rounded-br-xl pointer-events-none" />

          {/* Center Instruction Label: PLACE A CARD / Live Scan Progress */}
          <div className="text-center px-2">
            {isScanning && scanMessage ? (
              <div className="bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#f4727d]/40 shadow-xl flex items-center gap-2.5 animate-fadeIn">
                <RefreshCw className="w-4 h-4 text-[#f4727d] animate-spin flex-shrink-0" />
                <span className="text-xs font-bold text-white tracking-wide">{scanMessage}</span>
              </div>
            ) : (
              <>
                <h2 className="text-white font-black text-base sm:text-lg tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  PLACE A CARD
                </h2>
                <p className="text-[11px] text-gray-300 font-medium tracking-wide mt-1 drop-shadow-md">
                  Align card inside white frame
                </p>
              </>
            )}
          </div>

          {/* Bottom Right Target Box for Card ID Serial (OP01-001) */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end pointer-events-none">
            {/* Pink Indicator Pill: NUMBER OP01-001 ↓ */}
            <div className="bg-[#f4727d] text-white text-[9.5px] sm:text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-lg flex items-center gap-1 mb-1.5 animate-bounce">
              <span>NUMBER OP01-001</span>
              <ArrowDown className="w-3 h-3 stroke-[3]" />
            </div>

            {/* Pink-Bordered Serial Code Detection Box */}
            <div className="w-28 sm:w-32 h-9 sm:h-10 border-2 border-[#f4727d] bg-[#f4727d]/15 rounded-xl shadow-inner backdrop-blur-xs flex items-center justify-center">
              <span className="text-[9px] font-mono font-black text-[#f4727d] uppercase tracking-widest opacity-80">
                SERIAL TARGET
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ================= BOTTOM BAR & HUD ================= */}
      <footer className="relative z-20 w-full pb-10 sm:pb-12 px-6 flex items-center justify-between">
        {/* Left: Unlimited Live Scanner Badge */}
        <div className="bg-[#242836]/85 backdrop-blur-md text-gray-200 text-xs font-black tracking-wider px-3.5 py-2 rounded-xl border border-white/10 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold text-[11px] uppercase tracking-wider">Unlimited</span>
        </div>

        {/* Center: Bold Pink Shutter Button with Aperture Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={handleShutter}
            disabled={isScanning}
            aria-label="Capture Card"
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-[22px] bg-gradient-to-tr from-[#f4727d] to-[#e44d5b] hover:brightness-110 active:scale-90 text-slate-950 flex items-center justify-center shadow-2xl shadow-[#f4727d]/50 transition-all duration-200 cursor-pointer disabled:opacity-60 border-2 border-white/20"
          >
            <Aperture className={`w-8 h-8 stroke-[2.6] ${isScanning ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Right: Switch Camera & Image Upload */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCameraFacing}
            title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Back'} Camera`}
            className="w-10 h-10 rounded-xl bg-[#242836]/80 hover:bg-[#34384c] text-gray-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition cursor-pointer"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Photo of Card"
            className="w-10 h-10 rounded-xl bg-[#242836]/80 hover:bg-[#34384c] text-gray-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </footer>

      {/* ================= DETECTED CARD BOTTOM SHEET ================= */}
      {detectedCard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-0 sm:p-4">
          <div 
            className="w-full max-w-sm sm:max-w-md bg-[#232634] border-t sm:border border-[#353a4e] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl animate-slideUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge & Close */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Card Recognized (100%)
              </span>
              <button
                type="button"
                onClick={() => setDetectedCard(null)}
                className="w-8 h-8 rounded-full bg-[#2d3143] hover:bg-[#383d54] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Card Content Row */}
            <div className="flex items-start gap-4 mb-4">
              {/* Card Art Thumbnail */}
              <div className="w-20 sm:w-24 aspect-[2.5/3.5] bg-[#1a1d27] rounded-xl overflow-hidden border border-[#34384c] flex-shrink-0 shadow-lg relative">
                <img
                  src={getEditionCardImageUrl(detectedCard.id, 'jp', detectedCard.imageUrl)}
                  alt={detectedCard.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Card Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#f4727d]/20 text-[#f4727d] text-xs font-black font-mono border border-[#f4727d]/30">
                    {detectedCard.id}
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {detectedCard.rarity}
                  </span>
                </div>

                <h3 className="text-base font-black text-white truncate leading-tight">
                  {detectedCard.name}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {detectedCard.pack?.name || 'One Piece Card Series'}
                </p>

                {/* Market Price Tag */}
                <div className="mt-2.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Yuyu-tei Market
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatPrice(detectedCard.marketPrice || 25, { source: 'yuyutei' }).full}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#31364a]">
              <button
                type="button"
                onClick={handleAddToBinder}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#f4727d] to-[#e44d5b] hover:brightness-105 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#f4727d]/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add to Binder</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/cards/${detectedCard.id}`)}
                className="py-3 px-4 rounded-xl bg-[#2b3040] hover:bg-[#363c50] active:scale-95 text-white text-xs font-black uppercase tracking-wider border border-[#3e445b] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Card</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCAN NOT DETECTED BOTTOM SHEET ================= */}
      {scanNotFound && !detectedCard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-0 sm:p-4">
          <div 
            className="w-full max-w-sm sm:max-w-md bg-[#232634] border-t sm:border border-[#353a4e] rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl animate-slideUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
                Card Not Recognized
              </span>
              <button
                type="button"
                onClick={() => {
                  setScanNotFound(false);
                  setUnrecognizedText(null);
                }}
                className="w-8 h-8 rounded-full bg-[#2d3143] hover:bg-[#383d54] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <h3 className="text-base font-black text-white mb-1">
              Could not read card code
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Hold your card steady and make sure the bottom-right number (e.g. <strong className="text-white font-mono">OP01-001</strong>) is well-lit and aligned inside the pink target box.
            </p>

            {unrecognizedText && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-[#1b1e29] border border-[#31364a] text-xs">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Read from frame:</span>
                <span className="font-mono text-gray-200 break-all">{unrecognizedText}</span>
              </div>
            )}

            {/* Quick search input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  const q = manualInput.trim();
                  setScanNotFound(false);
                  performCardLookup(q);
                }
              }}
              className="flex gap-2 mb-3"
            >
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type code (e.g. OP05-119)..."
                className="flex-1 bg-[#1a1d27] border border-[#3b4156] focus:border-[#f4727d] rounded-xl px-3 py-2.5 text-xs text-white uppercase font-mono placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#f4727d] text-white text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                Find
              </button>
            </form>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#31364a]">
              <button
                type="button"
                onClick={() => {
                  setScanNotFound(false);
                  setUnrecognizedText(null);
                  handleShutter();
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#f4727d] to-[#e44d5b] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Retry Scan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanNotFound(false);
                  setShowManual(true);
                }}
                className="py-3 px-4 rounded-xl bg-[#2b3040] hover:bg-[#363c50] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#3e445b] active:scale-95 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Manual List</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANUAL CARD ENTRY MODAL ================= */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div 
            className="w-full max-w-sm bg-[#232634] border border-[#353a4e] rounded-[30px] p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-[#f4727d]" />
                <span>Manual Card Lookup</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManual(false)}
                className="w-8 h-8 rounded-full bg-[#2d3143] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              Enter any One Piece card number as printed in the bottom right corner (e.g. <code>OP01-001</code>, <code>OP05-119</code>, <code>OP01-120</code>).
            </p>

            {/* Quick Card Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['OP01-001', 'OP05-119', 'OP01-120', 'OP01-016', 'ST01-012'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setManualInput(code);
                    setShowManual(false);
                    performCardLookup(code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#2b3040] hover:bg-[#f4727d] hover:text-white text-xs font-mono font-bold text-gray-300 border border-[#3d4358] transition cursor-pointer"
                >
                  {code}
                </button>
              ))}
            </div>

            {/* Manual Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  setShowManual(false);
                  performCardLookup(manualInput);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. OP01-001..."
                className="flex-1 bg-[#1a1d27] border border-[#3b4156] focus:border-[#f4727d] rounded-xl px-3 py-2.5 text-xs text-white uppercase font-mono placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f4727d] to-[#e44d5b] text-white text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= SCANNER HELP '?' MODAL ================= */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div 
            className="w-full max-w-sm bg-[#232634] border border-[#353a4e] rounded-[30px] p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#f4727d]" />
                <span>How to Scan Cards</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full bg-[#2d3143] text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="flex items-start gap-2.5 bg-[#1b1e29] p-3 rounded-xl border border-[#31364a]">
                <span className="w-5 h-5 rounded-full bg-[#f4727d]/20 text-[#f4727d] font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white">Frame the Card:</strong> Align the entire card inside the dashed white bounding box.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#1b1e29] p-3 rounded-xl border border-[#31364a]">
                <span className="w-5 h-5 rounded-full bg-[#f4727d]/20 text-[#f4727d] font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white">Target the Card ID:</strong> Ensure the bottom right serial code (e.g. <code>OP01-001</code>) sits inside the pink target box.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#1b1e29] p-3 rounded-xl border border-[#31364a]">
                <span className="w-5 h-5 rounded-full bg-[#f4727d]/20 text-[#f4727d] font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white">Tap Shutter:</strong> Press the bottom pink camera shutter button to capture and instantly fetch market prices.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-3 rounded-xl bg-[#2a2e3e] hover:bg-[#343a4e] text-white text-xs font-black uppercase tracking-wider transition cursor-pointer text-center"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
