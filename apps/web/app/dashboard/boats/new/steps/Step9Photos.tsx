"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { WizardField } from "@/components/ui/WizardField";
import { validateUpload } from "@/lib/security/uploads";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import type { WizardData, WizardAddon, BoatTypeKey } from "../types";

const MAX_PHOTOS = 12;

interface Step9Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
  saving?: boolean;
  template: BoatTemplate | null;
}

export function Step9Photos({ data, onNext, saving, template }: Step9Props) {

  const fileRef = useRef<HTMLInputElement>(null);
  const [boatPhotos, setBoatPhotos] = useState<File[]>(data.boatPhotos);
  const [boatPhotosPreviews, setBoatPhotosPreviews] = useState<string[]>(data.boatPhotosPreviews);
  const [photoError, setPhotoError] = useState("");
  const [addons, setAddons] = useState<WizardAddon[]>(data.addons);
  const [showCustomAddon, setShowCustomAddon] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customEmoji, setCustomEmoji] = useState("🎁");
  const [customPrice, setCustomPrice] = useState("");
  const [customMaxQty, setCustomMaxQty] = useState("10");

  // Photo handling
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotoError("");

    const remaining = MAX_PHOTOS - boatPhotos.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      const result = validateUpload(file);
      if (!result.valid) {
        setPhotoError(result.error ?? "Invalid file");
        return;
      }
    }

    // Create previews
    const newPreviews: string[] = [];
    const newFiles: File[] = [];

    let processed = 0;
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push(file);
        newPreviews.push(reader.result as string);
        processed++;
        if (processed === toAdd.length) {
          setBoatPhotos((prev) => [...prev, ...newFiles]);
          setBoatPhotosPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(index: number) {
    setBoatPhotos((prev) => prev.filter((_, i) => i !== index));
    setBoatPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // Add-on handling
  function addFromSuggestion(suggestion: { name: string; description: string; emoji: string; suggestedPrice: number }) {
    const addon: WizardAddon = {
      id: `addon-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: suggestion.name,
      description: suggestion.description,
      emoji: suggestion.emoji,
      priceCents: suggestion.suggestedPrice,
      maxQuantity: 10,
    };
    setAddons((prev) => [...prev, addon]);
  }

  function addCustomAddon() {
    if (!customName.trim()) return;
    const addon: WizardAddon = {
      id: `addon-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: customName.trim(),
      description: customDesc.trim(),
      emoji: customEmoji,
      priceCents: Math.round(parseFloat(customPrice || "0") * 100),
      maxQuantity: parseInt(customMaxQty) || 10,
    };
    setAddons((prev) => [...prev, addon]);
    setCustomName("");
    setCustomDesc("");
    setCustomEmoji("🎁");
    setCustomPrice("");
    setCustomMaxQty("10");
    setShowCustomAddon(false);
  }

  function removeAddon(id: string) {
    setAddons((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAddonPrice(id: string, dollars: string) {
    setAddons((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, priceCents: Math.round(parseFloat(dollars || "0") * 100) } : a
      )
    );
  }

  function updateAddonQty(id: string, qty: string) {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, maxQuantity: parseInt(qty) || 1 } : a))
    );
  }

  // Already added check
  const addedAddonNames = new Set(addons.map((a) => a.name));

  function handleContinue() {
    onNext({ boatPhotos, boatPhotosPreviews, addons });
  }

  return (
    <div className="space-y-section">
      {/* SECTION 1 — Photos */}
      <div>
        <h3 className="text-h3 text-dark-text">Photos of your boat</h3>
        <p className="text-caption text-grey-text mt-micro">
          Add photos that appear in your guest&apos;s trip page. Clear, well-lit photos convert best.
        </p>

        {/* Photo grid */}
        <div className="mt-standard grid grid-cols-2 md:grid-cols-4 gap-tight">
          {boatPhotosPreviews.map((preview, i) => (
            <div key={i} className="relative w-full aspect-[4/3] rounded-card overflow-hidden border border-border group">
              <Image src={preview} alt={`Boat photo ${i + 1}`} fill className="object-cover" unoptimized />
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-navy text-white text-[10px] font-semibold px-2 py-[2px] rounded-pill">
                  Cover photo
                </span>
              )}
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {boatPhotos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-card border-2 border-dashed border-border hover:border-border-dark transition-colors flex flex-col items-center justify-center gap-micro"
            >
              <Plus size={20} className="text-grey-text" />
              <span className="text-micro text-grey-text">Add photo</span>
            </button>
          )}
        </div>

        {photoError && (
          <p className="text-[12px] text-error-text mt-tight">{photoError}</p>
        )}
        <p className="text-[11px] text-grey-text mt-tight">
          {boatPhotos.length}/{MAX_PHOTOS} photos · JPEG, PNG, WebP · Max 5MB each
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Tips */}
        <div className="mt-standard p-standard bg-light-blue rounded-chip">
          <p className="text-[12px] text-navy font-semibold">📸 Photo tips that work best:</p>
          <div className="mt-micro text-[12px] text-dark-text space-y-[2px]">
            <p>✓ Deck and seating area</p>
            <p>✓ Interior/cabin (if applicable)</p>
            <p>✓ Captain at helm</p>
            <p>✓ Guests enjoying the experience</p>
            <p>✓ The view from the boat</p>
            <p className="text-grey-text">✗ Avoid blurry or dark photos</p>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Add-ons */}
      <div>
        <h3 className="text-h3 text-dark-text">Add-on menu</h3>
        <p className="text-caption text-grey-text mt-micro">
          Items guests can pre-order before arriving. You earn the full amount.
        </p>

        {/* Suggested add-ons */}
        {template && template.suggestedAddons.length > 0 && (
          <div className="mt-standard">
            <p className="text-label text-grey-text mb-tight">Suggested for {template.label}</p>
            <div className="space-y-tight">
              {template.suggestedAddons
                .filter((s) => !addedAddonNames.has(s.name))
                .map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between p-standard border border-border rounded-card"
                  >
                    <div className="flex items-center gap-tight">
                      <span className="text-[20px]">{s.emoji}</span>
                      <div>
                        <p className="text-label text-dark-text">{s.name}</p>
                        <p className="text-[11px] text-grey-text">{s.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addFromSuggestion(s)}
                      className="px-standard py-tight text-label text-navy bg-light-blue rounded-btn hover:bg-navy hover:text-white transition-all shrink-0"
                    >
                      Add to menu
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active add-ons */}
        {addons.length > 0 && (
          <div className="mt-page">
            <p className="text-label text-dark-text mb-tight">Your menu</p>
            <div className="space-y-tight">
              {addons.map((addon) => (
                <div key={addon.id} className="p-standard border border-navy/20 rounded-card bg-light-blue">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-tight">
                      <span className="text-[20px]">{addon.emoji}</span>
                      <div>
                        <p className="text-label text-dark-text">{addon.name}</p>
                        <p className="text-[11px] text-grey-text">{addon.description}</p>
                      </div>
                    </div>
                    <button onClick={() => removeAddon(addon.id)} className="text-grey-text hover:text-error-text">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-page mt-tight">
                    <WizardField label="Price" htmlFor={`price-${addon.id}`}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-text text-body">$</span>
                        <input
                          id={`price-${addon.id}`}
                          type="number"
                          step="0.01"
                          min={0}
                          value={(addon.priceCents / 100).toFixed(2)}
                          onChange={(e) => updateAddonPrice(addon.id, e.target.value)}
                          className="w-[120px] h-[36px] pl-6 pr-standard border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none"
                        />
                      </div>
                    </WizardField>
                    <WizardField label="Max qty" htmlFor={`qty-${addon.id}`}>
                      <input
                        id={`qty-${addon.id}`}
                        type="number"
                        min={1}
                        value={addon.maxQuantity}
                        onChange={(e) => updateAddonQty(addon.id, e.target.value)}
                        className="w-[80px] h-[36px] px-standard border border-border rounded-input text-body text-dark-text focus:border-border-dark focus:outline-none"
                      />
                    </WizardField>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom add-on */}
        {showCustomAddon ? (
          <div className="mt-standard p-standard border border-border rounded-card space-y-standard">
            <div className="flex items-center gap-standard">
              <input
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-[50px] h-[40px] text-center text-[20px] border border-border rounded-input focus:border-border-dark focus:outline-none"
              />
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Add-on name"
                className="flex-1 h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
              />
            </div>
            <input
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Short description"
              className="w-full h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
            />
            <div className="flex gap-standard">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-text text-body">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-[120px] h-[40px] pl-6 pr-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
                />
              </div>
              <input
                type="number"
                min={1}
                value={customMaxQty}
                onChange={(e) => setCustomMaxQty(e.target.value)}
                placeholder="Max qty"
                className="w-[80px] h-[40px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none"
              />
            </div>
            <div className="flex gap-tight">
              <button
                onClick={addCustomAddon}
                disabled={!customName.trim()}
                className="px-page py-tight bg-navy text-white text-label rounded-btn disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => setShowCustomAddon(false)}
                className="px-page py-tight text-label text-grey-text"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomAddon(true)}
            className="mt-standard flex items-center gap-micro text-label text-navy hover:text-mid-blue transition-colors"
          >
            <Plus size={16} /> Add custom item
          </button>
        )}

        {/* Skip option */}
        <button
          type="button"
          onClick={handleContinue}
          className="mt-standard text-label text-grey-text hover:text-dark-text transition-colors"
        >
          Skip for now — I&apos;ll add these later
        </button>
      </div>

      <ContinueButton onClick={handleContinue} loading={saving ?? false}>Save boat profile →</ContinueButton>
    </div>
  );
}
