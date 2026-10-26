"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";

export default function AngketPage() {
  const params = useParams();
  const router = useRouter();

  const [ratings, setRatings] = useState<{ [key: string]: number }>({
    "kemudahan_penggunaan": 5,
    "kemenarikan_visual": 5,
    "kejelasan_petunjuk": 4,
    "kemanfaatan": 5,
  });

  const [kendala, setKendala] = useState("");
  const [saran, setSaran] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const indicators = [
    { key: "kemudahan_penggunaan", label: "Kemudahan Penggunaan Antarmuka Kanvas" },
    { key: "kemenarikan_visual", label: "Kemenarikan Visual dan Keterbacaan Warna" },
    { key: "kejelasan_petunjuk", label: "Kejelasan Petunjuk Soal dan Umpan Balik Hint" },
    { key: "kemanfaatan", label: "Kemanfaatan Sistem dalam Memahami Konsep Fisika" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("fisgrade_student_token") || "";

    try {
      await apiFetch("/api/surveys", {
        method: "POST",
        body: JSON.stringify({
          ratings,
          notes: {
            "operasional teknis": kendala,
            "tampilan": saran,
          },
        }),
      }, token);

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6 select-none">
        <Card className="max-w-md w-full bg-white border-surface-200 text-center p-6 shadow-sm">
          <div className="size-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="size-7" />
          </div>
          <CardTitle className="text-xl text-navy-900">Terima Kasih!</CardTitle>
          <CardDescription className="text-sm text-ink-600 mt-2">
            Penilaian dan masukan Anda sangat berharga untuk pengembangan FisGrade ke depan.
          </CardDescription>
          <CardFooter className="flex justify-center mt-6">
            <Button onClick={() => router.push("/")} className="bg-navy-700 hover:bg-navy-500 text-white text-xs">
              Selesai dan Kembali ke Beranda
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 p-6 flex items-center justify-center select-none">
      <Card className="max-w-2xl w-full bg-white border-surface-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-navy-700 mb-1">
            <MessageSquare className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Modul Evaluasi Praktikalitas</span>
          </div>
          <CardTitle className="text-xl text-navy-900">Angket Kepraktisan FisGrade</CardTitle>
          <CardDescription className="text-sm text-ink-600">
            Bantu kami menilai kepraktisan aplikasi ini (Skala 1 = Sangat Tidak Setuju, 5 = Sangat Setuju).
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-5">
            {/* Likert 1-5 Radio Groups */}
            <div className="flex flex-col gap-4">
              {indicators.map((ind) => (
                <div key={ind.key} className="flex flex-col gap-1.5 border-b border-surface-200 pb-3">
                  <span className="text-xs font-semibold text-navy-900">{ind.label}</span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-ink-600">Sangat Tidak Setuju</span>
                    <div className="flex items-center gap-4">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={ind.key}
                            value={val}
                            checked={ratings[ind.key] === val}
                            onChange={() => setRatings({ ...ratings, [ind.key]: val })}
                            className="size-4 accent-navy-700 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-navy-900">{val}</span>
                        </label>
                      ))}
                    </div>
                    <span className="text-[11px] text-ink-600">Sangat Setuju</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Qualitative Notes (FR-L3) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-navy-900">Kendala yang Anda temui:</label>
              <Textarea
                value={kendala}
                onChange={(e) => setKendala(e.target.value)}
                placeholder="Tuliskan kendala teknis atau visual selama pengerjaan..."
                className="text-xs min-h-16 border-surface-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-navy-900">Saran perbaikan:</label>
              <Textarea
                value={saran}
                onChange={(e) => setSaran(e.target.value)}
                placeholder="Tuliskan saran perbaikan untuk pengembangan selanjutnya..."
                className="text-xs min-h-16 border-surface-200"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 pt-2 border-t border-surface-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="border-surface-200 text-ink-600 text-xs"
            >
              Lewati
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold px-5"
            >
              {loading ? "Mengirim..." : "Kirim Penilaian"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
