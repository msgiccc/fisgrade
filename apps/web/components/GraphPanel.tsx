"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, RotateCcw } from "lucide-react";

export interface GraphData {
  representasi: "grafis";
  jenis: string; // v-t, x-t, a-t, F-t
  sumbu_x: { nama: string; satuan: string };
  sumbu_y: { nama: string; satuan: string };
  titik: [number, number][];
  bentuk: string; // linear, kuadratik, konstan
  kemiringan?: number;
  dihaluskan?: boolean;
  goresan_asli_disimpan?: boolean;
  rev?: number;
}

interface GraphPanelProps {
  data: GraphData;
  onChange: (data: GraphData) => void;
  highlighted?: boolean;
}

export function GraphPanel({ data, onChange, highlighted }: GraphPanelProps) {
  const [inputMode, setInputMode] = useState<"penggeser" | "titik">("penggeser");
  const [rawPoints, setRawPoints] = useState<[number, number][]>(data.titik || [[0, 0], [8, 32]]);

  const jenis = data.jenis || "v-t";
  const sumbu_x = data.sumbu_x || { nama: "t", satuan: "s" };
  const sumbu_y = data.sumbu_y || { nama: "v", satuan: "m/s" };
  const titik = data.titik || [[0, 0], [8, 32]];

  // Target end value from slider (e.g. t=8, v=32)
  const currentEndV = titik.length >= 2 ? titik[titik.length - 1][1] : 32;

  const handleSliderChange = (newVal: any) => {
    const v = Array.isArray(newVal) ? newVal[0] : typeof newVal === "number" ? newVal : 32;
    const newPoints: [number, number][] = [[0, 0], [8, v]];
    const slope = v / 8;
    onChange({
      ...data,
      titik: newPoints,
      kemiringan: slope,
      bentuk: "linear",
    });
  };

  const handleSmooth = () => {
    // TDD 11: Linear smoothing with 5% tolerance
    if (titik.length >= 2) {
      setRawPoints([...titik]);
      const p1 = titik[0];
      const p2 = titik[titik.length - 1];
      const slope = (p2[1] - p1[1]) / (p2[0] - p1[0] || 1);
      onChange({
        ...data,
        titik: [[p1[0], p1[1]], [p2[0], p2[1]]],
        kemiringan: slope,
        bentuk: "linear",
        dihaluskan: true,
        goresan_asli_disimpan: true,
      });
    }
  };

  const handleRevert = () => {
    if (data.goresan_asli_disimpan && rawPoints.length > 0) {
      const p1 = rawPoints[0];
      const p2 = rawPoints[rawPoints.length - 1];
      const slope = (p2[1] - p1[1]) / (p2[0] - p1[0] || 1);
      onChange({
        ...data,
        titik: rawPoints,
        kemiringan: slope,
        dihaluskan: false,
      });
    }
  };

  // Coordinate canvas parameters
  const width = 280;
  const height = 150;
  const padL = 35;
  const padB = 25;
  const padT = 15;
  const padR = 20;

  const maxT = 10;
  const maxV = 40;

  const mapToCanvas = (t: number, v: number) => {
    const x = padL + (t / maxT) * (width - padL - padR);
    const y = height - padB - (v / maxV) * (height - padT - padB);
    return { x, y };
  };

  const pathD =
    titik.length >= 2
      ? titik.reduce((acc, pt, i) => {
          const { x, y } = mapToCanvas(pt[0], pt[1]);
          return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
        }, "")
      : "";

  return (
    <div
      id="panel-grafis"
      className={`flex flex-col h-full bg-white rounded-lg border p-3.5 transition-colors ${
        highlighted ? "border-warning ring-2 ring-warning/30" : "border-surface-200 focus-within:border-navy-500"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-200">
        <Badge className="bg-navy-700 text-white font-medium hover:bg-navy-700">
          4 Grafis (Grafik)
        </Badge>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-600 font-medium">Jenis:</span>
          <select
            value={jenis}
            onChange={(e) => onChange({ ...data, jenis: e.target.value })}
            className="h-7 text-xs border border-surface-200 rounded px-2 text-navy-900 bg-white"
          >
            <option value="v-t">v–t (Kecepatan-Waktu)</option>
            <option value="x-t">x–t (Posisi-Waktu)</option>
            <option value="a-t">a–t (Percepatan-Waktu)</option>
            <option value="F-t">F–t (Gaya-Waktu)</option>
          </select>
        </div>
      </div>

      {/* Axis configuration inputs (FR-E9) */}
      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-600 font-semibold w-16">Sumbu X:</span>
          <Input
            value={sumbu_x.nama}
            onChange={(e) =>
              onChange({
                ...data,
                sumbu_x: { ...sumbu_x, nama: e.target.value },
              })
            }
            placeholder="Nama"
            className="h-6 w-16 text-xs px-1.5"
          />
          <Input
            value={sumbu_x.satuan}
            onChange={(e) =>
              onChange({
                ...data,
                sumbu_x: { ...sumbu_x, satuan: e.target.value },
              })
            }
            placeholder="Satuan"
            className="h-6 w-14 text-xs px-1.5"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-ink-600 font-semibold w-16">Sumbu Y:</span>
          <Input
            value={sumbu_y.nama}
            onChange={(e) =>
              onChange({
                ...data,
                sumbu_y: { ...sumbu_y, nama: e.target.value },
              })
            }
            placeholder="Nama"
            className="h-6 w-16 text-xs px-1.5"
          />
          <Input
            value={sumbu_y.satuan}
            onChange={(e) =>
              onChange({
                ...data,
                sumbu_y: { ...sumbu_y, satuan: e.target.value },
              })
            }
            placeholder="Satuan"
            className="h-6 w-14 text-xs px-1.5"
          />
        </div>
      </div>

      {/* Interactive Coordinate Grid */}
      <div className="flex-1 border border-surface-200 rounded-md bg-surface-50 relative overflow-hidden flex items-center justify-center min-h-36">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="select-none">
          {/* Grid lines */}
          {[10, 20, 30, 40].map((v) => {
            const y = mapToCanvas(0, v).y;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#D9DFEA" strokeWidth="1" strokeDasharray="2,2" />
                <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#4B5568">
                  {v}
                </text>
              </g>
            );
          })}
          {[2, 4, 6, 8, 10].map((t) => {
            const x = mapToCanvas(t, 0).x;
            return (
              <g key={t}>
                <line x1={x} y1={padT} x2={x} y2={height - padB} stroke="#D9DFEA" strokeWidth="1" strokeDasharray="2,2" />
                <text x={x} y={height - padB + 12} textAnchor="middle" fontSize="9" fill="#4B5568">
                  {t}
                </text>
              </g>
            );
          })}

          {/* Sumbu X & Y */}
          <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#071B3D" strokeWidth="1.5" />
          <line x1={padL} y1={height - padB} x2={padL} y2={padT} stroke="#071B3D" strokeWidth="1.5" />

          {/* Sumbu labels */}
          <text x={width - padR} y={height - padB + 12} textAnchor="end" fontSize="10" fontWeight="bold" fill="#071B3D">
            {sumbu_x.nama || "t"} ({sumbu_x.satuan || "s"})
          </text>
          <text x={padL} y={padT - 4} textAnchor="start" fontSize="10" fontWeight="bold" fill="#071B3D">
            {sumbu_y.nama || "v"} ({sumbu_y.satuan || "m/s"})
          </text>

          {/* Kurva solid tegas Navy-700 (UI/UX 11.2 item 6) */}
          <path
            id="kurva-grafis"
            d={pathD}
            fill="none"
            stroke="#0B2A5B"
            strokeWidth="2.5"
          />

          {/* Titik kunci penanda */}
          {titik.map((pt, i) => {
            const { x, y } = mapToCanvas(pt[0], pt[1]);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4.5"
                fill="#FFFFFF"
                stroke="#0B2A5B"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* Slider & Action buttons */}
      <div className="mt-2 flex flex-col gap-1.5 pt-2 border-t border-surface-200">
        <div className="flex items-center justify-between text-xs text-ink-600">
          <span>Penggeser Kecepatan Akhir v(t=8s):</span>
          <span className="font-bold text-navy-900 tabular-nums">{currentEndV} m/s</span>
        </div>
        <Slider
          value={[currentEndV]}
          onValueChange={handleSliderChange}
          min={0}
          max={40}
          step={1}
          className="w-full"
        />

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSmooth}
              className="h-7 text-xs text-navy-700 border-surface-200 gap-1 px-2"
              title="Haluskan bentuk tanpa mengubah kemiringan fisis"
            >
              <Sparkles className="size-3.5" data-icon="inline-start" /> Haluskan bentuk
            </Button>
            {data.dihaluskan && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRevert}
                className="h-7 text-xs text-ink-600 gap-1 px-2"
              >
                <RotateCcw className="size-3" data-icon="inline-start" /> Batalkan
              </Button>
            )}
          </div>
          <span className="text-[11px] text-ink-600">Kemiringan a = {((data.kemiringan ?? 4)).toFixed(1)} m/s²</span>
        </div>
      </div>
    </div>
  );
}
