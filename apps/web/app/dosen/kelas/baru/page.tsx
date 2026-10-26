"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export default function BuatKelasPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");
  const [semester, setSemester] = useState("Ganjil 2026/2027");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("fisgrade_dosen_token");
    if (!token) {
      router.push("/masuk");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res: any = await apiFetch("/api/classes", {
        method: "POST",
        body: JSON.stringify({
          nama: nama.trim(),
          mata_kuliah: mataKuliah.trim(),
          semester: semester.trim(),
        }),
      }, token);

      router.push(`/dosen/kelas/${res.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat kelas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white border-surface-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-navy-900">Buat Kelas Baru</CardTitle>
          <CardDescription className="text-ink-600 text-sm">
            Tambahkan kelas untuk mengelompokkan sesi pengerjaan asesmen fisika.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSimpan}>
          <CardContent className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-2.5 rounded bg-error/10 border border-error/20 text-xs text-error font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-900" htmlFor="nama">
                Nama Kelas
              </label>
              <Input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Fisika Dasar 1 — Kelas A"
                required
                className="text-sm border-surface-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-900" htmlFor="matkul">
                Mata Kuliah
              </label>
              <Input
                id="matkul"
                value={mataKuliah}
                onChange={(e) => setMataKuliah(e.target.value)}
                placeholder="Contoh: Mekanika Klasik"
                className="text-sm border-surface-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-900" htmlFor="semester">
                Semester / Tahun Ajaran
              </label>
              <Input
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Ganjil 2026/2027"
                className="text-sm border-surface-200"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dosen")}
              className="border-surface-200 text-ink-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-navy-700 hover:bg-navy-500 text-white font-medium px-5"
            >
              {loading ? "Menyimpan..." : "Simpan Kelas"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
