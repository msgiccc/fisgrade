"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, BookOpen, GraduationCap, Layers, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [kodeSesi, setKodeSesi] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGabung = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = kodeSesi.trim().toUpperCase();
    if (cleanKode.length !== 6) {
      setErrorMsg("Kode sesi harus terdiri dari 6 karakter");
      return;
    }
    setErrorMsg("");
    router.push(`/gabung/${cleanKode}`);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-navy-700 flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          <span className="font-bold text-xl text-navy-900 tracking-tight">FisGrade</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/masuk">
            <Button variant="outline" size="sm" className="border-surface-200 text-navy-700 hover:bg-surface-50">
              Masuk
            </Button>
          </Link>
          <Link href="/daftar">
            <Button size="sm" className="bg-navy-700 hover:bg-navy-500 text-white">
              Daftar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-navy-700 bg-navy-100 px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" /> Asesmen Proses Multirepresentasi
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-navy-900 tracking-tight max-w-2xl leading-tight">
          Asesmen fisika yang memandu proses berpikir
        </h1>
        <p className="text-base text-ink-600 mt-3 max-w-xl">
          Empat representasi, satu layar, umpan balik saat Anda bekerja. Menemukan dan mengatasi miskonsepsi secara transparan.
        </p>

        {/* 2 Roles Cards (W-01) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-10 text-left">
          {/* Kartu Dosen */}
          <Card className="border-surface-200 shadow-sm hover:shadow transition-shadow bg-white flex flex-col justify-between">
            <CardHeader>
              <div className="size-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-2">
                <GraduationCap className="size-5" />
              </div>
              <CardTitle className="text-lg text-navy-900">Untuk Dosen</CardTitle>
              <CardDescription className="text-sm text-ink-600">
                Kelola kelas, buka sesi asesmen, dan pantau proses berpikir mahasiswa secara langsung.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/masuk" className="w-full">
                <Button variant="outline" className="w-full border-navy-700 text-navy-700 hover:bg-navy-100/50 gap-2">
                  Masuk sebagai dosen <ArrowRight className="size-4" data-icon="inline-end" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Kartu Mahasiswa */}
          <Card className="border-surface-200 shadow-sm hover:shadow transition-shadow bg-white flex flex-col justify-between">
            <CardHeader>
              <div className="size-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-2">
                <BookOpen className="size-5" />
              </div>
              <CardTitle className="text-lg text-navy-900">Untuk Mahasiswa</CardTitle>
              <CardDescription className="text-sm text-ink-600">
                Masukkan 6 karakter kode sesi dari dosen pengampu untuk mulai mengerjakan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGabung} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    value={kodeSesi}
                    onChange={(e) => setKodeSesi(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="Contoh: ABC123"
                    className="font-mono uppercase tracking-widest text-center text-base border-surface-200 text-navy-900"
                  />
                  <Button type="submit" className="bg-navy-700 hover:bg-navy-500 text-white font-medium">
                    Gabung
                  </Button>
                </div>
                {errorMsg && <p className="text-xs text-error">{errorMsg}</p>}
              </form>
            </CardContent>
            <CardFooter className="pt-0">
              <span className="text-xs text-ink-600">Tidak memerlukan akun; cukup kode sesi, nama, dan NIM.</span>
            </CardFooter>
          </Card>
        </div>

        {/* 4 Quadrants Visual Showcase */}
        <div className="mt-14 w-full max-w-3xl border border-surface-200 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-ink-600 uppercase tracking-wider">
            <Layers className="size-4 text-navy-700" />
            <span>Empat Representasi Fisis dalam Satu Layar</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-left">
            <div className="border border-surface-200 rounded-lg p-3 bg-surface-50">
              <span className="font-bold text-navy-700 block mb-1">1. Verbal</span>
              <span className="text-ink-600">Menjelaskan prinsip fisis, interaksi gaya, dan keadaan gerak dengan kata-kata.</span>
            </div>
            <div className="border border-surface-200 rounded-lg p-3 bg-surface-50">
              <span className="font-bold text-navy-700 block mb-1">2. Visual</span>
              <span className="text-ink-600">Mengonstruksi diagram benda bebas, arah vektor, dan panjang gaya relatif.</span>
            </div>
            <div className="border border-surface-200 rounded-lg p-3 bg-surface-50">
              <span className="font-bold text-navy-700 block mb-1">3. Matematis</span>
              <span className="text-ink-600">Menyusun persamaan hukum Newton, substitusi nilai, dan satuan fisis.</span>
            </div>
            <div className="border border-surface-200 rounded-lg p-3 bg-surface-50">
              <span className="font-bold text-navy-700 block mb-1">4. Grafis</span>
              <span className="text-ink-600">Memetakan grafik hubungan besaran fisis (v-t) dengan kemiringan dan sumbu.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-surface-200 bg-white px-6 flex items-center justify-between text-xs text-ink-600">
        <span>© 2026 FisGrade — Asesmen Formatif Fisika</span>
        <span>Topik: Hukum Newton tentang Gerak</span>
      </footer>
    </div>
  );
}
