"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentCanvasesViewer } from "@/components/StudentCanvasesViewer";
import { apiFetch } from "@/lib/api";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  AlertTriangle,
  Clock,
  Gauge,
  Film
} from "lucide-react";

interface ReplayFrame {
  step: number;
  waktu: string;
  label: string;
  deskripsi: string;
  canvases: any;
  kontradiksi_aktif?: string | null;
}

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  studentName: string;
  studentNim: string;
  token: string;
}

export function ReplayModal({
  isOpen,
  onClose,
  submissionId,
  studentName,
  studentNim,
  token,
}: ReplayModalProps) {
  const [loading, setLoading] = useState(true);
  const [frames, setFrames] = useState<ReplayFrame[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load replay data when modal opens
  useEffect(() => {
    if (!isOpen || !submissionId) return;

    setLoading(true);
    setIsPlaying(false);
    setCurrentStep(0);

    apiFetch(`/api/submissions/${submissionId}/replay`, {}, token)
      .then((res: any) => {
        const loadedFrames: ReplayFrame[] = res.frames || [];
        setFrames(loadedFrames);
      })
      .catch((err) => {
        console.error("Gagal memuat data replay:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, submissionId, token]);

  // Handle Play/Pause playback timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = speed === 1 ? 1500 : 750;
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, frames.length]);

  if (!isOpen) return null;

  const currentFrame = frames[currentStep] || null;
  const totalFrames = frames.length;

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(totalFrames - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const togglePlay = () => {
    if (currentStep >= totalFrames - 1) {
      setCurrentStep(0);
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-surface-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between bg-surface-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-700 text-white rounded-lg">
              <Film className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-navy-900 text-base">
                  Reka Ulang Proses Pengerjaan (Replay)
                </h3>
                <Badge variant="outline" className="font-mono text-xs border-surface-200 text-navy-700">
                  {studentNim}
                </Badge>
              </div>
              <p className="text-xs text-ink-600 mt-0.5">
                Mahasiswa: <strong>{studentName}</strong> • Tinjauan evolusi pengerjaan 4 representasi secara kronologis.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-ink-600 hover:text-navy-900 rounded-full size-8 p-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-ink-600 text-sm">
              <div className="size-8 rounded-full border-2 border-navy-700 border-t-transparent animate-spin" />
              <span>Memuat frame reka ulang pengerjaan...</span>
            </div>
          ) : totalFrames === 0 ? (
            <div className="py-20 text-center text-ink-600 text-sm italic">
              Tidak ada riwayat langkah pengerjaan untuk submisi ini.
            </div>
          ) : (
            <>
              {/* Event Step Status & Notice */}
              <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-navy-700 text-white text-xs px-2.5 py-0.5 font-semibold">
                    Langkah {currentStep + 1} / {totalFrames}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-ink-600 font-mono">
                    <Clock className="size-3.5 text-navy-700" />
                    {currentFrame?.waktu || "--:--:--"}
                  </span>
                  <span className="text-navy-900 text-xs font-semibold">
                    {currentFrame?.label}
                  </span>
                </div>

                {currentFrame?.kontradiksi_aktif ? (
                  <Badge className="bg-warning/15 text-warning border border-warning/30 text-xs font-medium flex items-center gap-1 px-2.5 py-1">
                    <AlertTriangle className="size-3.5 text-warning" />
                    Kontradiksi Terdeteksi: {currentFrame.kontradiksi_aktif}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-success border-success/30 bg-success/10 text-xs font-medium px-2.5 py-0.5">
                    Konsisten / Normal
                  </Badge>
                )}
              </div>

              {/* Action Description */}
              <div className="text-xs text-navy-800 bg-white border border-surface-200 rounded-lg px-4 py-2 font-mono">
                <span className="font-semibold text-ink-600">Aktivitas Mahasiswa: </span>
                {currentFrame?.deskripsi}
              </div>

              {/* Visual 4 Canvases at this Frame */}
              <div className="border border-surface-200 rounded-xl p-4 bg-white shadow-xs">
                <h4 className="text-xs font-bold text-navy-900 mb-3 uppercase tracking-wide">
                  Keadaan 4 Kanvas pada Langkah Ini
                </h4>
                <StudentCanvasesViewer canvases={currentFrame?.canvases || null} />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer: Replay Player Controls (W-23 / UI/UX 11.2 item 11) */}
        {!loading && totalFrames > 0 && (
          <div className="px-6 py-4 bg-surface-50 border-t border-surface-200 flex flex-col gap-3">
            {/* Scrubber Range Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-ink-600 w-8 text-right">
                1
              </span>
              <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={currentStep}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStep(parseInt(e.target.value) || 0);
                }}
                className="w-full accent-navy-700 cursor-pointer h-2 bg-surface-200 rounded-lg"
              />
              <span className="text-xs font-mono text-ink-600 w-8">
                {totalFrames}
              </span>
            </div>

            {/* Playback Button Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={currentStep === 0}
                  className="size-8 p-0 border-surface-200 text-ink-600 hover:text-navy-900"
                  title="Kembali ke awal"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStepBack}
                  disabled={currentStep === 0}
                  className="size-8 p-0 border-surface-200 text-ink-600 hover:text-navy-900"
                  title="Langkah sebelumnya"
                >
                  <SkipBack className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={togglePlay}
                  className="bg-navy-700 hover:bg-navy-500 text-white font-semibold text-xs px-4 h-8 flex items-center gap-1.5"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="size-3.5 fill-white" /> Jeda
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5 fill-white" /> Putar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStepForward}
                  disabled={currentStep === totalFrames - 1}
                  className="size-8 p-0 border-surface-200 text-ink-600 hover:text-navy-900"
                  title="Langkah selanjutnya"
                >
                  <SkipForward className="size-3.5" />
                </Button>
              </div>

              {/* Speed Controller & Frame Index */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white border border-surface-200 rounded-lg p-0.5 text-xs font-mono">
                  <span className="px-2 text-ink-600 flex items-center gap-1 text-[11px]">
                    <Gauge className="size-3 text-navy-700" /> Kecepatan:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSpeed(1)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      speed === 1
                        ? "bg-navy-700 text-white font-bold"
                        : "text-ink-600 hover:text-navy-900"
                    }`}
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeed(2)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      speed === 2
                        ? "bg-navy-700 text-white font-bold"
                        : "text-ink-600 hover:text-navy-900"
                    }`}
                  >
                    2x
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs border-surface-200 text-navy-900 h-8"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}