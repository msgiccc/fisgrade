"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface StudentCanvasesViewerProps {
  canvases: {
    verbal?: any;
    visual?: any;
    matematis?: any;
    grafis?: any;
  } | null;
}

export function StudentCanvasesViewer({ canvases }: StudentCanvasesViewerProps) {
  if (!canvases) {
    return (
      <div className="py-8 text-center text-xs text-ink-600 italic">
        Memuat kanvas pengerjaan mahasiswa...
      </div>
    );
  }

  const verbal = canvases.verbal || {};
  const visual = canvases.visual || {};
  const matematis = canvases.matematis || {};
  const grafis = canvases.grafis || {};

  const forces = visual.gaya || [];
  const mathLines = matematis.baris || [];
  const points = grafis.titik || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs select-none">
      {/* 1. Verbal Canvas Preview */}
      <div className="border border-surface-200 rounded-lg p-3 bg-surface-50 flex flex-col justify-between min-h-36">
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-surface-200">
            <Badge className="bg-navy-700 text-white text-[10px] hover:bg-navy-700 font-medium">
              1. Verbal
            </Badge>
            <span className="text-[10px] text-ink-600">
              {verbal.teks ? `${verbal.teks.length} karakter` : "Kosong"}
            </span>
          </div>
          <p className="text-navy-900 leading-relaxed whitespace-pre-wrap font-sans text-xs">
            {verbal.teks || <span className="italic text-ink-600">Belum ada penjelasan verbal.</span>}
          </p>
        </div>
      </div>

      {/* 2. Visual Canvas Preview */}
      <div className="border border-surface-200 rounded-lg p-3 bg-surface-50 flex flex-col justify-between min-h-36">
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-surface-200">
            <Badge className="bg-navy-700 text-white text-[10px] hover:bg-navy-700 font-medium">
              2. Visual (Diagram Benda Bebas)
            </Badge>
            <span className="text-[10px] text-ink-600 font-medium">
              {forces.length} Gaya
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mini SVG Diagram preview */}
            <div className="size-24 border border-surface-200 rounded bg-white relative flex items-center justify-center shrink-0">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <line x1="10" y1="70" x2="90" y2="70" stroke="#071B3D" strokeWidth="2" />
                <rect x="35" y="45" width="30" height="25" fill="#FFFFFF" stroke="#0B2A5B" strokeWidth="1.5" />
                {forces.map((f: any) => {
                  const rad = ((f.sudut || 0) * Math.PI) / 180;
                  const len = Math.min(25, (f.panjang_rel || 0.6) * 25);
                  const ex = 50 + len * Math.cos(rad);
                  const ey = 57 - len * Math.sin(rad);
                  return (
                    <g key={f.id}>
                      <line x1="50" y1="57" x2={ex} y2={ey} stroke="#0B2A5B" strokeWidth="1.8" />
                      <circle cx={ex} cy={ey} r="2.5" fill="#0B2A5B" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Force list */}
            <div className="flex-1 flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
              {forces.length === 0 ? (
                <span className="italic text-ink-600">Belum ada gaya digambar.</span>
              ) : (
                forces.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between bg-white px-2 py-0.5 rounded border border-surface-200 font-mono text-[11px]">
                    <span className="font-bold text-navy-900">{f.label}</span>
                    <span className="text-ink-600">∠{f.sudut}° | L:{f.panjang_rel}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Matematis Canvas Preview */}
      <div className="border border-surface-200 rounded-lg p-3 bg-surface-50 flex flex-col justify-between min-h-36">
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-surface-200">
            <Badge className="bg-navy-700 text-white text-[10px] hover:bg-navy-700 font-medium">
              3. Matematis (Perhitungan)
            </Badge>
            <span className="text-[10px] text-ink-600">
              {mathLines.length} Baris
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto font-mono text-xs">
            {mathLines.length === 0 ? (
              <span className="italic text-ink-600 font-sans">Belum ada persamaan ditulis.</span>
            ) : (
              mathLines.map((line: any, idx: number) => (
                <div key={line.id || idx} className="flex items-center gap-1.5 bg-white p-1 rounded border border-surface-200">
                  <span className="text-[10px] text-ink-600 w-4 font-bold">{idx + 1}.</span>
                  <span className="text-navy-900 font-medium">{line.ekspresi}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Grafis Canvas Preview */}
      <div className="border border-surface-200 rounded-lg p-3 bg-surface-50 flex flex-col justify-between min-h-36">
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-surface-200">
            <Badge className="bg-navy-700 text-white text-[10px] hover:bg-navy-700 font-medium">
              4. Grafis ({grafis.jenis || "v-t"})
            </Badge>
            <span className="text-[10px] text-ink-600 font-mono">
              Kemiringan: {grafis.kemiringan ?? 4.0} m/s²
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mini SVG Graph */}
            <div className="size-24 border border-surface-200 rounded bg-white relative flex items-center justify-center shrink-0">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <line x1="15" y1="85" x2="90" y2="85" stroke="#071B3D" strokeWidth="1.5" />
                <line x1="15" y1="85" x2="15" y2="10" stroke="#071B3D" strokeWidth="1.5" />
                {points.length >= 2 ? (
                  <line
                    x1="15"
                    y1="85"
                    x2={15 + (Math.min(10, points[points.length - 1][0]) / 10) * 70}
                    y2={85 - (Math.min(40, points[points.length - 1][1]) / 40) * 70}
                    stroke="#0B2A5B"
                    strokeWidth="2.5"
                  />
                ) : (
                  <line x1="15" y1="85" x2="80" y2="35" stroke="#0B2A5B" strokeWidth="2" />
                )}
                <circle cx="15" cy="85" r="2.5" fill="#0B2A5B" />
                <circle cx="80" cy="35" r="2.5" fill="#0B2A5B" />
              </svg>
            </div>

            <div className="flex-1 flex flex-col gap-1 text-[11px] text-navy-900">
              <div>
                <span className="font-semibold text-ink-600">Sumbu X: </span>
                <span className="font-mono">{grafis.sumbu_x?.nama || "t"} ({grafis.sumbu_x?.satuan || "s"})</span>
              </div>
              <div>
                <span className="font-semibold text-ink-600">Sumbu Y: </span>
                <span className="font-mono">{grafis.sumbu_y?.nama || "v"} ({grafis.sumbu_y?.satuan || "m/s"})</span>
              </div>
              <div>
                <span className="font-semibold text-ink-600">Bentuk: </span>
                <span className="capitalize">{grafis.bentuk || "Linear"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
