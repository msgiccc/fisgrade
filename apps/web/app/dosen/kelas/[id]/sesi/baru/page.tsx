"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { Copy, Check, ArrowRight, Lock } from "lucide-react";

export default function BukaSesiBaruPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");
  const [judul, setJudul] = useState("Newton - Pertemuan 1");
  const [durasi, setDurasi] = useState(45);
  const [rilisHasil, setRilisHasil] = useState("otomatis");
  const [createdSession, setCreatedSession] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadPackages() {
      try {
        const res: any = await apiFetch("/api/packages");
        setPackages(res || []);
        if (res && res.length > 0) {
          setSelectedPkgId(res[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadPackages();
  }, []);

  const handleBukaSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("fisgrade_dosen_token");
    if (!token) {
      router.push("/masuk");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res: any = await apiFetch(`/api/classes/${classId}/sessions`, {
        method: "POST",
        body: JSON.stringify({
          package_id: selectedPkgId,
          judul: judul.trim(),
          durasi_menit: durasi,
          rilis_hasil: rilisHasil,
        }),
      }, token);

      setCreatedSession(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuka sesi.");
    } finally {
      setLoading(false);
    }
  };

  const copySessionCode = () => {
    if (createdSession) {
      navigator.clipboard.writeText(createdSession.kode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-white border-surface-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-navy-900">Buka Sesi Asesmen Baru</CardTitle>
          <CardDescription className="text-ink-600 text-sm">
            Atur parameter sesi asesmen. Versi paket soal akan dikunci begitu sesi dibuka.
          </CardDescription>
        </CardHeader>

        {!createdSession ? (
          <form onSubmit={handleBukaSesi}>
            <CardContent className="flex flex-col gap-4">
              {errorMsg && (
                <div className="p-2.5 rounded bg-error/10 border border-error/20 text-xs text-error font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy-900" htmlFor="judul">
                  Judul Sesi
                </label>
                <Input
                  id="judul"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Newton - Pertemuan 1"
                  required
                  className="text-sm border-surface-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy-900">Pilih Paket Soal</label>
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                      selectedPkgId === pkg.id
                        ? "border-navy-700 bg-navy-100/50 ring-1 ring-navy-700"
                        : "border-surface-200 hover:bg-surface-50"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-navy-900 block">{pkg.judul}</span>
                      <span className="text-ink-600">
                        Topik: {pkg.topik} | {pkg.jumlah_soal || 1} Soal
                      </span>
                    </div>
                    <Badge variant="outline" className="text-navy-700 border-navy-500 font-mono">
                      v{pkg.versi}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-navy-900" htmlFor="durasi">
                    Durasi (Menit)
                  </label>
                  <Input
                    id="durasi"
                    type="number"
                    min={5}
                    max={180}
                    value={durasi}
                    onChange={(e) => setDurasi(parseInt(e.target.value) || 45)}
                    className="text-sm border-surface-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-navy-900">Rilis Hasil</label>
                  <select
                    value={rilisHasil}
                    onChange={(e) => setRilisHasil(e.target.value)}
                    className="h-9 text-xs border border-surface-200 rounded-md px-2 text-navy-900 bg-white"
                  >
                    <option value="otomatis">Otomatis (Saat sesi tutup)</option>
                    <option value="manual">Manual (Oleh Dosen)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-surface-50 border border-surface-200 rounded text-xs text-ink-600">
                <Lock className="size-4 text-navy-700 shrink-0" />
                <span>Versi paket soal akan dikunci (frozen) agar integritas asesmen terjaga.</span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dosen/kelas/${classId}`)}
                className="border-surface-200 text-ink-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-navy-700 hover:bg-navy-500 text-white font-medium px-5"
              >
                {loading ? "Membuka Sesi..." : "Buka Sesi"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          /* Sesi Berhasil Dibuka (W-19) */
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <span className="text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Sesi Berhasil Dibuka
            </span>

            <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl w-full flex flex-col items-center gap-2">
              <span className="text-xs text-ink-600 font-semibold uppercase tracking-wider">
                Kode Sesi Mahasiswa
              </span>
              <span className="text-3xl font-mono font-extrabold text-navy-900 tracking-widest">
                {createdSession.kode}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={copySessionCode}
                className="text-xs border-surface-200 text-navy-700 gap-1.5 mt-1"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-success" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Salin Kode Sesi
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-ink-600 max-w-sm">
              Bagikan kode 6 karakter di atas kepada mahasiswa Anda untuk memulai asesmen formatif.
            </p>

            <Button
              onClick={() => router.push(`/dosen/sesi/${createdSession.id}/hasil`)}
              className="w-full bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold gap-2 mt-2"
            >
              Buka Dasbor Sesi <ArrowRight className="size-3.5" data-icon="inline-end" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
