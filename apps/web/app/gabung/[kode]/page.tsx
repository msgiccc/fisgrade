"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { ShieldCheck, BookOpen } from "lucide-react";

export default function GabungSesiPage() {
  const params = useParams();
  const router = useRouter();
  const kode = (params.kode as string || "").toUpperCase();

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [persetujuan, setPersetujuan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleMulai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persetujuan) {
      setErrorMsg("Anda harus menyetujui persetujuan penggunaan data untuk melanjutkan.");
      return;
    }
    if (!nama.trim() || !nim.trim()) {
      setErrorMsg("Nama dan NIM wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res: any = await apiFetch("/api/join", {
        method: "POST",
        body: JSON.stringify({
          kode,
          nama: nama.trim(),
          nim: nim.trim(),
          persetujuan: true,
          versi_persetujuan: "1.0",
        }),
      });

      // Store student token and info
      localStorage.setItem("fisgrade_student_token", res.token);
      localStorage.setItem("fisgrade_participant_id", res.participant_id);
      localStorage.setItem("fisgrade_submission_id", res.submission_id);

      // Redirect to instruction / canvas
      router.push(`/sesi/${res.submission_id}/instruksi`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal bergabung ke sesi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white border-surface-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-navy-700 mb-1">
            <BookOpen className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Sesi Asesmen</span>
          </div>
          <CardTitle className="text-xl text-navy-900">Gabung Sesi: {kode}</CardTitle>
          <CardDescription className="text-ink-600 text-sm">
            Topik: Hukum Newton tentang Gerak. Data identitas Anda disimpan terpisah secara terenkripsi.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleMulai}>
          <CardContent className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-2.5 rounded bg-error/10 border border-error/20 text-xs text-error font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-900" htmlFor="nama">
                Nama Lengkap
              </label>
              <Input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Ahmad Fauzi"
                required
                className="text-sm border-surface-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-900" htmlFor="nim">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <Input
                id="nim"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Contoh: 2502001"
                required
                className="text-sm border-surface-200"
              />
            </div>

            {/* Persetujuan (W-04 / PRD 8.10 / AC-02) */}
            <div className="bg-surface-50 border border-surface-200 rounded p-3 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-navy-900">
                <ShieldCheck className="size-4 text-navy-700" />
                <span>Persetujuan Penggunaan Data</span>
              </div>
              <p className="text-ink-600 leading-relaxed">
                Tujuan asesmen formatif fisika dan penelitian pengembangan sistem. Data diproses secara
                pseudonim (nama & NIM disimpan terpisah). Evaluasi makna penjelasan menggunakan LLM pihak
                ketiga hanya mengirimkan ID acak dan data terstruktur tanpa identitas pribadi Anda. Audio
                dikte tidak pernah disimpan.
              </p>
              <label className="flex items-center gap-2 font-medium text-navy-900 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={persetujuan}
                  onChange={(e) => setPersetujuan(e.target.checked)}
                  className="size-4 accent-navy-700 rounded cursor-pointer"
                />
                <span>Saya telah membaca dan menyetujui</span>
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="border-surface-200 text-ink-600"
            >
              Kembali
            </Button>
            <Button
              type="submit"
              disabled={loading || !persetujuan}
              className="bg-navy-700 hover:bg-navy-500 text-white font-medium px-5"
            >
              {loading ? "Memproses..." : "Setuju dan Mulai"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
