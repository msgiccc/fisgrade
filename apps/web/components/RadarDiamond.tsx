"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export interface RadarData {
  verbal: number;
  matematis: number;
  visual: number;
  grafis: number;
}

export interface RadarStatuses {
  verbal?: string;
  matematis?: string;
  visual?: string;
  grafis?: string;
}

interface RadarDiamondProps {
  data: RadarData;
  secondaryData?: RadarData;
  statuses?: RadarStatuses;
  size?: number;
  title?: string;
}

export function RadarDiamond({
  data,
  secondaryData,
  statuses = {},
  size = 360,
  title = "Skor Otomatis"
}: RadarDiamondProps) {
  const center = size / 2;
  const maxR = size * 0.38;

  // Sumbu: Verbal (Atas), Matematis (Kanan), Visual (Bawah), Grafis (Kiri) - UI/UX 11.4
  // Sudut: Verbal = -90° (top), Matematis = 0° (right), Visual = 90° (bottom), Grafis = 180° (left)
  const mapValueToCoord = (val: number, angleDeg: number) => {
    const r = (Math.max(0, Math.min(100, val)) / 100) * maxR;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const pVerbal = mapValueToCoord(data.verbal ?? 0, -90);
  const pMatematis = mapValueToCoord(data.matematis ?? 0, 0);
  const pVisual = mapValueToCoord(data.visual ?? 0, 90);
  const pGrafis = mapValueToCoord(data.grafis ?? 0, 180);

  const polygonPoints = `${pVerbal.x},${pVerbal.y} ${pMatematis.x},${pMatematis.y} ${pVisual.x},${pVisual.y} ${pGrafis.x},${pGrafis.y}`;

  let secondaryPolygon = "";
  if (secondaryData) {
    const sV = mapValueToCoord(secondaryData.verbal ?? 0, -90);
    const sM = mapValueToCoord(secondaryData.matematis ?? 0, 0);
    const sVis = mapValueToCoord(secondaryData.visual ?? 0, 90);
    const sG = mapValueToCoord(secondaryData.grafis ?? 0, 180);
    secondaryPolygon = `${sV.x},${sV.y} ${sM.x},${sM.y} ${sVis.x},${sVis.y} ${sG.x},${sG.y}`;
  }

  const rings = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center justify-center p-2">
      {title && (
        <span className="text-sm font-semibold text-navy-900 mb-1">{title}</span>
      )}
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Cincin konsentris belah ketupat */}
        {rings.map((ring) => {
          const r = (ring / 100) * maxR;
          const pts = `${center},${center - r} ${center + r},${center} ${center},${center + r} ${center - r},${center}`;
          return (
            <g key={ring}>
              <polygon
                points={pts}
                fill="none"
                stroke="#D9DFEA"
                strokeWidth={1}
                strokeDasharray={ring === 100 ? undefined : "3,3"}
              />
              <text
                x={center + 4}
                y={center - r + 12}
                fontSize={10}
                fill="#4B5568"
                fontFamily="Inter, sans-serif"
              >
                {ring}
              </text>
            </g>
          );
        })}

        {/* Sumbu garis silang */}
        <line
          x1={center}
          y1={center - maxR}
          x2={center}
          y2={center + maxR}
          stroke="#D9DFEA"
          strokeWidth={1.5}
        />
        <line
          x1={center - maxR}
          y1={center}
          x2={center + maxR}
          y2={center}
          stroke="#D9DFEA"
          strokeWidth={1.5}
        />

        {/* Poligon skor otomatis (Navy-700 opasitas 18%) */}
        <polygon
          points={polygonPoints}
          fill="#0B2A5B"
          fillOpacity={0.18}
          stroke="#0B2A5B"
          strokeWidth={2}
        />

        {/* Titik sudut skor otomatis */}
        {[pVerbal, pMatematis, pVisual, pGrafis].map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill="#FFFFFF"
            stroke="#0B2A5B"
            strokeWidth={2}
          />
        ))}

        {/* Lapisan kedua (Skor Dosen) bila ada */}
        {secondaryPolygon && (
          <polygon
            points={secondaryPolygon}
            fill="#1F4E9C"
            fillOpacity={0.15}
            stroke="#1F4E9C"
            strokeWidth={2}
            strokeDasharray="4,3"
          />
        )}

        {/* Label Sumbu & Nilai */}
        {/* 1. Verbal (Atas) */}
        <text
          x={center}
          y={center - maxR - 16}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="#071B3D"
        >
          Verbal: {data.verbal}
        </text>
        {statuses.verbal === "belum_terselesaikan" && (
          <g transform={`translate(${center + 42}, ${center - maxR - 26})`}>
            <circle cx={6} cy={6} r={7} fill="#B45309" />
            <text x={4} y={10} fill="#FFFFFF" fontSize={10} fontWeight="bold">!</text>
          </g>
        )}

        {/* 2. Matematis (Kanan) */}
        <text
          x={center + maxR + 14}
          y={center + 4}
          textAnchor="start"
          fontSize={12}
          fontWeight={600}
          fill="#071B3D"
        >
          Matematis: {data.matematis}
        </text>
        {statuses.matematis === "belum_terselesaikan" && (
          <g transform={`translate(${center + maxR + 104}, ${center - 6})`}>
            <circle cx={6} cy={6} r={7} fill="#B45309" />
            <text x={4} y={10} fill="#FFFFFF" fontSize={10} fontWeight="bold">!</text>
          </g>
        )}

        {/* 3. Visual (Bawah) */}
        <text
          x={center}
          y={center + maxR + 24}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="#071B3D"
        >
          Visual: {data.visual}
        </text>
        {statuses.visual === "belum_terselesaikan" && (
          <g transform={`translate(${center + 38}, ${center + maxR + 14})`}>
            <circle cx={6} cy={6} r={7} fill="#B45309" />
            <text x={4} y={10} fill="#FFFFFF" fontSize={10} fontWeight="bold">!</text>
          </g>
        )}

        {/* 4. Grafis (Kiri) */}
        <text
          x={center - maxR - 14}
          y={center + 4}
          textAnchor="end"
          fontSize={12}
          fontWeight={600}
          fill="#071B3D"
        >
          Grafis: {data.grafis}
        </text>
        {statuses.grafis === "belum_terselesaikan" && (
          <g transform={`translate(${center - maxR - 92}, ${center - 6})`}>
            <circle cx={6} cy={6} r={7} fill="#B45309" />
            <text x={4} y={10} fill="#FFFFFF" fontSize={10} fontWeight="bold">!</text>
          </g>
        )}
      </svg>
    </div>
  );
}
