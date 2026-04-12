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
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueButton } from "@/components/ui/ContinueButton";
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

  const displayEmoji = topicMeta?.emoji || "📋";

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
      style={style}
      className={cn(
        "border rounded-card bg-white overflow-hidden",
        isDragging ? "shadow-lg opacity-80 border-navy" : "border-border",
        !card.image_url && !card.preview && "border-dashed border-warning-text/30"
      )}
    >
      <div className="flex items-start gap-standard p-standard">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-[2px] cursor-grab text-grey-text touch-none shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        {/* Image preview / upload zone */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-[80px] h-[60px] rounded-[8px] overflow-hidden bg-off-white shrink-0 relative group cursor-pointer border border-border hover:border-navy/30 transition-colors"
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
              <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-micro">
              {uploading ? (
                <Loader2 size={16} className="text-navy animate-spin" />
              ) : (
                <>
                  <Upload size={14} className="text-grey-text" />
                  <span className="text-[9px] text-grey-text">Upload</span>
                </>
              )}
            </div>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Topic label + instructions */}
        <div className="flex-1 space-y-tight min-w-0">
          <div className="flex items-center gap-micro">
            <span className="text-[14px]">{displayEmoji}</span>
            {card.topic_key === "custom" ? (
              <input
                value={card.custom_title || ""}
                onChange={(e) => onUpdate({ custom_title: e.target.value })}
                placeholder="Custom topic name"
                className="flex-1 h-[28px] px-tight border border-border rounded-input text-label text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
              />
            ) : (
              <span className="text-label text-dark-text truncate">
                {displayLabel}
              </span>
            )}
            {isRequired && (
              <span className="text-[9px] text-navy bg-light-blue px-[6px] py-[1px] rounded-pill font-medium shrink-0">
                USCG
              </span>
            )}
          </div>
          <textarea
            value={card.instructions}
            onChange={(e) => onUpdate({ instructions: e.target.value })}
            placeholder="Where is this located on YOUR boat? (e.g. Port-side bench seat, under helm console)"
            rows={2}
            className="w-full p-tight border border-border rounded-input text-[13px] text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none"
          />
        </div>

        {/* Delete */}
        <button
          onClick={() => {
            if (isRequired) {
              // Don't delete USCG required cards, just clear the image
              onUpdate({ image_url: null, preview: "", file: null });
            } else {
              onDelete();
            }
          }}
          className={cn(
            "transition-colors shrink-0 mt-[2px]",
            isRequired
              ? "text-grey-text/40 hover:text-warning-text"
              : "text-grey-text hover:text-error-text"
          )}
          title={isRequired ? "Clear image (required topic cannot be removed)" : "Remove card"}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Missing image warning for required cards */}
      {isRequired && !card.image_url && !card.preview && (
        <div className="px-standard pb-tight -mt-tight">
          <p className="text-[10px] text-warning-text flex items-center gap-micro">
            <AlertTriangle size={10} />
            Photo recommended for USCG compliance
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Safety Cards Builder ───

interface Step7Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step7SafetyCards({ data, onNext }: Step7Props) {
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
      <div className="flex items-center justify-between px-tight">
        <p className="text-caption text-grey-text">
          {uploadedCount}/{safetyCards.length} cards have photos ·{" "}
          {requiredWithImage}/{requiredCount} required topics covered
        </p>
        {requiredWithImage === requiredCount && requiredCount > 0 && (
          <span className="text-[11px] text-success-text font-medium flex items-center gap-micro">
            <Check size={12} /> Compliant
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
                      ⚠️ {uploadErrors[card.id]}
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
              className="w-full py-standard border-2 border-dashed border-border hover:border-navy/40 rounded-card flex items-center justify-center gap-micro text-label text-navy hover:text-mid-blue transition-all"
            >
              <Plus size={16} />
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

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
