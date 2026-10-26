"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { GraduationCap } from "lucide-react";

export default function MasukDosenPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res: any = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      localStorage.setItem("fisgrade_dosen_token", res.access_token);
      localStorage.setItem("fisgrade_dosen_nama", res.user.nama_tampil);
      router.push("/dosen");
    } catch (err: any) {
      setErrorMsg(err.message || "Email atau kata sandi keliru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white border-surface-200 shadow-sm">
        <CardHeader>
          <div className="size-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 mb-2">
            <GraduationCap className="size-5" />
          </div>
          <CardTitle className="text-xl text-navy-900">Masuk sebagai Dosen</CardTitle>
          <CardDescription className="text-ink-600 text-sm">
            Masuk dengan akun dosen pengampu untuk mengelola kelas dan sesi asesmen.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-2.5 rounded bg-error/10 border border-error/20 text-xs text-error font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-900" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dosen@universitas.ac.id"
                required
                className="text-sm border-surface-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-navy-900" htmlFor="password">
                  Kata Sandi
                </label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="text-sm border-surface-200"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-700 hover:bg-navy-500 text-white font-medium"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>

            <div className="text-xs text-ink-600 text-center">
              Belum punya akun dosen?{" "}
              <Link href="/daftar" className="text-navy-700 font-semibold hover:underline">
                Daftar sekarang
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
