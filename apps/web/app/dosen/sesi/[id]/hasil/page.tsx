"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RadarDiamond, RadarData } from "@/components/RadarDiamond";
import { StudentCanvasesViewer } from "@/components/StudentCanvasesViewer";
import { ReplayModal } from "@/components/ReplayModal";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import {
  ArrowLeft, Download, RefreshCw, Pencil, Check, AlertTriangle,
  Play, Pause, History, Users, Eye, Film, LayoutGrid
} from "lucide-react";

export default function DasborSesiDosenPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentEvents, setStudentEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [studentCanvases, setStudentCanvases] = useState<any>(null);
  const [loadingCanvases, setLoadingCanvases] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [overrideScores, setOverrideScores] = useState<{ [key: string]: number }>({});
  const [overrideReasons, setOverrideReasons] = useState<{ [key: string]: string }>({});
  const [isSavingScore, setIsSavingScore] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const loadData = async (tok: string) => {
    try {
      const res: any = await apiFetch(`/api/sessions/${sessionId}/results`, {}, tok);
      setData(res);
      if (res.peserta && res.peserta.length > 0 && !selectedStudent) {
        setSelectedStudent(res.peserta[0]);
      } else if (selectedStudent) {
        // Refresh selected student
        const updated = res.peserta.find((p: any) => p.participant_id === selectedStudent.participant_id);
        if (updated) setSelectedStudent(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tok = localStorage.getItem("fisgrade_dosen_token") || "";
    setToken(tok);
    if (!tok) {
      router.push("/masuk");
      return;
    }
    loadData(tok);
    const interval = setInterval(() => loadData(tok), 8000); // 8s periodic polling
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (selectedStudent?.submission_id && token) {
      setLoadingEvents(true);
      apiFetch(`/api/submissions/${selectedStudent.submission_id}/events`, {}, token)
        .then((res: any) => {
          setStudentEvents(res.events || []);
        })
        .catch((e) => console.error("Failed to load events:", e))
        .finally(() => setLoadingEvents(false));

      setLoadingCanvases(true);
      apiFetch(`/api/submissions/${selectedStudent.submission_id}/canvases`, {}, token)
        .then((res: any) => {
          setStudentCanvases(res.canvases || null);
        })
        .catch((e) => {
          console.error("Failed to load canvases:", e);
          setStudentCanvases(null);
        })
        .finally(() => setLoadingCanvases(false));
    } else {
      setStudentEvents([]);
      setStudentCanvases(null);
    }
  }, [selectedStudent?.submission_id, token]);

  const handleExportCSV = async (pseudonim: boolean) => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/sessions/${sessionId}/export?pseudonim=${pseudonim}`,
      "_blank"
    );
  };

  const handleSaveOverride = async (rep: string, scoreId: string) => {
    const newScore = overrideScores[rep];
    const reason = overrideReasons[rep];

    if (newScore === undefined || isNaN(newScore)) {
      alert("Masukkan nilai skor yang valid (0–100)");
      return;
    }
    if (!reason || reason.trim().length < 3) {
      alert("Alasan perubahan skor wajib diisi secara memadai (AC-09)");
      return;
    }

    setIsSavingScore(rep);
    try {
      await apiFetch(
        `/api/scores/${scoreId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            skor_dosen: newScore,
            alasan: reason.trim(),
          }),
        },
        token
      );

      await loadData(token);
      alert(`Skor ${rep.toUpperCase()} berhasil disesuaikan.`);
    } catch (err: any) {
      alert(err.message || "Gagal mengubah skor");
    } finally {
      setIsSavingScore(null);
    }
  };

  const handleCloseSession = async () => {
    if (confirm("Tutup sesi ini? Mahasiswa tidak akan dapat mengirim jawaban lagi.")) {
      try {
        await apiFetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "ditutup", hasil_dirilis: true }),
        }, token);
        await loadData(token);
      } catch (e: any) {
        alert(e.message || "Gagal menutup sesi");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-navy-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  const sessionInfo = data?.session || {};
  const avgRadar: RadarData = data?.radar_rata_rata || { verbal: 0, matematis: 0, visual: 0, grafis: 0 };
  const miskonsepsi = data?.miskonsepsi || [];
  const pesertaList = data?.peserta || [];

  // Selected student radar
  const studentRadar: RadarData = { verbal: 0, matematis: 0, visual: 0, grafis: 0 };
  const studentDosenRadar: RadarData = { verbal: 0, matematis: 0, visual: 0, grafis: 0 };
  let hasDosenScore = false;

  if (selectedStudent?.scores) {
    for (const [rep, s] of Object.entries(selectedStudent.scores) as any) {
      if (rep in studentRadar) {
        studentRadar[rep as keyof RadarData] = s.skor_otomatis ?? 0;
        if (s.skor_dosen !== null && s.skor_dosen !== undefined) {
          studentDosenRadar[rep as keyof RadarData] = s.skor_dosen;
          hasDosenScore = true;
        } else {
          studentDosenRadar[rep as keyof RadarData] = s.skor_otomatis ?? 0;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col select-none">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-xs text-ink-600 hover:text-navy-900"
          >
            <ArrowLeft className="size-3.5" data-icon="inline-start" /> Kembali
          </Button>
          <span className="text-surface-200">/</span>
          <span className="font-bold text-navy-900 text-sm">
            Dasbor Hasil: {sessionInfo.judul} ({sessionInfo.kode})
          </span>
          <Badge
            variant="outline"
            className={
              sessionInfo.status === "dibuka"
                ? "text-success border-success"
                : "text-ink-600 border-surface-200"
            }
          >
            {sessionInfo.status?.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {sessionInfo.status === "dibuka" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCloseSession}
              className="text-xs border-warning text-warning hover:bg-warning/10 font-semibold"
            >
              Tutup Sesi
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCSV(false)}
            className="text-xs border-surface-200 text-navy-700 hover:bg-surface-50 gap-1"
          >
            <Download className="size-3.5" data-icon="inline-start" /> Ekspor CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCSV(true)}
            className="text-xs border-surface-200 text-ink-600 hover:bg-surface-50"
            title="Ekspor CSV dengan identitas pseudonim (AC-18)"
          >
            Ekspor Pseudonim
          </Button>
        </div>
      </header>

      {/* Main 2-Column Dashboard Layout (W-21 sampai W-23 / UI/UX 11.2 item 11) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri (5 Kolom): Radar Kelas, Miskonsepsi Tersering, Daftar Mahasiswa */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Radar Rata-rata Kelas */}
          <Card className="border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-navy-900">
                Radar Rata-Rata Kelas
              </CardTitle>
              <CardDescription className="text-xs text-ink-600">
                Skor otomatis rata-rata kelas per representasi fisis.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-2">
              <RadarDiamond data={avgRadar} size={250} title="" />
            </CardContent>
          </Card>

          {/* Miskonsepsi Tersering (FR-I3: label Indikasi, bukan kepastian) */}
          <Card className="border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-navy-900">
                  Miskonsepsi Tersering
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-ink-600 border-surface-200">
                  Indikasi, bukan kepastian
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-1 text-xs">
              {miskonsepsi.length === 0 ? (
                <span className="text-ink-600 italic">Belum ada miskonsepsi terdeteksi.</span>
              ) : (
                miskonsepsi.map((m: any) => (
                  <div key={m.kode} className="flex items-center justify-between border-b border-surface-200 pb-1.5">
                    <span className="font-semibold text-navy-900">{m.kode}</span>
                    <span className="tabular-nums text-error font-medium">
                      {m.persen}% ({m.jumlah} mahasiswa)
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Daftar Peserta */}
          <Card className="border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-navy-900">Daftar Mahasiswa</CardTitle>
                <CardDescription className="text-xs text-ink-600">
                  {pesertaList.length} peserta terdaftar
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="bg-navy-100">
                  <TableRow>
                    <TableHead className="text-navy-900 font-bold text-xs">Nama / NIM</TableHead>
                    <TableHead className="text-navy-900 font-bold text-xs text-center">Status</TableHead>
                    <TableHead className="text-navy-900 font-bold text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pesertaList.map((m: any) => {
                    const isSelected = selectedStudent?.participant_id === m.participant_id;
                    const isUnresolved = m.status === "belum_terselesaikan";

                    return (
                      <TableRow
                        key={m.participant_id}
                        onClick={() => setSelectedStudent(m)}
                        className={`cursor-pointer ${
                          isSelected ? "bg-navy-100/70" : isUnresolved ? "bg-warning/5" : ""
                        }`}
                      >
                        <TableCell className="text-xs">
                          <span className="font-semibold text-navy-900 block">{m.nama}</span>
                          <span className="text-ink-600 font-mono text-[11px]">{m.nim}</span>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <Badge
                            variant="outline"
                            className={
                              isUnresolved
                                ? "text-warning border-warning bg-warning/10 text-[10px]"
                                : m.status === "dikirim"
                                ? "text-success border-success text-[10px]"
                                : "text-ink-600 border-surface-200 text-[10px]"
                            }
                          >
                            {isUnresolved ? "Belum Selesai" : m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "ghost"}
                            className="h-6 text-[11px] px-2"
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan (7 Kolom): Detail Mahasiswa Terpilih & Modul Ubah Skor (W-22) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {selectedStudent ? (
            <>
              {/* Header Info Mahasiswa */}
              <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-navy-900">{selectedStudent.nama}</h2>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedStudent.nim}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-600 mt-0.5">
                    ID Peserta: {selectedStudent.participant_id} | Status:{" "}
                    <strong>{selectedStudent.status}</strong>
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsReplayOpen(true)}
                  className="bg-navy-700 hover:bg-navy-500 text-white font-semibold text-xs px-3.5 h-8 flex items-center gap-1.5 shadow-xs"
                >
                  <Film className="size-3.5" /> Putar Ulang Pengerjaan (Replay)
                </Button>
              </div>

              {/* Radar Mahasiswa Terpilih (Skor Otomatis vs Dosen) */}
              <Card className="border-surface-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-navy-900">
                      Profil Multirepresentasi Mahasiswa
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 font-medium text-navy-700">
                        <span className="size-2.5 rounded-full bg-navy-700" /> Otomatis
                      </span>
                      {hasDosenScore && (
                        <span className="flex items-center gap-1 font-medium text-navy-500">
                          <span className="size-2.5 rounded-full bg-navy-500 border border-dashed border-navy-700" /> Dosen
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center pt-2">
                  <RadarDiamond
                    data={studentRadar}
                    secondaryData={hasDosenScore ? studentDosenRadar : undefined}
                    size={270}
                    title=""
                  />
                </CardContent>
              </Card>

              {/* Pratinjau 4 Kanvas Mahasiswa (W-21 / W-22 / UI/UX 11.2 item 11) */}
              <Card className="border-surface-200 bg-white shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-navy-900 flex items-center gap-2">
                      <LayoutGrid className="size-4 text-navy-700" />
                      Hasil 4 Kanvas Mahasiswa
                    </CardTitle>
                    <CardDescription className="text-xs text-ink-600 mt-0.5">
                      Visualisasi jawaban terkini pada representasi Verbal, Visual (FBD), Matematis, dan Grafis.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReplayOpen(true)}
                    className="text-xs border-navy-700 text-navy-700 hover:bg-navy-50 font-medium h-7 flex items-center gap-1.5"
                  >
                    <Film className="size-3" /> Reka Ulang (Replay)
                  </Button>
                </CardHeader>
                <CardContent className="pt-2">
                  {loadingCanvases ? (
                    <div className="py-8 text-center text-xs text-ink-600 flex items-center justify-center gap-2">
                      <RefreshCw className="size-3.5 animate-spin" /> Memuat kanvas pengerjaan mahasiswa...
                    </div>
                  ) : (
                    <StudentCanvasesViewer canvases={studentCanvases} />
                  )}
                </CardContent>
              </Card>

              {/* Tabel Ubah Skor Dosen dengan Alasan Wajib (FR-I6 / FR-I9 / AC-09) */}
              <Card className="border-surface-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-navy-900">
                    Penilaian & Penyesuaian Skor Dosen
                  </CardTitle>
                  <CardDescription className="text-xs text-ink-600">
                    Dosen pemegang keputusan akhir. Setiap perubahan wajib menyertakan alasan penyesuaian (AC-09).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-2">
                  <Table>
                    <TableHeader className="bg-navy-100">
                      <TableRow>
                        <TableHead className="text-navy-900 font-bold text-xs">Representasi</TableHead>
                        <TableHead className="text-navy-900 font-bold text-xs text-center">Skor Otomatis</TableHead>
                        <TableHead className="text-navy-900 font-bold text-xs text-center">Skor Dosen</TableHead>
                        <TableHead className="text-navy-900 font-bold text-xs">Alasan Perubahan</TableHead>
                        <TableHead className="text-navy-900 font-bold text-xs text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {["verbal", "matematis", "visual", "grafis"].map((rep) => {
                        const scoreItem = selectedStudent.scores?.[rep];
                        if (!scoreItem) return null;

                        const isChanged = scoreItem.skor_dosen !== null && scoreItem.skor_dosen !== undefined;
                        const currentInputScore =
                          overrideScores[rep] !== undefined
                            ? overrideScores[rep]
                            : isChanged
                            ? scoreItem.skor_dosen
                            : scoreItem.skor_otomatis ?? 0;

                        const currentReason =
                          overrideReasons[rep] !== undefined
                            ? overrideReasons[rep]
                            : scoreItem.alasan || "";

                        return (
                          <TableRow key={rep}>
                            <TableCell className="font-semibold text-xs text-navy-900 capitalize">
                              <div className="flex items-center gap-1.5">
                                <span>{rep}</span>
                                {isChanged && (
                                  <Badge className="bg-navy-100 text-navy-700 text-[10px] font-semibold flex items-center gap-1">
                                    <Pencil className="size-2.5" /> Diubah
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-center tabular-nums">
                              {scoreItem.skor_otomatis ?? "-"}
                            </TableCell>

                            <TableCell className="text-xs text-center w-24">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={currentInputScore}
                                onChange={(e) =>
                                  setOverrideScores({
                                    ...overrideScores,
                                    [rep]: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="h-7 text-xs text-center tabular-nums font-bold border-surface-200"
                              />
                            </TableCell>

                            <TableCell className="text-xs">
                              <Input
                                value={currentReason}
                                onChange={(e) =>
                                  setOverrideReasons({
                                    ...overrideReasons,
                                    [rep]: e.target.value,
                                  })
                                }
                                placeholder="Alasan penyesuaian..."
                                className="h-7 text-xs border-surface-200"
                              />
                            </TableCell>

                            <TableCell className="text-xs text-right">
                              <Button
                                size="sm"
                                onClick={() => handleSaveOverride(rep, scoreItem.id)}
                                disabled={isSavingScore === rep}
                                className="h-7 text-xs bg-navy-700 hover:bg-navy-500 text-white font-medium px-2.5"
                              >
                                {isSavingScore === rep ? "Menyimpan..." : "Simpan"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Log Kejadian & Kronologi Proses (FR-I4 / W-22) */}
              <Card className="border-surface-200 bg-white shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-navy-900 flex items-center gap-2">
                      <History className="size-4 text-navy-700" />
                      Log Kejadian & Kronologi Proses
                    </CardTitle>
                    <CardDescription className="text-xs text-ink-600 mt-0.5">
                      Urutan waktu aktivitas berpikir: deteksi kontradiksi, penggunaan hint, dan perbaikan.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono text-navy-700 border-surface-200">
                    {studentEvents.length} Peristiwa
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2">
                  {loadingEvents ? (
                    <div className="py-6 text-center text-xs text-ink-600 flex items-center justify-center gap-2">
                      <RefreshCw className="size-3.5 animate-spin" /> Memuat log peristiwa...
                    </div>
                  ) : studentEvents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-ink-600 italic">
                      Belum ada catatan log aktivitas untuk submisi ini.
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-surface-200 space-y-4 my-2">
                      {studentEvents.map((ev, idx) => {
                        const isContra = ev.jenis === "kontradiksi";
                        const isHint = ev.jenis === "hint";
                        const isRes = ev.jenis === "selesai";
                        const isSubmit = ev.jenis === "submit";

                        return (
                          <div key={ev.id || idx} className="relative group">
                            {/* Dot on line */}
                            <div
                              className={`absolute -left-[31px] top-1 size-3.5 rounded-full border-2 bg-white transition-transform group-hover:scale-125 ${
                                isContra
                                  ? "border-warning bg-warning/20"
                                  : isHint
                                  ? "border-navy-500 bg-navy-100"
                                  : isRes
                                  ? "border-success bg-success/20"
                                  : isSubmit
                                  ? "border-navy-700 bg-navy-700"
                                  : "border-surface-200"
                              }`}
                            />

                            <div className="flex flex-col gap-0.5 bg-surface-50 p-2.5 rounded-lg border border-surface-200 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-navy-900">{ev.judul}</span>
                                <span className="text-[11px] font-mono text-ink-600 tabular-nums">
                                  {ev.waktu}
                                </span>
                              </div>
                              <p className="text-ink-600 text-[11px] leading-relaxed">
                                {ev.deskripsi}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full border border-surface-200 rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center text-ink-600 text-sm">
              <Users className="size-8 text-navy-700 mb-2" />
              Pilih mahasiswa di daftar sebelah kiri untuk meninjau proses berpikir dan menyesuaikan skor.
            </div>
          )}
        </div>
      </main>

      {/* Modal Replay Reka Ulang Pengerjaan Mahasiswa (W-23) */}
      {selectedStudent && (
        <ReplayModal
          isOpen={isReplayOpen}
          onClose={() => setIsReplayOpen(false)}
          submissionId={selectedStudent.submission_id}
          studentName={selectedStudent.nama}
          studentNim={selectedStudent.nim}
          token={token}
        />
      )}
    </div>
  );
}
