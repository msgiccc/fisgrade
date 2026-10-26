"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Plus, FolderKanban, LogOut, ArrowRight, BookOpen } from "lucide-react";

export default function DosenDashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dosenNama, setDosenNama] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("fisgrade_dosen_token");
    const nama = localStorage.getItem("fisgrade_dosen_nama") || "Dosen Pengampu";
    setDosenNama(nama);

    if (!token) {
      router.push("/masuk");
      return;
    }

    async function loadClasses() {
      try {
        const res: any = await apiFetch("/api/classes", {}, token || undefined);
        setClasses(res || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("fisgrade_dosen_token");
    localStorage.removeItem("fisgrade_dosen_nama");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col select-none">
      {/* Top Navbar Dosen (W-15) */}
      <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dosen" className="flex items-center gap-2">
            <div className="size-8 rounded bg-navy-700 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <span className="font-bold text-xl text-navy-900 tracking-tight">FisGrade</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-600">
            <span className="text-navy-900 font-bold border-b-2 border-navy-700 pb-1">Kelas</span>
            <Link href="/dosen/paket" className="hover:text-navy-900">
              Paket Soal
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-navy-900">{dosenNama}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="text-xs text-ink-600 hover:text-error gap-1"
          >
            <LogOut className="size-3.5" data-icon="inline-start" /> Keluar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Kelas Saya</h1>
            <p className="text-xs text-ink-600 mt-1">
              Daftar kelas aktif untuk asesmen formatif proses fisika.
            </p>
          </div>
          <Link href="/dosen/kelas/baru">
            <Button size="sm" className="bg-navy-700 hover:bg-navy-500 text-white font-medium gap-1.5">
              <Plus className="size-4" data-icon="inline-start" /> Buat Kelas
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="size-7 rounded-full border-2 border-navy-700 border-t-transparent animate-spin" />
          </div>
        ) : classes.length === 0 ? (
          <div className="border border-surface-200 rounded-xl bg-white p-12 text-center flex flex-col items-center gap-3">
            <div className="size-12 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center">
              <FolderKanban className="size-6" />
            </div>
            <h2 className="text-base font-bold text-navy-900">Belum ada kelas</h2>
            <p className="text-xs text-ink-600 max-w-sm">
              Mulai dengan membuat kelas pertama Anda, kemudian buka sesi asesmen dengan paket soal bawaan sistem.
            </p>
            <Link href="/dosen/kelas/baru" className="mt-2">
              <Button size="sm" className="bg-navy-700 hover:bg-navy-500 text-white">
                Buat Kelas Baru
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((c) => (
              <Card key={c.id} className="border-surface-200 bg-white hover:shadow-sm transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-700 bg-navy-100 px-2 py-0.5 rounded w-max">
                    {c.semester || "Semester Berjalan"}
                  </span>
                  <CardTitle className="text-base text-navy-900 mt-1">{c.nama}</CardTitle>
                  <CardDescription className="text-xs text-ink-600">
                    Mata Kuliah: {c.mata_kuliah || "Fisika Dasar"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2 border-t border-surface-200">
                  <Link href={`/dosen/kelas/${c.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full border-surface-200 text-navy-700 hover:bg-surface-50 text-xs font-semibold justify-between">
                      <span>Buka Kelas</span>
                      <ArrowRight className="size-3.5" data-icon="inline-end" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
