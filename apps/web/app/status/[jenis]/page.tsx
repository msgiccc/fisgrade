"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, ShieldAlert, Monitor } from "lucide-react";

export default function StatusPage() {
  const params = useParams();
  const jenis = params.jenis as string;

  const statusConfigs: { [key: string]: { title: string; desc: string; icon: any } } = {
    "layar-kecil": {
      title: "Layar Terlalu Kecil",
      desc: "Gunakan laptop atau tablet dengan layar lebar (minimal 1024 px), atau putar perangkat Anda ke orientasi lanskap.",
      icon: Monitor,
    },
    "ditutup": {
      title: "Sesi Telah Ditutup",
      desc: "Sesi asesmen ini telah ditutup oleh dosen pengampu. Jawaban Anda tidak dapat diserahkan lagi.",
      icon: Clock,
    },
    "tidak-ditemukan": {
      title: "Sesi Tidak Ditemukan",
      desc: "Kode sesi yang Anda masukkan tidak terdaftar di sistem. Periksa kembali kode sesi dari dosen Anda.",
      icon: AlertCircle,
    },
    "galat": {
      title: "Terjadi Galat Sistem",
      desc: "Terjadi kesalahan saat memproses permintaan Anda. Silakan coba beberapa saat lagi.",
      icon: ShieldAlert,
    },
  };

  const config = statusConfigs[jenis] || statusConfigs["galat"];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 select-none">
      <Card className="max-w-md w-full bg-white border-surface-200 text-center shadow-sm p-6">
        <div className="size-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-3">
          <Icon className="size-6" />
        </div>
        <CardTitle className="text-xl text-navy-900">{config.title}</CardTitle>
        <CardDescription className="text-sm text-ink-600 mt-2 leading-relaxed">
          {config.desc}
        </CardDescription>
        <CardFooter className="flex justify-center mt-6">
          <Link href="/">
            <Button className="bg-navy-700 hover:bg-navy-500 text-white text-xs">
              Kembali ke Beranda
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
