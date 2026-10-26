"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Lock, BookOpen, Eye } from "lucide-react";

export default function KatalogPaketPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res: any = await apiFetch("/api/packages");
        setPackages(res || []);
        if (res && res.length > 0) {
          const detail: any = await apiFetch(`/api/packages/${res[0].id}`);
          setSelectedPkg(detail);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectPkg = async (id: string) => {
    try {
      const detail: any = await apiFetch(`/api/packages/${id}`);
      setSelectedPkg(detail);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col select-none">
      <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dosen">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-ink-600 hover:text-navy-900">
              <ArrowLeft className="size-3.5" data-icon="inline-start" /> Kelas
            </Button>
          </Link>
          <span className="text-surface-200">/</span>
          <span className="font-bold text-navy-900 text-sm">Katalog Paket Soal</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 flex flex-col gap-3">
          <h1 className="text-lg font-bold text-navy-900 mb-1">Paket Soal Bawaan</h1>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => handleSelectPkg(pkg.id)}
              className={`p-4 rounded-xl border bg-white cursor-pointer transition-all shadow-sm ${
                selectedPkg?.id === pkg.id
                  ? "border-navy-700 ring-2 ring-navy-700/20"
                  : "border-surface-200 hover:border-navy-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="font-mono text-[10px] text-navy-700 border-navy-500">
                  v{pkg.versi}
                </Badge>
                <span className="text-[10px] text-ink-600 flex items-center gap-1">
                  <Lock className="size-3 text-navy-700" /> Dikelola sistem
                </span>
              </div>
              <h2 className="text-sm font-bold text-navy-900">{pkg.judul}</h2>
              <p className="text-xs text-ink-600 mt-0.5">Topik: {pkg.topik}</p>
            </div>
          ))}
        </div>

        <div className="md:col-span-7">
          {selectedPkg ? (
            <Card className="border-surface-200 bg-white shadow-sm">
              <CardHeader className="border-b border-surface-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-navy-700 bg-navy-100 px-2 py-0.5 rounded">
                      Pratinjau Soal (Khusus Dosen)
                    </span>
                    <CardTitle className="text-base text-navy-900 mt-1">{selectedPkg.judul}</CardTitle>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    v{selectedPkg.versi}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4 text-xs text-navy-900">
                {selectedPkg.soal?.map((q: any) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <span className="font-bold text-navy-700">Soal {q.urutan}:</span>
                    <p className="p-3 bg-surface-50 border border-surface-200 rounded-lg text-xs leading-relaxed text-navy-900">
                      {q.teks_soal}
                    </p>

                    <span className="font-bold text-navy-700 mt-2">Kunci Penyelesaian (Hanya di Server):</span>
                    <div className="p-3 bg-navy-100/50 border border-navy-500/20 rounded-lg text-[11px] font-mono leading-relaxed text-navy-900">
                      • N = 50 N, f_k = 10 N, a = 4 m/s²<br />
                      • Grafik: v–t linear kemiringan 4.0 m/s²<br />
                      • Diagram: Balok, Bidang Datar, gaya N (90°), W (270°), F (0°), f_k (180°)
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="border border-surface-200 rounded-xl bg-white p-8 text-center text-xs text-ink-600">
              Pilih paket soal untuk melihat pratinjau.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
