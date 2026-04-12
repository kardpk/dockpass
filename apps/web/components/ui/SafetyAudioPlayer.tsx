"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * SafetyAudioPlayer — Minimal HTML5 audio player button.
 *
 * Plays a pre-recorded MP3/M4A from Supabase Storage.
 * No browser TTS dependency — guaranteed quality on every device.
 *
 * ADA-compliant: aria-label, role, keyboard-accessible.
 */

interface SafetyAudioPlayerProps {
  audioUrl: string | null;
  /** Optional size variant */
  size?: "sm" | "md";
}

export function SafetyAudioPlayer({ audioUrl, size = "md" }: SafetyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const toggle = useCallback(async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      setHasError(false);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isPlaying]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleError = useCallback(() => {
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(true);
  }, []);

  // If no audio URL provided, render nothing (graceful degradation)
  if (!audioUrl) return null;

  const iconSize = size === "sm" ? 14 : 18;
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading || hasError}
        className={cn(
          btnSize,
          "rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
          isPlaying
            ? "bg-navy text-white shadow-sm animate-pulse"
            : hasError
              ? "bg-error-bg text-error-text cursor-not-allowed"
              : "bg-light-blue text-navy hover:bg-navy hover:text-white"
        )}
        aria-label={isPlaying ? "Pause safety audio" : "Play safety audio"}
        role="button"
        title={hasError ? "Audio unavailable" : isPlaying ? "Tap to stop" : "Tap to listen"}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : isPlaying ? (
          <VolumeX size={iconSize} />
        ) : (
          <Volume2 size={iconSize} />
        )}
      </button>

      {/* Hidden HTML5 audio element — no native controls visible */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onEnded={handleEnded}
        onError={handleError}
      />
    </>
  );
}
