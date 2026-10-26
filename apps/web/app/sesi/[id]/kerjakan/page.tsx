"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuadCanvas } from "@/components/QuadCanvas";
import { apiFetch } from "@/lib/api";
import { AlertCircle, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KerjakanPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [questionData, setQuestionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [token, setToken] = useState("");
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);

  useEffect(() => {
    // Screen width check (U-09: < 1024 px shows screen too small W-25)
    const checkScreen = () => {
      if (window.innerWidth < 1024) {
        setIsScreenTooSmall(true);
      } else {
        setIsScreenTooSmall(false);
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const studentToken = localStorage.getItem("fisgrade_student_token") || "";
    setToken(studentToken);

    if (!studentToken) {
      setErrorMsg("Sesi Anda tidak valid. Silakan bergabung kembali.");
      setLoading(false);
      return;
    }

    async function loadQuestion() {
      try {
        const res: any = await apiFetch("/api/me/question", {}, studentToken);
        setQuestionData(res);
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal memuat soal asesmen.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [submissionId]);

  // Screen too small view (W-25 / U-09)
  if (isScreenTooSmall) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md bg-white border border-surface-200 rounded-xl p-8 shadow-sm flex flex-col items-center gap-3">
          <div className="size-12 rounded-full bg-warning/10 text-warning flex items-center justify-center">
            <Monitor className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-navy-900">Layar terlalu kecil</h2>
          <p className="text-sm text-ink-600 leading-relaxed">
            FisGrade memerlukan tampilan empat kanvas secara bersamaan. Gunakan laptop atau tablet dengan layar
            lebar (minimal 1024 px), atau putar perangkat Anda ke orientasi lanskap.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-2 border-navy-700 text-navy-700 hover:bg-navy-100"
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 rounded-full border-2 border-navy-700 border-t-transparent animate-spin" />
          <span className="text-sm font-medium text-ink-600">Memuat kanvas pengerjaan...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white border border-error/30 rounded-xl p-6 shadow-sm text-center flex flex-col items-center gap-3">
          <AlertCircle className="size-8 text-error" />
          <h2 className="text-lg font-bold text-navy-900">Kendala Memuat Sesi</h2>
          <p className="text-sm text-ink-600">{errorMsg}</p>
          <Button onClick={() => router.push("/")} className="bg-navy-700 hover:bg-navy-500 text-white mt-2">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QuadCanvas
      submissionId={submissionId}
      initialQuestion={questionData}
      token={token}
    />
  );
}
