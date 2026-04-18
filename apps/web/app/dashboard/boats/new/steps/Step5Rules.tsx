"use client";

import { useState } from "react";
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
import { GripVertical, Pencil, Trash2, Plus, X, Check, AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { WizardData, CustomRuleSection } from "../types";

// ─── Variant config ───

type RuleVariant = "rules" | "dos" | "donts" | "custom";

const VARIANT_CONFIG: Record<
  RuleVariant,
  {
    heading: string;
    subheading: string;
    pillClass: string;
    pillLabel: string;
    PillIcon: typeof AlertCircle;
    stripeColor: string;
    addLabel: string;
  }
> = {
  rules: {
    heading: "House Rules",
    subheading: "Non-negotiable vessel rules for every charter.",
    pillClass: "pill pill--err",
    pillLabel: "Required",
    PillIcon: AlertCircle,
    stripeColor: "var(--color-status-err)",
    addLabel: "Add house rule",
  },
  dos: {
    heading: "DOs — What we encourage",
    subheading: "Positive guidance shown to guests.",
    pillClass: "pill pill--ok",
    pillLabel: "Encouraged",
    PillIcon: CheckCircle2,
    stripeColor: "var(--color-status-ok)",
    addLabel: "Add a DO",
  },
  donts: {
    heading: "DON'Ts — What's not allowed",
    subheading: "Prohibited behaviours shown to guests.",
    pillClass: "pill pill--warn",
    pillLabel: "Prohibited",
    PillIcon: TriangleAlert,
    stripeColor: "var(--color-status-warn)",
    addLabel: "Add a DON'T",
  },
  custom: {
    heading: "",
    subheading: "",
    pillClass: "pill pill--ghost",
    pillLabel: "Custom",
    PillIcon: Plus,
    stripeColor: "var(--color-line)",
    addLabel: "Add item",
  },
};

// ─── Sortable item ───

function SortableRuleItem({
  id,
  text,
  onEdit,
  onDelete,
  stripeColor,
}: {
  id: string;
  text: string;
  onEdit: (newText: string) => void;
  onDelete: () => void;
  stripeColor: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  function saveEdit() {
    if (editText.trim()) onEdit(editText.trim());
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        background: "var(--color-paper)",
        border: "1px solid var(--color-line-soft)",
        borderRadius: "var(--r-1)",
        borderLeft: `3px solid ${stripeColor}`,
        minHeight: 44,
        opacity: isDragging ? 0.75 : 1,
        boxShadow: isDragging ? "var(--shadow-float)" : "none",
      }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none flex-shrink-0"
        style={{
          padding: "0 var(--s-2) 0 var(--s-3)",
          color: "var(--color-ink-muted)",
          cursor: "grab",
          opacity: 0.4,
          display: "flex",
          alignItems: "center",
          height: "100%",
          background: "none",
          border: "none",
        }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </button>

      {/* Content */}
      {editing ? (
        <div className="flex-1 flex items-center" style={{ gap: "var(--s-2)", padding: "var(--s-2) var(--s-2) var(--s-2) 0" }}>
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            className="flex-1"
            style={{
              height: 32,
              padding: "0 var(--s-2)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--r-1)",
              fontSize: "var(--t-body-sm)",
              color: "var(--color-ink)",
              background: "var(--color-paper)",
              outline: "none",
            }}
          />
          <button
            onClick={saveEdit}
            style={{ color: "var(--color-status-ok)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            aria-label="Save edit"
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setEditing(false)}
            style={{ color: "var(--color-ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            aria-label="Cancel edit"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <>
          <span
            className="flex-1"
            style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink)", padding: "var(--s-2) 0", lineHeight: 1.45 }}
          >
            {text}
          </span>
          {/* Edit / delete — show on hover via group */}
          <div className="flex items-center flex-shrink-0" style={{ gap: 2, paddingRight: "var(--s-2)", opacity: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <button
              onClick={() => { setEditText(text); setEditing(true); }}
              style={{ color: "var(--color-ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label="Edit rule"
            >
              <Pencil size={13} strokeWidth={1.5} />
            </button>
            <button
              onClick={onDelete}
              style={{ color: "var(--color-ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label="Delete rule"
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Draggable list section ───

function DraggableList({
  title,
  items,
  setItems,
  variant,
}: {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
  variant: RuleVariant;
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");

  const cfg = VARIANT_CONFIG[variant];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map((_, i) => `item-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  }

  function editItem(index: number, newText: string) {
    const updated = [...items];
    updated[index] = newText;
    setItems(updated);
  }

  function deleteItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addItem() {
    if (newText.trim()) {
      setItems([...items, newText.trim()]);
      setNewText("");
      setAdding(false);
    }
  }

  return (
    <div
      className="tile"
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* Section header */}
      <div
        style={{
          padding: "var(--s-4) var(--s-5)",
          borderBottom: "1px solid var(--color-line-soft)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
        }}
      >
        <div style={{ flex: 1 }}>
          {(cfg.heading || title) && (
            <h3
              className="font-display"
              style={{
                fontSize: "var(--t-body-lg)",
                fontWeight: 500,
                color: "var(--color-ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {cfg.heading || title}
            </h3>
          )}
          {cfg.subheading && (
            <p
              className="mono"
              style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", marginTop: 2 }}
            >
              {cfg.subheading}
            </p>
          )}
        </div>
        <span className={cfg.pillClass} style={{ fontSize: "var(--t-mono-xs)", flexShrink: 0 }}>
          <cfg.PillIcon size={10} strokeWidth={2} aria-hidden="true" />
          {cfg.pillLabel}
        </span>
      </div>

      {/* Rule rows */}
      <div style={{ padding: "var(--s-2) var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item, i) => (
              <SortableRuleItem
                key={ids[i]}
                id={ids[i]!}
                text={item}
                onEdit={(text) => editItem(i, text)}
                onDelete={() => deleteItem(i)}
                stripeColor={cfg.stripeColor}
              />
            ))}
          </SortableContext>
        </DndContext>

        {adding ? (
          <div className="flex items-center" style={{ gap: "var(--s-2)", marginTop: "var(--s-1)" }}>
            <input
              autoFocus
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder={cfg.addLabel}
              style={{
                flex: 1,
                height: 40,
                padding: "0 var(--s-3)",
                border: "1px solid var(--color-line)",
                borderLeft: `3px solid ${cfg.stripeColor}`,
                borderRadius: "var(--r-1)",
                fontSize: "var(--t-body-sm)",
                color: "var(--color-ink)",
                background: "var(--color-paper)",
                outline: "none",
              }}
            />
            <button
              onClick={addItem}
              style={{ color: "var(--color-status-ok)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label="Confirm add"
            >
              <Check size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => { setAdding(false); setNewText(""); }}
              style={{ color: "var(--color-ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label="Cancel"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Add row footer */}
      <div style={{ padding: "var(--s-3) var(--s-5)", borderTop: "1px dashed var(--color-line-soft)" }}>
        <button
          onClick={() => setAdding(true)}
          className="btn btn--ghost btn--sm"
          style={{ gap: "var(--s-1)", color: "var(--color-ink-muted)", fontSize: "var(--t-body-sm)" }}
        >
          <Plus size={14} strokeWidth={2} aria-hidden="true" />
          {cfg.addLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 ───

interface Step5Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  saveLabel?: string;
}

export function Step5Rules({ data, onNext, saveLabel }: Step5Props) {
  const [standardRules, setStandardRules] = useState(data.standardRules);
  const [customDos, setCustomDos] = useState(data.customDos);
  const [customDonts, setCustomDonts] = useState(data.customDonts);
  const [customRuleSections, setCustomRuleSections] = useState<CustomRuleSection[]>(
    data.customRuleSections
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionType, setSectionType] = useState<"bullet" | "numbered" | "check">("bullet");

  function addSection() {
    if (!sectionTitle.trim()) return;
    const section: CustomRuleSection = {
      id: `section-${Date.now()}`,
      title: sectionTitle.trim(),
      items: [],
      type: sectionType,
    };
    setCustomRuleSections((prev) => [...prev, section]);
    setSectionTitle("");
    setShowAddSection(false);
  }

  function updateSectionItems(id: string, items: string[]) {
    setCustomRuleSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, items } : s))
    );
  }

  function deleteSection(id: string) {
    setCustomRuleSections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleContinue() {
    onNext({ standardRules, customDos, customDonts, customRuleSections });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-6)" }}>
      {/* House Rules */}
      <DraggableList
        title="House rules"
        items={standardRules}
        setItems={setStandardRules}
        variant="rules"
      />

      {/* DOs */}
      <DraggableList
        title=""
        items={customDos}
        setItems={setCustomDos}
        variant="dos"
      />

      {/* DON'Ts */}
      <DraggableList
        title=""
        items={customDonts}
        setItems={setCustomDonts}
        variant="donts"
      />

      {/* Custom sections */}
      <div>
        <div style={{ marginBottom: "var(--s-3)" }}>
          <h3
            className="font-display"
            style={{ fontSize: "var(--t-body-lg)", fontWeight: 500, color: "var(--color-ink)" }}
          >
            Custom sections
          </h3>
          <p
            className="mono"
            style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", marginTop: 2 }}
          >
            Create your own sections with custom titles and items
          </p>
        </div>

        {customRuleSections.map((section) => (
          <div
            key={section.id}
            className="tile"
            style={{ padding: 0, overflow: "hidden", marginBottom: "var(--s-4)" }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: "var(--s-3) var(--s-4)", borderBottom: "1px solid var(--color-line-soft)" }}
            >
              <div className="flex items-center" style={{ gap: "var(--s-2)" }}>
                <h4
                  className="font-display"
                  style={{ fontSize: "var(--t-body-sm)", fontWeight: 500, color: "var(--color-ink)" }}
                >
                  {section.title}
                </h4>
                <span
                  className="pill pill--ghost"
                  style={{ fontSize: "var(--t-mono-xs)" }}
                >
                  {section.type}
                </span>
              </div>
              <button
                onClick={() => deleteSection(section.id)}
                style={{ color: "var(--color-ink-muted)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                aria-label="Delete section"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div style={{ padding: "var(--s-2) var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
              <DraggableList
                title=""
                items={section.items}
                setItems={(items) => updateSectionItems(section.id, items)}
                variant="custom"
              />
            </div>
          </div>
        ))}

        {showAddSection ? (
          <div
            className="tile"
            style={{ padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
          >
            <input
              autoFocus
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="Section title (e.g. Alcohol policy)"
              style={{
                width: "100%",
                height: 40,
                padding: "0 var(--s-3)",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--r-1)",
                fontSize: "var(--t-body-sm)",
                color: "var(--color-ink)",
                background: "var(--color-paper)",
                outline: "none",
              }}
            />
            <div className="flex" style={{ gap: "var(--s-2)" }}>
              {(["bullet", "numbered", "check"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSectionType(type)}
                  className={cn("btn btn--sm", sectionType === type ? "btn--rust" : "")}
                  style={{ justifyContent: "center" }}
                >
                  {type === "bullet" ? "· Bullet" : type === "numbered" ? "1. Numbered" : "☑ Checklist"}
                </button>
              ))}
            </div>
            <div className="flex" style={{ gap: "var(--s-2)" }}>
              <button
                onClick={addSection}
                disabled={!sectionTitle.trim()}
                className="btn btn--rust btn--sm"
                style={{ justifyContent: "center" }}
              >
                Create section
              </button>
              <button
                onClick={() => { setShowAddSection(false); setSectionTitle(""); }}
                className="btn btn--ghost btn--sm"
                style={{ justifyContent: "center" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="btn btn--ghost btn--sm"
            style={{ gap: "var(--s-1)", color: "var(--color-ink-muted)", fontSize: "var(--t-body-sm)" }}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            Add section
          </button>
        )}
      </div>

      <ContinueButton onClick={handleContinue}>{saveLabel}</ContinueButton>
    </div>
  );
}
