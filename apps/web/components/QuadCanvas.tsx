"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerbalPanel } from "@/components/VerbalPanel";
import { VisualPanel, VisualData } from "@/components/VisualPanel";
import { MathPanel, MathData } from "@/components/MathPanel";
import { GraphPanel, GraphData } from "@/components/GraphPanel";
import { ContradictionOverlay, ContradictionUI } from "@/components/ContradictionOverlay";
import { HintModal } from "@/components/HintModal";
import { apiFetch } from "@/lib/api";
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, LogOut } from "lucide-react";

interface QuadCanvasProps {
  submissionId: string;
  initialQuestion: any;
  token: string;
}

export function QuadCanvas({ submissionId, initialQuestion, token }: QuadCanvasProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas States
  const [verbal, setVerbal] = useState<string>(
    initialQuestion.kanvas?.verbal?.teks || ""
  );
  const [visual, setVisual] = useState<VisualData>(
    initialQuestion.kanvas?.visual || {
      representasi: "visual",
      objek: [
        { id: "o1", tipe: "balok" },
        { id: "o2", tipe: "bidang_datar", kasar: true },
      ],
      gaya: [],
      sumbu: { x: "kanan" },
    }
  );
  const [matematis, setMatematis] = useState<MathData>(
    initialQuestion.kanvas?.matematis || {
      representasi: "matematis",
      baris: [{ id: "m1", ekspresi: "sum_F = m*a", sintaks_ok: true }],
    }
  );
  const [grafis, setGrafis] = useState<GraphData>(
    initialQuestion.kanvas?.grafis || {
      representasi: "grafis",
      jenis: "v-t",
      sumbu_x: { nama: "t", satuan: "s" },
      sumbu_y: { nama: "v", satuan: "m/s" },
      titik: [[0, 0], [8, 32]],
      bentuk: "linear",
      kemiringan: 4.0,
    }
  );

  // System states
  const [saveStatus, setSaveStatus] = useState<"Menyimpan..." | "Tersimpan" | "Belum tersimpan, coba lagi">("Tersimpan");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialQuestion.sisa_detik || 2700);
  const [contradictions, setContradictions] = useState<ContradictionUI[]>([]);
  const [selectedContradiction, setSelectedContradiction] = useState<ContradictionUI | null>(null);
  const [heldScores, setHeldScores] = useState<string[]>([]);
  const [llmPending, setLlmPending] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time is up (AC-08)
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Autosave when canvases change
  const saveCanvas = async (rep: string, dataObj: any) => {
    setSaveStatus("Menyimpan...");
    try {
      await apiFetch(
        `/api/submissions/${submissionId}/canvas/${rep}`,
        {
          method: "PUT",
          body: JSON.stringify(dataObj),
        },
        token
      );
      setSaveStatus("Tersimpan");
    } catch (e) {
      setSaveStatus("Belum tersimpan, coba lagi");
    }
  };

  // Debounced auto-save & auto-check (7 seconds idle)
  const idleCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerConsistencyCheck = async () => {
    setIsChecking(true);
    try {
      const res: any = await apiFetch(
        `/api/submissions/${submissionId}/check`,
        { method: "POST" },
        token
      );
      setContradictions(res.kontradiksi || []);
      setHeldScores(res.skor_ditahan || []);
      setLlmPending(res.pemeriksaan_makna_tertunda || false);
    } catch (e) {
      console.error("Check failed:", e);
    } finally {
      setIsChecking(false);
    }
  };

  const scheduleCheck = () => {
    if (idleCheckTimeoutRef.current) clearTimeout(idleCheckTimeoutRef.current);
    idleCheckTimeoutRef.current = setTimeout(() => {
      triggerConsistencyCheck();
    }, 7000); // 7 seconds idle (TDD 20.5)
  };

  // Handle updates
  const handleVerbalChange = (teks: string) => {
    setVerbal(teks);
    saveCanvas("verbal", { representasi: "verbal", teks });
    scheduleCheck();
  };

  const handleVisualChange = (val: VisualData) => {
    setVisual(val);
    saveCanvas("visual", val);
    scheduleCheck();
  };

  const handleMathChange = (val: MathData) => {
    setMatematis(val);
    saveCanvas("matematis", val);
    scheduleCheck();
  };

  const handleGraphChange = (val: GraphData) => {
    setGrafis(val);
    saveCanvas("grafis", val);
    scheduleCheck();
  };

  const handleAttempt = async (cId: string) => {
    await apiFetch(`/api/contradictions/${cId}/attempt`, { method: "POST" }, token);
    triggerConsistencyCheck();
  };

  const handleUnlockHint = async (cId: string) => {
    const res = await apiFetch(`/api/contradictions/${cId}/hint`, { method: "POST" }, token);
    triggerConsistencyCheck();
    return res;
  };

  const handleSubmit = async () => {
    if (confirm("Kirim jawaban? Anda tidak dapat mengubahnya setelah dikirim. Ketidaksesuaian yang belum selesai akan diteruskan ke dosen.")) {
      try {
        await apiFetch(`/api/submissions/${submissionId}/submit`, { method: "POST" }, token);
        router.push(`/sesi/${initialQuestion.submission_id}/hasil`);
      } catch (e: any) {
        alert(e.message || "Gagal mengirim jawaban");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-surface-50 text-navy-900 select-none overflow-hidden">
      {/* 1. Header Bar (W-07) */}
      <header className="h-14 bg-white border-b border-surface-200 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-navy-700 tracking-tight">FisGrade</span>
          <span className="text-surface-200">|</span>
          <span className="font-semibold text-sm text-navy-900">Hukum Newton — Soal 1/1</span>
          <span className="text-surface-200">|</span>
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "Tersimpan" ? (
              <span className="text-success flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Tersimpan
              </span>
            ) : saveStatus === "Menyimpan..." ? (
              <span className="text-ink-600 flex items-center gap-1 animate-pulse">
                <RefreshCw className="size-3 animate-spin" /> Menyimpan...
              </span>
            ) : (
              <span className="text-error flex items-center gap-1">
                <AlertTriangle className="size-3.5" /> Belum tersimpan, coba lagi
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server-synced Timer (AC-01 / W-07) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold tabular-nums border ${
              secondsRemaining <= 300
                ? "bg-warning/10 text-warning border-warning animate-pulse"
                : "bg-surface-50 text-navy-900 border-surface-200"
            }`}
          >
            <Clock className="size-3.5" />
            <span>Sisa waktu {formatTimer(secondsRemaining)}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-xs text-ink-600 hover:text-navy-900 gap-1"
          >
            <LogOut className="size-3.5" data-icon="inline-start" /> Keluar
          </Button>
        </div>
      </header>

      {/* LLM Mode Warning Banner (FR-M1: Pemeriksaan makna tertunda) */}
      {llmPending && (
        <div className="bg-navy-100 border-b border-navy-500/20 px-4 py-1 text-xs text-navy-700 flex items-center justify-center font-medium">
          Pemeriksaan makna tertunda (Sistem beroperasi pada mode aturan deterministik).
        </div>
      )}

      {/* 2. Soal Prompt Bar */}
      <div className="bg-white border-b border-surface-200 px-4 py-2.5 shadow-sm">
        <p className="text-xs text-ink-600 font-bold uppercase tracking-wider mb-0.5">SOAL</p>
        <p className="text-sm font-medium text-navy-900 leading-snug">
          {initialQuestion.teks ||
            "Sebuah balok bermassa 5 kg ditarik gaya F = 30 N ke kanan di atas bidang datar kasar (mu_k = 0,2; g = 10 m/s^2). Jelaskan gaya yang bekerja dan tunjukkan gerak balok."}
        </p>
      </div>

      {/* 3. Quad Canvas Grid (2x2) with Contradiction Overlay */}
      <div ref={containerRef} className="flex-1 p-3 grid grid-cols-2 grid-rows-2 gap-3 relative overflow-hidden min-h-[460px]">
        {/* Panel 1: Verbal (Atas Kiri) */}
        <div className="h-full overflow-hidden">
          <VerbalPanel
            value={verbal}
            onChange={handleVerbalChange}
            highlighted={heldScores.includes("verbal")}
          />
        </div>

        {/* Panel 2: Visual (Atas Kanan) */}
        <div className="h-full overflow-hidden">
          <VisualPanel
            data={visual}
            onChange={handleVisualChange}
            highlightedElementId={
              contradictions.find((c) => c.status === "aktif")?.sumber.elemen
            }
          />
        </div>

        {/* Panel 3: Matematis (Bawah Kiri) */}
        <div className="h-full overflow-hidden">
          <MathPanel
            data={matematis}
            onChange={handleMathChange}
            highlightedLineId={
              contradictions.find((c) => c.status === "aktif")?.tujuan.elemen
            }
          />
        </div>

        {/* Panel 4: Grafis (Bawah Kanan) */}
        <div className="h-full overflow-hidden">
          <GraphPanel
            data={grafis}
            onChange={handleGraphChange}
            highlighted={heldScores.includes("grafis")}
          />
        </div>

        {/* Contradiction Curve & Hint Button Overlay */}
        <ContradictionOverlay
          contradictions={contradictions}
          onSelectContradiction={(c) => setSelectedContradiction(c)}
          containerRef={containerRef}
        />
      </div>

      {/* 4. Footer Bar */}
      <footer className="h-14 bg-white border-t border-surface-200 px-4 flex items-center justify-between z-20">
        <Button
          size="sm"
          variant="outline"
          onClick={triggerConsistencyCheck}
          disabled={isChecking}
          className="border-surface-200 text-navy-700 hover:bg-surface-50 text-xs font-semibold gap-1.5"
        >
          {isChecking ? (
            <>
              <RefreshCw className="size-3.5 animate-spin" data-icon="inline-start" /> Memeriksa kesesuaian...
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5" data-icon="inline-start" /> Periksa sekarang
            </>
          )}
        </Button>

        <div className="flex items-center gap-3">
          {heldScores.length > 0 && (
            <span className="text-xs text-warning flex items-center gap-1 font-medium">
              <AlertTriangle className="size-3.5" /> Skor {heldScores.join(", ")} ditahan
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-4"
          >
            Selesai & Kirim
          </Button>
        </div>
      </footer>

      {/* Modal Hint Ketidaksesuaian */}
      <HintModal
        contradiction={selectedContradiction}
        onClose={() => setSelectedContradiction(null)}
        onAttempt={handleAttempt}
        onUnlockHint={handleUnlockHint}
      />
    </div>
  );
}
