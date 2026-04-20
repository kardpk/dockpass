"use client";

import Image from "next/image";
import { ShieldCheck, MessageSquareText, Shield, User, Flame, Radio, AlertTriangle, Lock, Wind, Droplets, Sun, Info } from "lucide-react";
import { SafetyAudioPlayer } from "@/components/ui/SafetyAudioPlayer";

function getTopicIcon(topic: string | undefined) {
  switch (topic) {
    case 'life_jackets': return <Shield size={48} className="text-ink-muted opacity-30" />;
    case 'fitting_jackets': return <User size={48} className="text-ink-muted opacity-30" />;
    case 'fire_extinguisher': return <Flame size={48} className="text-ink-muted opacity-30" />;
    case 'vhf_radio': return <Radio size={48} className="text-ink-muted opacity-30" />;
    case 'emergency_procedures': return <AlertTriangle size={48} className="text-ink-muted opacity-30" />;
    case 'restricted_areas': return <Lock size={48} className="text-ink-muted opacity-30" />;
    case 'seasickness': return <Wind size={48} className="text-ink-muted opacity-30" />;
    case 'marine_toilet': return <Droplets size={48} className="text-ink-muted opacity-30" />;
    case 'sun_exposure': return <Sun size={48} className="text-ink-muted opacity-30" />;
    default: return <Info size={48} className="text-ink-muted opacity-30" />;
  }
}

/**
 * GuestSafetyCard — The card guests swipe through during boarding/checkin.
 *
 * Data sources:
 * - image_url + captainNote → from boats.safety_cards JSONB (Captain's boat-specific data)
 * - title + instructions + audioUrl → from global_safety_dictionary (Admin-managed, localized)
 *
 * This is a SCAFFOLD — it renders correctly with all props but is not yet
 * wired into the guest trip page routing. That happens in the Checkin Flow task.
 */

interface GuestSafetyCardProps {
  topicKey?: string;
  imageUrl: string | null;       // Captain's boat-specific photo
  title: string;                 // From dictionary (localized)
  instructions: string;          // From dictionary (localized, legal-grade)
  audioUrl: string | null;       // From dictionary (pre-recorded MP3)
  emoji: string;                 // Topic emoji
  captainNote: string | null;    // Captain's custom instructions from safety_cards JSONB
  cardIndex: number;             // 1-based position
  totalCards: number;            // Total card count
  onAcknowledge?: () => void;    // Callback when guest taps "I Understand"
}

export function GuestSafetyCard({
  topicKey,
  imageUrl,
  title,
  instructions,
  audioUrl,
  emoji,
  captainNote,
  cardIndex,
  totalCards,
  onAcknowledge,
}: GuestSafetyCardProps) {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-[#E5E7EB]">
      {/* Image section — Captain's boat-specific photo */}
      {imageUrl ? (
        <div className="relative w-full aspect-[16/10] bg-navy">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {/* Card position badge */}
          <div className="absolute top-3 right-3 bg-black/50 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            {cardIndex} / {totalCards}
          </div>
          {/* USCG shield badge */}
          <div className="absolute top-3 left-3 bg-navy text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={12} /> USCG
          </div>
        </div>
      ) : (
        <div className="w-full aspect-[16/10] bg-[#F5F0E8] flex flex-col items-center justify-center gap-2 relative">
          {getTopicIcon(topicKey)}
          <div className="absolute top-3 right-3 bg-black/10 text-navy text-[11px] font-medium px-2.5 py-1 rounded-full">
            {cardIndex} / {totalCards}
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-5 space-y-4">
        {/* Title row — emoji + title + audio player */}
        <div className="flex items-center gap-3">
          <span className="text-[24px] shrink-0">{emoji}</span>
          <h3 className="text-[17px] font-semibold text-navy flex-1 leading-snug">
            {title}
          </h3>
          <SafetyAudioPlayer audioUrl={audioUrl} size="md" />
        </div>

        {/* Dictionary instructions (legal-grade, localized) */}
        <p className="text-[14px] text-[#374151] leading-relaxed">
          {instructions}
        </p>

        {/* Captain's custom note (only if different from dictionary) */}
        {captainNote && (
          <div className="bg-bg rounded-[12px] p-3.5 flex items-start gap-2.5">
            <MessageSquareText size={16} className="text-navy shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-navy uppercase tracking-wider mb-1">
                Your captain&apos;s note
              </p>
              <p className="text-[13px] text-[#374151] leading-relaxed">
                {captainNote}
              </p>
            </div>
          </div>
        )}

        {/* Acknowledge button */}
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full h-[48px] bg-navy hover:bg-[#0A3A6B] text-white text-[15px] font-semibold rounded-[12px] transition-colors flex items-center justify-center gap-2"
        >
          I Understand ✓
        </button>

        {/* Progress text */}
        <p className="text-[11px] text-[#9CA3AF] text-center">
          Safety card {cardIndex} of {totalCards}
        </p>
      </div>
    </div>
  );
}
