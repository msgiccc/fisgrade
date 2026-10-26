"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, HelpCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function InstruksiPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-white border-surface-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy-700 bg-navy-100 px-2.5 py-0.5 rounded-full">
              Hukum Newton tentang Gerak
            </span>
            <div className="flex items-center gap-1 text-xs text-ink-600 font-medium">
              <Clock className="size-3.5" /> 45 Menit | 1 Soal
            </div>
          </div>
          <CardTitle className="text-xl text-navy-900 mt-2">Petunjuk Pengerjaan Asesmen</CardTitle>
          <CardDescription className="text-ink-600 text-sm">
            Bacalah petunjuk di bawah ini sebelum Anda memulai pengerjaan kanvas kuadran.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3.5 text-sm text-navy-900">
          <div className="flex items-start gap-2.5">
            <span className="size-6 rounded-full bg-navy-100 text-navy-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="leading-relaxed">
              Jawablah persoalan melalui <strong>empat kanvas</strong> yang tampil bersamaan:{" "}
              <strong>Verbal</strong> (penjelasan), <strong>Visual</strong> (diagram benda bebas),{" "}
              <strong>Matematis</strong> (persamaan), dan <strong>Grafis</strong> (grafik v–t).
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-6 rounded-full bg-navy-100 text-navy-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p className="leading-relaxed">
              Sistem akan secara otomatis <strong>memeriksa konsistensi</strong> antarkanvas saat Anda
              berhenti mengetik selama jeda beberapa detik (atau saat tombol <em>Periksa sekarang</em> ditekan).
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-6 rounded-full bg-navy-100 text-navy-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="leading-relaxed">
              Jika ditemukan ketidaksesuaian, <strong>garis putus-putus berwarna amber</strong> dengan ikon
              bola lampu akan menghubungkan elemen terkait. Klik ikon tersebut untuk memilih <em>Coba perbaiki</em>{" "}
              atau <em>Gunakan hint</em>.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-6 rounded-full bg-navy-100 text-navy-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <p className="leading-relaxed">
              Setiap hint bertingkat akan membantu proses berpikir Anda, namun akan mengurangi batas skor
              maksimum pada representasi yang dibantu.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-6 rounded-full bg-navy-100 text-navy-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              5
            </span>
            <p className="leading-relaxed">
              Skor akhir diberikan terpisah per representasi (skala 0–100) dan disajikan dalam bentuk diagram radar
              belah ketupat.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-2">
          <Button
            onClick={() => router.push(`/sesi/${submissionId}/kerjakan`)}
            className="bg-navy-700 hover:bg-navy-500 text-white font-medium gap-2 px-6"
          >
            Mulai mengerjakan <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
