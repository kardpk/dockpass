"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Camera,
  Shield,
  ShieldCheck,
  Upload,
  TriangleAlert,
  Check,
  Loader2,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { UscgPopover } from "@/components/ui/UscgPopover";
import type {
  WizardData,
  SafetyCard,
  BoatTypeKey,
} from "../types";
import {
  USCG_UNIVERSAL_TOPICS,
  BOAT_SPECIFIC_TOPICS,
} from "../types";

const MAX_CARDS = 15;

// ─── Upload helper ───

async function uploadSafetyImage(
  file: File,
  topicKey: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("topic_key", topicKey);

    const res = await fetch("/api/dashboard/wizard/upload-safety-image", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      return { url: null, error: err.error || "Upload failed" };
    }

    const { url } = await res.json();
    return { url, error: null };
  } catch {
    return { url: null, error: "Network error during upload" };
  }
}

// ─── Sortable card component ───

function SortableCardRow({
  card,
  isRequired,
  onUpdate,
  onDelete,
  onUploadImage,
}: {
  card: SafetyCard;
  isRequired: boolean;
  onUpdate: (updates: Partial<SafetyCard>) => void;
  onDelete: () => void;
  onUploadImage: (file: File) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  // Derive display label
  const topicMeta = [
    ...USCG_UNIVERSAL_TOPICS,
    ...Object.values(BOAT_SPECIFIC_TOPICS).flat(),
  ].find((t) => t.key === card.topic_key);

  const displayLabel =
    card.topic_key === "custom"
      ? card.custom_title || "Custom Safety Topic"
      : topicMeta?.label || card.topic_key;

  const displayEmoji = topicMeta?.emoji || "";

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ preview: reader.result as string, file });
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    onUploadImage(file);
    setUploading(false);

    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderRadius: 'var(--r-1)',
        border: isDragging
          ? '2px solid var(--color-brass)'
          : '1px solid var(--color-line)',
        background: 'var(--color-paper)',
        overflow: 'hidden',
        boxShadow: isDragging ? 'var(--shadow-float)' : 'none',
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      {/* ─── HEADER ZONE ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-2)',
          padding: 'var(--s-2) var(--s-3)',
          background: 'var(--color-bone)',
          borderBottom: '1px solid var(--color-line-soft)',
        }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none"
          style={{
            background: 'none', border: 'none', cursor: 'grab',
            color: 'var(--color-ink-muted)', opacity: 0.4,
            display: 'flex', alignItems: 'center', flexShrink: 0, padding: '2px 4px',
          }}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </button>

        {/* Topic title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {card.topic_key === 'custom' ? (
            <input
              value={card.custom_title || ''}
              onChange={(e) => onUpdate({ custom_title: e.target.value })}
              placeholder="Custom topic name"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--color-line)',
                padding: '2px 0',
                fontSize: 'var(--t-body-sm)',
                fontWeight: 500,
                color: 'var(--color-ink)',
                outline: 'none',
              }}
            />
          ) : (
            <p
              className="font-display"
              style={{
                fontSize: 'var(--t-body-sm)',
                fontWeight: 500,
                color: 'var(--color-ink)',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayLabel}
            </p>
          )}
        </div>

        {/* USCG pill — amber severity */}
        {isRequired && (
          <UscgPopover
            title="USCG Mandatory Safety Topic"
            citationPath="46 CFR §26.03-2"
            explanation="The Coast Guard requires uninspected passenger vessels to brief all passengers on safety and emergency procedures before departure."
          >
            <span
              className="pill pill--warn"
              style={{ fontSize: 'var(--t-mono-xs)', flexShrink: 0 }}
            >
              USCG
            </span>
          </UscgPopover>
        )}

        {/* Delete / clear */}
        <button
          onClick={() => {
            if (isRequired) {
              onUpdate({ image_url: null, preview: '', file: null });
            } else {
              onDelete();
            }
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-ink-muted)', padding: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
          title={isRequired ? 'Clear image (required topic)' : 'Remove card'}
          aria-label={isRequired ? 'Clear image' : 'Remove card'}
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* ─── CONTENT ZONE ─── */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--s-3)',
          padding: 'var(--s-3)',
          alignItems: 'flex-start',
        }}
      >
        {/* Photo upload — 96×72, dashed brass border when empty */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            width: 96, height: 72, flexShrink: 0,
            borderRadius: 'var(--r-1)',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            border: (card.preview || card.image_url)
              ? '1px solid var(--color-line)'
              : '1.5px dashed var(--color-brass)',
            background: (card.preview || card.image_url)
              ? 'transparent'
              : 'var(--color-bone)',
            transition: 'border-color var(--dur-fast)',
          }}
          aria-label="Upload photo"
        >
          {card.preview || card.image_url ? (
            <>
              <Image
                src={card.preview || card.image_url!}
                alt={displayLabel}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Hover overlay */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(11,30,45,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity var(--dur-fast)',
                }}
                className="group-hover-overlay"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0')}
              >
                <Camera size={18} strokeWidth={1.5} style={{ color: '#fff' }} />
              </div>
            </>
          ) : uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Loader2 size={18} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4,
              }}
            >
              <Upload size={16} strokeWidth={1.5} style={{ color: 'var(--color-brass)' }} />
              <span
                className="mono"
                style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', lineHeight: 1.2 }}
              >
                Add photo
              </span>
            </div>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Instructions */}
        <textarea
          value={card.instructions}
          onChange={(e) => onUpdate({ instructions: e.target.value })}
          placeholder="Describe where this equipment is located on YOUR boat…"
          style={{
            flex: 1,
            minHeight: 88,
            padding: 'var(--s-2) var(--s-3)',
            border: '1px solid var(--color-line)',
            borderRadius: 'var(--r-1)',
            fontSize: 'var(--t-body-sm)',
            color: 'var(--color-ink)',
            background: 'var(--color-paper)',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
          }}
          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-line-dark)'; }}
          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-line)'; }}
        />
      </div>
    </div>
  );
}

// ─── Step 7: Safety Cards Builder ───

interface Step7Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  saveLabel?: string;
}

export function Step7SafetyCards({ data, onNext, saveLabel }: Step7Props) {
  const boatType = data.boatType as BoatTypeKey;

  // Compute required topics based on boat type
  const requiredTopics = [
    ...USCG_UNIVERSAL_TOPICS,
    ...(BOAT_SPECIFIC_TOPICS[boatType] ?? []),
  ];

  const requiredKeys = new Set(requiredTopics.map((t) => t.key));

  // Initialize cards: merge existing with required topics
  const [safetyCards, setSafetyCards] = useState<SafetyCard[]>(() => {
    const existing = data.safetyCards || [];
    const existingKeys = new Set(existing.map((c) => c.topic_key));

    // Add required topics that aren't already in the list
    const missingCards: SafetyCard[] = requiredTopics
      .filter((topic) => !existingKeys.has(topic.key))
      .map((topic, idx) => ({
        id: `card-${topic.key}-${Date.now()}-${idx}`,
        topic_key: topic.key,
        image_url: null,
        file: null,
        preview: "",
        instructions: ("defaultInstructions" in topic ? (topic as { defaultInstructions: string }).defaultInstructions : ""),
        sort_order: existing.length + idx,
      }));

    return [...existing, ...missingCards];
  });

  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = safetyCards.map((c) => c.id);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        setSafetyCards((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    },
    [ids]
  );

  function updateCard(id: string, updates: Partial<SafetyCard>) {
    setSafetyCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  function deleteCard(id: string) {
    setSafetyCards((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleUploadImage(cardId: string, topicKey: string, file: File) {
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });

    const { url, error } = await uploadSafetyImage(file, topicKey);
    if (error) {
      setUploadErrors((prev) => ({ ...prev, [cardId]: error }));
    } else if (url) {
      updateCard(cardId, { image_url: url });
    }
  }

  function addCustomCard() {
    if (safetyCards.length >= MAX_CARDS) return;
    const newCard: SafetyCard = {
      id: `card-custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      topic_key: "custom",
      image_url: null,
      file: null,
      preview: "",
      custom_title: "",
      instructions: "",
      sort_order: safetyCards.length,
    };
    setSafetyCards((prev) => [...prev, newCard]);
  }

  function handleContinue() {
    // Assign sort_order from array position
    const ordered = safetyCards.map((card, i) => ({
      ...card,
      sort_order: i,
    }));
    onNext({ safetyCards: ordered });
  }

  function handleSkip() {
    // Still pass the auto-populated cards so they persist in draft
    const ordered = safetyCards.map((card, i) => ({
      ...card,
      sort_order: i,
    }));
    onNext({ safetyCards: ordered });
  }

  // Count stats
  const uploadedCount = safetyCards.filter((c) => c.image_url || c.preview).length;
  const requiredCount = safetyCards.filter((c) => requiredKeys.has(c.topic_key)).length;
  const requiredWithImage = safetyCards.filter(
    (c) => requiredKeys.has(c.topic_key) && (c.image_url || c.preview)
  ).length;

  return (
    <div className="space-y-section">
      {/* Compliance banner */}
      <div className="p-card bg-light-blue rounded-card border border-navy/10">
        <div className="flex items-start gap-tight">
          <ShieldCheck size={20} className="text-navy shrink-0 mt-[2px]" />
          <div>
            <p className="text-label text-navy">
              USCG Safety Compliance Cards
            </p>
            <p className="text-[13px] text-dark-text mt-micro leading-relaxed">
              Upload photos of safety equipment on YOUR boat. Required topics
              per USCG 46 CFR are pre-populated based on your vessel type.
              Guests swipe through these cards and acknowledge each one before
              boarding.
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--s-1)', marginBottom: 'var(--s-3)' }}>
        <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)' }}>
          {uploadedCount}/{safetyCards.length} cards have photos
          {requiredWithImage < requiredCount && (
            <span style={{ color: 'var(--color-status-warn)', marginLeft: 'var(--s-2)' }}>
              · {requiredCount - requiredWithImage} required {requiredCount - requiredWithImage === 1 ? 'topic' : 'topics'} still need a photo
            </span>
          )}
        </p>
        {requiredWithImage === requiredCount && requiredCount > 0 && (
          <span
            className="pill pill--ok"
            style={{ fontSize: 'var(--t-mono-xs)' }}
          >
            <Check size={10} strokeWidth={2.5} aria-hidden="true" /> All required
          </span>
        )}
      </div>

      {/* Card list */}
      <div>
        <div className="space-y-tight">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ids}
              strategy={verticalListSortingStrategy}
            >
              {safetyCards.map((card) => (
                <div key={card.id}>
                  <SortableCardRow
                    card={card}
                    isRequired={requiredKeys.has(card.topic_key)}
                    onUpdate={(updates) => updateCard(card.id, updates)}
                    onDelete={() => deleteCard(card.id)}
                    onUploadImage={(file) =>
                      handleUploadImage(card.id, card.topic_key, file)
                    }
                  />
                  {uploadErrors[card.id] && (
                    <p className="text-[11px] text-error-text mt-micro px-standard">
                      {uploadErrors[card.id]}
                    </p>
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {/* Add custom card button */}
          {safetyCards.length < MAX_CARDS && (
            <button
              type="button"
              onClick={addCustomCard}
              className="btn btn--ghost"
              style={{ width: '100%', justifyContent: 'center', gap: 'var(--s-2)', marginTop: 'var(--s-1)' }}
            >
              <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
              Add custom safety card
            </button>
          )}
        </div>
      </div>

      {/* Guest preview mockup */}
      {safetyCards.length > 0 && (safetyCards[0]?.preview || safetyCards[0]?.image_url) && (
        <div className="border-2 border-navy rounded-card overflow-hidden max-w-[300px]">
          <div className="bg-navy px-standard py-tight flex items-center gap-tight">
            <Shield size={14} className="text-white" />
            <span className="text-[10px] text-white font-semibold uppercase tracking-wider">
              Guest preview
            </span>
          </div>
          <div className="p-standard bg-white">
            {(() => {
              const card = safetyCards[0]!;
              return (
                <>
                  <div className="w-full aspect-[4/3] rounded-[8px] overflow-hidden relative mb-tight">
                    <Image
                      src={card.preview || card.image_url!}
                      alt="Safety card preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="text-label text-dark-text">
                    {card.topic_key === "custom"
                      ? card.custom_title || "Custom Topic"
                      : USCG_UNIVERSAL_TOPICS.find((t) => t.key === card.topic_key)?.label ||
                        Object.values(BOAT_SPECIFIC_TOPICS).flat().find((t) => t.key === card.topic_key)?.label ||
                        card.topic_key}
                  </p>
                  <p className="text-[12px] text-grey-text mt-micro">
                    {card.instructions || "No instructions yet"}
                  </p>
                </>
              );
            })()}
            <button className="w-full h-[40px] mt-standard bg-navy text-white text-label rounded-btn">
              I Understand ✓
            </button>
            <p className="text-[10px] text-grey-text text-center mt-micro">
              Swipe 1 of {safetyCards.length}
            </p>
          </div>
        </div>
      )}

      {/* Skip */}
      <button
        type="button"
        onClick={handleSkip}
        className="text-label text-grey-text hover:text-dark-text transition-colors"
      >
        Skip for now — I&apos;ll add photos later
      </button>

      <ContinueButton onClick={handleContinue}>{saveLabel}</ContinueButton>
    </div>
  );
}
