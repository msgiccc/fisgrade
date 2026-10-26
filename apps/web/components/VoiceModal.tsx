"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, RefreshCw } from "lucide-react";

interface VoiceModalProps {
  open: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
}

export function VoiceModal({ open, onClose, onApplyText }: VoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "id-ID";

        recog.onresult = (event: any) => {
          let current = "";
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + " ";
          }
          setTranscript(current.trim());
        };

        recog.onerror = () => {
          setIsRecording(false);
        };

        recog.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recog);
      } else {
        setSupported(false);
      }
    }
  }, []);

  const startRecording = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stopRecording = () => {
    if (recognition) {
      try {
        recognition.stop();
        setIsRecording(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleApply = () => {
    stopRecording();
    onApplyText(transcript);
    onClose();
  };

  const handleReset = () => {
    setTranscript("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md bg-white border-surface-200">
        <DialogHeader>
          <DialogTitle className="text-navy-900 flex items-center justify-between">
            <span>Dikte Suara</span>
            {isRecording && (
              <span className="flex items-center gap-1.5 text-xs text-error animate-pulse">
                <span className="size-2 rounded-full bg-error" /> Merekam...
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {!supported && (
            <p className="text-xs text-warning">
              Web Speech API tidak didukung pada peramban ini. Anda dapat mengetikkan transkrip secara manual.
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-600 font-medium">Transkrip (dapat disunting):</span>
            {supported && (
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "outline"}
                onClick={isRecording ? stopRecording : startRecording}
                className="gap-1.5"
              >
                {isRecording ? (
                  <>
                    <MicOff className="size-4" data-icon="inline-start" /> Berhenti
                  </>
                ) : (
                  <>
                    <Mic className="size-4" data-icon="inline-start" /> Mulai Dikte
                  </>
                )}
              </Button>
            )}
          </div>

          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transkrip suara Anda akan muncul di sini..."
            className="min-h-32 text-sm text-navy-900 border-surface-200 focus-visible:ring-navy-500"
          />

          <p className="text-xs text-ink-600">
            Periksa istilah fisika sebelum digunakan. Audio tidak disimpan oleh sistem FisGrade.
          </p>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RefreshCw className="size-3.5" data-icon="inline-start" /> Rekam ulang
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!transcript.trim()}
            className="bg-navy-700 hover:bg-navy-500 text-white"
          >
            Gunakan teks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
