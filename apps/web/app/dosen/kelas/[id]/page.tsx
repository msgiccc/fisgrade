"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Plus, Users, Copy, Check, ExternalLink } from "lucide-react";

export default function DetailKelasPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("fisgrade_dosen_token");
    if (!token) {
      router.push("/masuk");
      return;
    }

    async function loadDetail() {
      try {
        const res: any = await apiFetch(`/api/classes/${classId}`, {}, token || undefined);
        setClassData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [classId]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="size-7 rounded-full border-2 border-navy-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <p className="text-sm text-error">Kelas tidak ditemukan.</p>
      </div>
    );
  }

  const sessions = classData.sessions || [];

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
          <span className="font-bold text-navy-900 text-base">{classData.nama}</span>
        </div>

        <Link href={`/dosen/kelas/${classId}/sesi/baru`}>
          <Button size="sm" className="bg-navy-700 hover:bg-navy-500 text-white font-medium gap-1.5 text-xs">
            <Plus className="size-3.5" data-icon="inline-start" /> Buka Sesi Baru
          </Button>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="bg-white border border-surface-200 rounded-xl p-5 mb-6 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-navy-900">{classData.nama}</h1>
            <p className="text-xs text-ink-600 mt-1">
              {classData.mata_kuliah} — {classData.semester}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-navy-700 border-navy-500 font-semibold text-xs">
              {sessions.length} Sesi Terbuka
            </Badge>
          </div>
        </div>

        <div className="bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">Daftar Sesi Asesmen</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-600">
              Belum ada sesi pada kelas ini. Klik tombol <strong>Buka Sesi Baru</strong> di atas untuk memulai.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-navy-100">
                <TableRow>
                  <TableHead className="text-navy-900 font-bold text-xs">Judul Sesi</TableHead>
                  <TableHead className="text-navy-900 font-bold text-xs">Kode Sesi</TableHead>
                  <TableHead className="text-navy-900 font-bold text-xs text-center">Status</TableHead>
                  <TableHead className="text-navy-900 font-bold text-xs text-center">Durasi</TableHead>
                  <TableHead className="text-navy-900 font-bold text-xs text-center">Peserta</TableHead>
                  <TableHead className="text-navy-900 font-bold text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-xs text-navy-900">{s.judul}</TableCell>
                    <TableCell className="text-xs">
                      <button
                        onClick={() => copyCode(s.kode)}
                        className="inline-flex items-center gap-1 font-mono font-bold text-navy-700 bg-surface-50 px-2 py-0.5 rounded border border-surface-200 hover:bg-navy-100 transition-colors"
                        title="Klik untuk menyalin kode sesi"
                      >
                        {s.kode}
                        {copiedCode === s.kode ? (
                          <Check className="size-3 text-success" />
                        ) : (
                          <Copy className="size-3 text-ink-600" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge
                        variant="outline"
                        className={
                          s.status === "dibuka"
                            ? "text-success border-success bg-success/5"
                            : s.status === "ditutup"
                            ? "text-ink-600 border-surface-200"
                            : "text-navy-700 border-navy-500"
                        }
                      >
                        {s.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{s.durasi_menit} mnt</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{s.peserta_count} mhs</TableCell>
                    <TableCell className="text-xs text-right">
                      <Link href={`/dosen/sesi/${s.id}/hasil`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-surface-200 text-navy-700 hover:bg-surface-50 font-semibold"
                        >
                          Hasil & Dasbor
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
