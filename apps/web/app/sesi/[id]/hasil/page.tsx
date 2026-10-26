"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RadarDiamond, RadarData, RadarStatuses } from "@/components/RadarDiamond";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { Award, AlertTriangle, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

export default function HasilSesiPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const studentToken = localStorage.getItem("fisgrade_student_token") || "";

    async function loadResult() {
      try {
        const res: any = await apiFetch(`/api/submissions/${submissionId}/result`, {}, studentToken);
        setResultData(res);
      } catch (err: any) {
        setErrorMsg(err.message || "Hasil belum dirilis oleh dosen.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 rounded-full border-2 border-navy-700 border-t-transparent animate-spin" />
          <span className="text-sm font-medium text-ink-600">Menghitung hasil asesmen...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white border border-surface-200 rounded-xl p-6 text-center shadow-sm">
          <BookOpen className="size-8 text-navy-700 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-navy-900">Jawaban Berhasil Dikirim</h2>
          <p className="text-sm text-ink-600 mt-2">{errorMsg}</p>
          <div className="flex flex-col gap-2 mt-5">
            <Button
              onClick={() => router.push(`/sesi/${submissionId}/angket`)}
              className="bg-navy-700 hover:bg-navy-500 text-white"
            >
              Isi Angket Kepraktisan
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="border-surface-200 text-ink-600">
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const scoresList = resultData?.skor || [];
  const radarData: RadarData = {
    verbal: 0,
    matematis: 0,
    visual: 0,
    grafis: 0,
  };
  const statuses: RadarStatuses = {};

  scoresList.forEach((s: any) => {
    const rep = s.representasi.toLowerCase() as keyof RadarData;
    if (rep in radarData) {
      radarData[rep] = s.skor ?? 0;
      statuses[rep] = s.status;
    }
  });

  return (
    <div className="min-h-screen bg-surface-50 p-6 flex flex-col items-center justify-center select-none">
      <Card className="max-w-4xl w-full bg-white border-surface-200 shadow-sm">
        <CardHeader className="border-b border-surface-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy-700 bg-navy-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Hasil Asesmen
              </span>
              <CardTitle className="text-2xl text-navy-900 mt-1">Hukum Newton tentang Gerak</CardTitle>
            </div>
            <div className="size-10 rounded-full bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Radar Diamond Chart (W-13) */}
          <div className="flex flex-col items-center justify-center border border-surface-200 rounded-lg bg-surface-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600 mb-2">
              Profil Representasi (Skala 0–100)
            </span>
            <RadarDiamond data={radarData} statuses={statuses} size={300} title="" />
            <span className="text-[11px] text-ink-600 mt-2 text-center">
              Area menyatakan penguasaan konsep fisika multirepresentasi Anda.
            </span>
          </div>

          {/* Table of Scores */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600 block mb-2">
                Rincian Skor per Representasi
              </span>
              <div className="border border-surface-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-navy-100">
                    <TableRow>
                      <TableHead className="text-navy-900 font-bold text-xs">Representasi</TableHead>
                      <TableHead className="text-navy-900 font-bold text-xs text-center">Rubrik</TableHead>
                      <TableHead className="text-navy-900 font-bold text-xs text-center">Penalti</TableHead>
                      <TableHead className="text-navy-900 font-bold text-xs text-center">Skor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoresList.map((item: any) => (
                      <TableRow key={item.representasi}>
                        <TableCell className="font-semibold text-xs text-navy-900 capitalize">
                          {item.representasi}
                        </TableCell>
                        <TableCell className="text-xs text-center tabular-nums">
                          {item.skor_rubrik ?? "-"}
                        </TableCell>
                        <TableCell className="text-xs text-center text-error font-medium tabular-nums">
                          {item.penalti > 0 ? `-${item.penalti}` : "0"}
                        </TableCell>
                        <TableCell className="text-xs text-center font-bold text-navy-900 tabular-nums">
                          {item.status === "belum_terselesaikan" ? (
                            <Badge variant="outline" className="text-warning border-warning text-[10px]">
                              Menunggu dosen
                            </Badge>
                          ) : (
                            item.skor ?? "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Umpan balik diagnostik (FR-H3) */}
              <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-lg text-xs flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-success">Kekuatan: </span>
                  <span className="text-ink-600">
                    {resultData?.umpan_balik?.kekuatan?.join(", ") || "Pemahaman konsep baik"}
                  </span>
                </div>
                {resultData?.umpan_balik?.perbaiki && resultData.umpan_balik.perbaiki.length > 0 && (
                  <div>
                    <span className="font-bold text-warning">Perlu diperbaiki: </span>
                    <span className="text-ink-600">
                      {resultData.umpan_balik.perbaiki.join("; ")}
                    </span>
                  </div>
                )}
                <span className="text-[11px] text-ink-600 italic mt-1">
                  Catatan: Dosen pengampu memiliki hak akhir untuk meninjau dan menyesuaikan skor proses ini.
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-200 flex justify-end gap-2">
              <Button
                onClick={() => router.push(`/sesi/${submissionId}/angket`)}
                className="bg-navy-700 hover:bg-navy-500 text-white text-xs font-semibold gap-1.5"
              >
                Isi Angket Kepraktisan <ArrowRight className="size-3.5" data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
