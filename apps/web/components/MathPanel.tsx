"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export interface MathLine {
  id: string;
  ekspresi: string;
  sintaks_ok: boolean;
}

export interface MathData {
  representasi: "matematis";
  baris: MathLine[];
  rev?: number;
}

interface MathPanelProps {
  data: MathData;
  onChange: (data: MathData) => void;
  highlightedLineId?: string;
}

export function MathPanel({ data, onChange, highlightedLineId }: MathPanelProps) {
  const [keypadOpen, setKeypadOpen] = useState(true);
  const [activeLineId, setActiveLineId] = useState<string>("m1");

  const lines = data.baris || [
    { id: "m1", ekspresi: "sum_F = m*a", sintaks_ok: true },
  ];

  const handleUpdateLine = (id: string, text: string) => {
    const updated = lines.map((l) =>
      l.id === id ? { ...l, ekspresi: text, sintaks_ok: true } : l
    );
    onChange({ ...data, baris: updated });
  };

  const handleAddLine = () => {
    const nextId = `m${lines.length + 1}`;
    const newLine = { id: nextId, ekspresi: "", sintaks_ok: true };
    onChange({ ...data, baris: [...lines, newLine] });
    setActiveLineId(nextId);
  };

  const handleDeleteLine = (id: string) => {
    if (lines.length <= 1) {
      onChange({ ...data, baris: [{ id: "m1", ekspresi: "", sintaks_ok: true }] });
      return;
    }
    const filtered = lines.filter((l) => l.id !== id);
    onChange({ ...data, baris: filtered });
  };

  const handleInsertSymbol = (sym: string) => {
    const line = lines.find((l) => l.id === activeLineId) || lines[lines.length - 1];
    if (line) {
      handleUpdateLine(line.id, line.ekspresi + sym);
    }
  };

  const keypadRows = [
    ["7", "8", "9", "÷", "=", "a", "m", "F", "N", "W"],
    ["4", "5", "6", "×", "f_k", "g", "μ_k", "θ", "Σ", "Δ"],
    ["1", "2", "3", "-", "+", "(", ")", "x", "v", "t"],
    ["0", ".", "^2", "√", "m/s^2", "m/s", "kg", "N", "s", "⌫"],
  ];

  return (
    <div
      id="panel-matematis"
      className="flex flex-col h-full bg-white rounded-lg border border-surface-200 p-3.5 focus-within:border-navy-500 transition-colors"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-200">
        <Badge className="bg-navy-700 text-white font-medium hover:bg-navy-700">
          3 Matematis (Perhitungan)
        </Badge>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddLine}
            className="h-8 text-xs text-navy-700 border-surface-200 gap-1 px-2"
          >
            <Plus className="size-3.5" data-icon="inline-start" /> Baris
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setKeypadOpen(!keypadOpen)}
            className="h-8 text-xs text-ink-600 gap-1 px-2"
          >
            {keypadOpen ? (
              <>
                <ChevronUp className="size-3.5" data-icon="inline-end" /> Lipat
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" data-icon="inline-end" /> Papan Ketik
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Equation Lines Editor */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto mb-2 min-h-24 pr-1">
        {lines.map((line, idx) => {
          const isHighlighted = highlightedLineId === line.id;
          const isActive = activeLineId === line.id;

          return (
            <div
              key={line.id}
              id={`line-${line.id}`}
              onClick={() => setActiveLineId(line.id)}
              className={`flex items-center gap-2 p-1.5 rounded border transition-colors ${
                isHighlighted
                  ? "border-warning bg-warning/10 ring-1 ring-warning"
                  : isActive
                  ? "border-navy-500 bg-surface-50"
                  : "border-surface-200 hover:bg-surface-50"
              }`}
            >
              <span className="text-xs font-bold text-navy-900 w-6 tabular-nums">
                {idx + 1}.
              </span>
              <Input
                value={line.ekspresi}
                onChange={(e) => handleUpdateLine(line.id, e.target.value)}
                placeholder="Ketik persamaan..."
                className="h-8 font-mono text-sm border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteLine(line.id)}
                className="h-7 size-7 p-0 text-ink-600 hover:text-error ml-auto"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Virtual Math Keypad (FR-E4: 10 kolom x 4 baris) */}
      {keypadOpen && (
        <div className="bg-surface-50 border border-surface-200 rounded-md p-1.5 flex flex-col gap-1">
          {keypadRows.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-10 gap-1">
              {row.map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => {
                    if (btn === "⌫") {
                      const cur = lines.find((l) => l.id === activeLineId);
                      if (cur && cur.ekspresi) {
                        handleUpdateLine(cur.id, cur.ekspresi.slice(0, -1));
                      }
                    } else {
                      handleInsertSymbol(btn);
                    }
                  }}
                  className="h-7 text-xs font-medium rounded bg-white border border-surface-200 text-navy-900 hover:bg-navy-100 active:bg-navy-500 active:text-white transition-colors flex items-center justify-center select-none"
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
