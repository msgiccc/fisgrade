"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Trash2 } from "lucide-react";
import { VoiceModal } from "@/components/VoiceModal";

interface VerbalPanelProps {
  value: string;
  onChange: (val: string) => void;
  highlighted?: boolean;
}

export function VerbalPanel({ value, onChange, highlighted }: VerbalPanelProps) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const maxLength = 1500;

  const handleApplyVoice = (text: string) => {
    if (value.trim()) {
      onChange(`${value.trim()} ${text.trim()}`);
    } else {
      onChange(text.trim());
    }
  };

  const handleClear = () => {
    if (confirm("Apakah Anda yakin ingin menghapus teks pada kanvas verbal?")) {
      onChange("");
    }
  };

  return (
    <div
      id="panel-verbal"
      className={`flex flex-col h-full bg-white rounded-lg border p-3.5 transition-colors relative ${
        highlighted ? "border-warning ring-2 ring-warning/30" : "border-surface-200 focus-within:border-navy-500"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <Badge className="bg-navy-700 text-white font-medium hover:bg-navy-700">
            1 Verbal (Penjelasan)
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVoiceOpen(true)}
            className="h-8 gap-1.5 text-xs text-navy-700 border-surface-200"
            title="Dikte suara melalui mikrofon"
          >
            <Mic className="size-3.5" data-icon="inline-start" /> Dikte suara
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={!value}
            className="h-8 size-8 p-0 text-ink-600 hover:text-error"
            title="Hapus penjelasan"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col">
        <Textarea
          id="verbal-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder="Tuliskan penjelasan konsep Anda di sini..."
          className="flex-1 resize-none border-0 p-0 text-sm leading-relaxed text-navy-900 focus-visible:ring-0 shadow-none"
        />

        {/* Counter */}
        <div className="flex justify-end pt-1">
          <span className="text-xs text-ink-600 tabular-nums">
            {value.length}/{maxLength}
          </span>
        </div>
      </div>

      <VoiceModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApplyText={handleApplyVoice}
      />
    </div>
  );
}
