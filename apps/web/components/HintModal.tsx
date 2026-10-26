"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, HelpCircle, ArrowRight } from "lucide-react";
import { ContradictionUI } from "@/components/ContradictionOverlay";

interface HintModalProps {
  contradiction: ContradictionUI | null;
  onClose: () => void;
  onAttempt: (cId: string) => Promise<void>;
  onUnlockHint: (cId: string) => Promise<any>;
}

export function HintModal({
  contradiction,
  onClose,
  onAttempt,
  onUnlockHint,
}: HintModalProps) {
  const [viewState, setViewState] = useState<"choice" | "hint">("choice");
  const [hintData, setHintData] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contradiction) {
      if (contradiction.hint_level > 0) {
        setViewState("hint");
      } else {
        setViewState("choice");
      }
      setHintData(null);
    }
  }, [contradiction]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!contradiction) return null;

  const handleChooseAttempt = async () => {
    setLoading(true);
    try {
      await onAttempt(contradiction.id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseHint = async () => {
    setLoading(true);
    try {
      const res = await onUnlockHint(contradiction.id);
      setHintData(res);
      setViewState("hint");
    } catch (e: any) {
      if (e.message && e.message.includes("tunggu_detik")) {
        // Cooldown timer
        setCountdown(15);
      }
    } finally {
      setLoading(false);
    }
  };

  const sisaPercobaan = Math.max(0, contradiction.percobaan_maks - contradiction.percobaan_terpakai);
  const isLocked = contradiction.coba_perbaiki_terkunci || sisaPercobaan === 0;

  return (
    <Dialog open={!!contradiction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border-surface-200">
        <DialogHeader>
          <DialogTitle className="text-navy-900 text-lg flex items-center gap-2">
            <AlertCircle className="size-5 text-warning" />
            Sepertinya ada ketidaksesuaian di sini
          </DialogTitle>
        </DialogHeader>

        {viewState === "choice" ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-ink-600">
              <span className="font-semibold text-navy-900">
                {contradiction.sumber.representasi.toUpperCase()}
              </span>{" "}
              dan{" "}
              <span className="font-semibold text-navy-900">
                {contradiction.tujuan.representasi.toUpperCase()}
              </span>{" "}
              belum sejalan.
            </p>

            <div className="bg-surface-50 p-2.5 rounded border border-surface-200 text-xs flex flex-col gap-1">
              <div className="flex justify-between font-medium text-navy-900">
                <span>Sisa percobaan Coba perbaiki:</span>
                <span className="tabular-nums font-bold text-navy-700">
                  {sisaPercobaan} dari {contradiction.percobaan_maks}
                </span>
              </div>
              <p className="text-ink-600">
                Hint menurunkan batas skor representasi yang dibantu ({contradiction.representasi_menyimpang.join(", ")}).
              </p>
            </div>

            {isLocked && (
              <p className="text-xs text-warning font-medium">
                Percobaan habis. Gunakan hint untuk melanjutkan pengerjaan.
              </p>
            )}

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleChooseAttempt}
                disabled={isLocked || loading}
                className="border-surface-200 text-navy-900"
              >
                Coba perbaiki
              </Button>
              <Button
                size="sm"
                onClick={handleChooseHint}
                disabled={loading}
                className="bg-navy-700 hover:bg-navy-500 text-white"
              >
                Gunakan hint
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-navy-700 border-navy-500 font-semibold">
                Hint (Level {hintData?.level || contradiction.hint_level} dari 3)
              </Badge>
              <span className="text-xs text-error font-medium">
                Penalti: -{hintData?.penalti || 5}
              </span>
            </div>

            <div className="p-3 bg-navy-100 rounded-md border border-navy-500/20 text-sm leading-relaxed text-navy-900">
              {hintData?.teks || (
                <span>
                  Periksa hubungan antara elemen di kanvas{" "}
                  {contradiction.sumber.representasi} dan {contradiction.tujuan.representasi}.
                </span>
              )}
            </div>

            {countdown > 0 && (
              <p className="text-xs text-warning font-medium">
                Hint level 3 dapat dibuka dalam {countdown} detik.
              </p>
            )}

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Kembali memperbaiki
              </Button>
              {(hintData?.level || contradiction.hint_level) < 3 && (
                <Button
                  size="sm"
                  onClick={handleChooseHint}
                  disabled={countdown > 0 || loading}
                  className="bg-navy-700 hover:bg-navy-500 text-white gap-1"
                >
                  Hint level {(hintData?.level || contradiction.hint_level) + 1}
                  <ArrowRight className="size-3.5" data-icon="inline-end" />
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
