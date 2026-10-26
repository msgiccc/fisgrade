"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Box, ArrowRight, Undo, Redo } from "lucide-react";

export interface VisualForce {
  id: string;
  label: string;
  objek: string;
  sudut: number; // derajat 0..360
  panjang_rel: number; // 0.1..1.0
}

export interface VisualObject {
  id: string;
  tipe: string; // balok, bidang_datar, bidang_miring
  kasar?: boolean;
}

export interface VisualData {
  representasi: "visual";
  objek: VisualObject[];
  gaya: VisualForce[];
  sumbu: { x: string };
  rev?: number;
}

interface VisualPanelProps {
  data: VisualData;
  onChange: (data: VisualData) => void;
  highlightedElementId?: string;
}

export function VisualPanel({ data, onChange, highlightedElementId }: VisualPanelProps) {
  const [selectedForceId, setSelectedForceId] = useState<string | null>(null);

  const objects = data.objek || [];
  const forces = data.gaya || [];

  const handleAddObject = (tipe: string) => {
    const newObj: VisualObject = {
      id: `o${objects.length + 1}`,
      tipe,
      kasar: true,
    };
    onChange({
      ...data,
      objek: [...objects, newObj],
    });
  };

  const handleAddForce = () => {
    const nextId = `g${forces.length + 1}`;
    const newForce: VisualForce = {
      id: nextId,
      label: forces.length === 0 ? "F" : forces.length === 1 ? "f_k" : "N",
      objek: "o1",
      sudut: forces.length === 0 ? 0 : forces.length === 1 ? 180 : 90,
      panjang_rel: 0.6,
    };
    onChange({
      ...data,
      gaya: [...forces, newForce],
    });
    setSelectedForceId(nextId);
  };

  const handleUpdateForce = (id: string, field: keyof VisualForce, val: any) => {
    const updated = forces.map((f) => (f.id === id ? { ...f, [field]: val } : f));
    onChange({
      ...data,
      gaya: updated,
    });
  };

  const handleDeleteForce = (id: string) => {
    onChange({
      ...data,
      gaya: forces.filter((f) => f.id !== id),
    });
    if (selectedForceId === id) setSelectedForceId(null);
  };

  const handleClear = () => {
    if (confirm("Kosongkan kanvas visual?")) {
      onChange({
        representasi: "visual",
        objek: [],
        gaya: [],
        sumbu: { x: "kanan" },
      });
      setSelectedForceId(null);
    }
  };

  // Center coordinate of the canvas diagram
  const cx = 150;
  const cy = 110;
  const maxArrowLength = 65;

  return (
    <div
      id="panel-visual"
      className="flex flex-col h-full bg-white rounded-lg border border-surface-200 p-3.5 focus-within:border-navy-500 transition-colors"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-200">
        <Badge className="bg-navy-700 text-white font-medium hover:bg-navy-700">
          2 Visual (Diagram)
        </Badge>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="h-8 size-8 p-0 text-ink-600 hover:text-error"
            title="Kosongkan diagram"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* SVG Drawing Canvas with Dot Grid */}
        <div className="flex-1 border border-surface-200 rounded-md bg-surface-50 relative overflow-hidden flex items-center justify-center min-h-48">
          <svg width="100%" height="100%" viewBox="0 0 300 220" className="select-none">
            {/* Dot grid */}
            <defs>
              <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#D9DFEA" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid)" />

            {/* Bidang datar */}
            {objects.some((o) => o.tipe.startsWith("bidang")) && (
              <g>
                <line x1="30" y1={cy + 30} x2="270" y2={cy + 30} stroke="#071B3D" strokeWidth="2.5" />
                {/* Hatching for rough surface */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <line
                    key={i}
                    x1={40 + i * 15}
                    y1={cy + 30}
                    x2={32 + i * 15}
                    y2={cy + 42}
                    stroke="#4B5568"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            )}

            {/* Balok */}
            {objects.some((o) => o.tipe === "balok") && (
              <g id="objek-balok">
                <rect
                  x={cx - 35}
                  y={cy - 20}
                  width="70"
                  height="50"
                  fill="#FFFFFF"
                  stroke="#0B2A5B"
                  strokeWidth="2"
                  rx="3"
                />
                <text
                  x={cx}
                  y={cy + 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#0B2A5B"
                >
                  m = 5 kg
                </text>
              </g>
            )}

            {/* Panah Gaya */}
            {forces.map((f) => {
              const rad = (f.sudut * Math.PI) / 180;
              const len = f.panjang_rel * maxArrowLength;
              const endX = cx + len * Math.cos(rad);
              const endY = cy - len * Math.sin(rad); // invert Y for standard Cartesian

              const isHighlighted = highlightedElementId === f.id;
              const isSelected = selectedForceId === f.id;

              return (
                <g
                  key={f.id}
                  id={`force-${f.id}`}
                  onClick={() => setSelectedForceId(f.id)}
                  className="cursor-pointer"
                >
                  {/* Highlight ring if contradiction anchor */}
                  {isHighlighted && (
                    <circle cx={endX} cy={endY} r="9" fill="none" stroke="#B45309" strokeWidth="2" strokeDasharray="3,3" />
                  )}

                  {/* Arrow stem */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={endX}
                    y2={endY}
                    stroke={isSelected ? "#1F4E9C" : "#0B2A5B"}
                    strokeWidth={isSelected ? 3 : 2.5}
                  />

                  {/* Arrowhead marker */}
                  <circle
                    cx={endX}
                    cy={endY}
                    r={isSelected ? 5 : 4}
                    fill={isHighlighted ? "#B45309" : "#0B2A5B"}
                  />

                  {/* Force Label */}
                  <text
                    x={endX + 10 * Math.cos(rad)}
                    y={endY - 8 * Math.sin(rad) + 4}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill={isHighlighted ? "#B45309" : "#071B3D"}
                    className="select-none"
                  >
                    {f.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Aset Library sidebar */}
        <div className="w-28 flex flex-col gap-1.5 border-l border-surface-200 pl-2">
          <span className="text-[11px] font-semibold text-ink-600 uppercase tracking-wider">Aset</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddObject("balok")}
            className="h-7 text-xs justify-start gap-1 px-2 border-surface-200"
          >
            <Box className="size-3.5" data-icon="inline-start" /> Balok
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddObject("bidang_datar")}
            className="h-7 text-xs justify-start gap-1 px-2 border-surface-200"
          >
            <span className="size-3.5 border-b-2 border-current inline-block" /> Bidang
          </Button>

          <span className="text-[11px] font-semibold text-ink-600 uppercase tracking-wider mt-2">Gaya</span>
          <Button
            size="sm"
            onClick={handleAddForce}
            className="h-7 text-xs bg-navy-700 hover:bg-navy-500 text-white gap-1 px-2"
          >
            <Plus className="size-3.5" data-icon="inline-start" /> + Gaya
          </Button>
        </div>
      </div>

      {/* Force Form Mode (U-08: mode form untuk keyboard-accessibility) */}
      <div className="mt-2 pt-2 border-t border-surface-200">
        <div className="flex items-center justify-between text-xs text-ink-600 font-medium mb-1">
          <span>Daftar Gaya:</span>
          <span>Arah (0°: kanan, 90°: atas, 180°: kiri, 270°: bawah)</span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
          {forces.length === 0 ? (
            <span className="text-xs text-ink-600 italic">Belum ada gaya. Klik "+ Gaya" untuk menambahkan.</span>
          ) : (
            forces.map((f) => (
              <div
                key={f.id}
                className={`flex items-center gap-1.5 p-1 rounded border text-xs ${
                  selectedForceId === f.id ? "bg-navy-100 border-navy-500" : "bg-white border-surface-200"
                }`}
              >
                <span className="w-6 font-bold text-navy-900">{f.id}</span>
                <Input
                  value={f.label}
                  onChange={(e) => handleUpdateForce(f.id, "label", e.target.value)}
                  placeholder="Label"
                  className="h-6 w-16 text-xs px-1.5"
                />
                <span className="text-ink-600">∠</span>
                <Input
                  type="number"
                  value={f.sudut}
                  onChange={(e) => handleUpdateForce(f.id, "sudut", parseFloat(e.target.value) || 0)}
                  placeholder="°"
                  className="h-6 w-16 text-xs px-1.5"
                />
                <span className="text-ink-600">°</span>
                <span className="text-ink-600 ml-1">L:</span>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.5"
                  value={f.panjang_rel}
                  onChange={(e) => handleUpdateForce(f.id, "panjang_rel", parseFloat(e.target.value) || 0.5)}
                  className="h-6 w-16 text-xs px-1.5"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteForce(f.id)}
                  className="h-6 size-6 p-0 text-ink-600 hover:text-error ml-auto"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
