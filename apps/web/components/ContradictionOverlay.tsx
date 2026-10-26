"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

export interface ContradictionUI {
  id: string;
  pasangan: string;
  kode_error: string;
  status: string;
  representasi_menyimpang: string[];
  sumber: { representasi: string; elemen: string; label?: string };
  tujuan: { representasi: string; elemen: string; token?: string };
  percobaan_terpakai: number;
  percobaan_maks: number;
  hint_level: number;
  coba_perbaiki_terkunci: boolean;
}

interface ContradictionOverlayProps {
  contradictions: ContradictionUI[];
  onSelectContradiction: (c: ContradictionUI) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ContradictionOverlay({
  contradictions,
  onSelectContradiction,
  containerRef,
}: ContradictionOverlayProps) {
  const [coords, setCoords] = useState<
    { id: string; x1: number; y1: number; x2: number; y2: number; c: ContradictionUI }[]
  >([]);

  const calculatePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const activeList = contradictions.filter((c) => c.status === "aktif");
    const newCoords = [];

    for (const c of activeList) {
      // Find source element in DOM
      let srcEl = document.getElementById(`force-${c.sumber.elemen}`) ||
                  document.getElementById(`panel-${c.sumber.representasi}`);

      // Find target element in DOM
      let tgtEl = document.getElementById(`line-${c.tujuan.elemen}`) ||
                  document.getElementById("kurva-grafis") ||
                  document.getElementById(`panel-${c.tujuan.representasi}`);

      if (srcEl && tgtEl) {
        const sRect = srcEl.getBoundingClientRect();
        const tRect = tgtEl.getBoundingClientRect();

        const x1 = sRect.left + sRect.width / 2 - containerRect.left;
        const y1 = sRect.top + sRect.height / 2 - containerRect.top;
        const x2 = tRect.left + tRect.width / 2 - containerRect.left;
        const y2 = tRect.top + tRect.height / 2 - containerRect.top;

        newCoords.push({ id: c.id, x1, y1, x2, y2, c });
      }
    }
    setCoords(newCoords);
  };

  useEffect(() => {
    calculatePositions();
    const handleResize = () => calculatePositions();
    window.addEventListener("resize", handleResize);
    const interval = setInterval(calculatePositions, 800);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, [contradictions]);

  if (coords.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      <svg className="w-full h-full">
        {coords.map((item) => {
          const { id, x1, y1, x2, y2, c } = item;

          // Cubic Bezier curve control points
          const dx = (x2 - x1) * 0.5;
          const dy = (y2 - y1) * 0.5;
          const cx1 = x1 + dx;
          const cy1 = y1;
          const cx2 = x1 + dx;
          const cy2 = y2;
          const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

          // Midpoint of curve
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={id}>
              {/* Endpoint highlight rings (UI/UX 11.2 item 8) */}
              <circle cx={x1} cy={y1} r="14" fill="none" stroke="#B45309" strokeWidth="1.5" strokeDasharray="3,3" />
              <circle cx={x2} cy={y2} r="14" fill="none" stroke="#B45309" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* Garis putus-putus amber 2px kurva Bezier */}
              <path
                d={pathD}
                fill="none"
                stroke="#B45309"
                strokeWidth="2"
                strokeDasharray="5,4"
              />

              {/* Ikon Hint di titik tengah: tombol Navy 32px lingkaran, bola lampu putih, cincin amber (U-03) */}
              <foreignObject
                x={midX - 16}
                y={midY - 16}
                width="32"
                height="32"
                className="overflow-visible pointer-events-auto"
              >
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => onSelectContradiction(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectContradiction(c);
                    }
                  }}
                  title="Ada ketidaksesuaian di sini. Klik untuk melihat petunjuk."
                  aria-label={`Ada ketidaksesuaian antara ${c.sumber.representasi} dan ${c.tujuan.representasi}`}
                  className="size-8 rounded-full bg-navy-700 text-white flex items-center justify-center ring-2 ring-warning ring-offset-2 hover:bg-navy-500 focus:outline-none focus:ring-4 focus:ring-warning cursor-pointer shadow-md transition-transform hover:scale-110 active:scale-95"
                >
                  <Lightbulb className="size-4 text-white" />
                </button>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
