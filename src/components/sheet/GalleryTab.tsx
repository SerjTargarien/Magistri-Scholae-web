/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "galeria" tab, moved verbatim out of CharacterDetail.tsx (R3.4).
import React from "react";
import { imageSrc } from "../../remote/assets";
import { Image as ImageIcon, Plus, Trash, X } from "lucide-react";

import type { SheetContext } from "./useCharacterSheet";
import { ListCounter } from "../LimitHint";

export function GalleryTab({ ctx }: { ctx: SheetContext }) {
  const {
    t, canAdd, canRemove, openGallery, galleryError, setGalleryError, isQuickEditing, galleryImages,
    handleGalleryAdd, removeGalleryImage,
  } = ctx;
  return (
          <div className="glass-panel p-6 rounded-xl border border-violet-500/15 space-y-6 animate-fade-in" id="detail-tab-galeria">

            {/* Top Info with file picker */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-violet-500/10 pb-3">
              <div>
                <h3 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  {t.galeria}
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1 font-mono">{t.galleryInstructions}</p>
                <ListCounter id="gallery-count" kind="character" path="galleryImages" count={galleryImages.length} word={t.limitImages} fullWord={t.limitReached} />
              </div>

              {isQuickEditing && canAdd("galleryImages") && (
                <div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-violet-950 hover:bg-violet-900 border border-violet-500/35 rounded-xl text-xs font-bold transition-all cursor-pointer text-violet-100">
                    <Plus className="w-4 h-4" />
                    {t.uploadGallery}
                    <input
                      id="input-gallery-picker"
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryAdd}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Gallery Error Alert */}
            {galleryError && (
              <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between text-rose-300 text-xs font-mono animate-fade-in" id="gallery-error-banner">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{galleryError}</span>
                </div>
                <button
                  id="btn-close-gallery-err"
                  onClick={() => setGalleryError(null)}
                  className="text-rose-400 hover:text-rose-200 cursor-pointer p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Gallery images GRID / CSS columns Masonry */}
            {galleryImages.length > 0 ? (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4" id="gallery-pics-view">
                {galleryImages.map((pic, idx) => (
                  <div
                    id={`gallery-item-${idx}`}
                    key={pic.id}
                    onClick={() => openGallery(idx)}
                    className="break-inside-avoid bg-neutral-950 border border-violet-500/10 rounded-xl overflow-hidden cursor-pointer shadow hover:border-amber-500/40 hover:-translate-y-0.5 transition-all mb-4 relative group"
                  >
                    <img
                      src={imageSrc(pic.value)}
                      alt={`Relato ${idx}`}
                      className="w-full h-auto object-contain block transition-transform group-hover:scale-[1.02] duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Delete, always visible in edit mode (phones have no hover) */}
                    {isQuickEditing && canRemove("galleryImages", pic.id) && (
                      <button
                        id={`btn-del-gal-pic-${idx}`}
                        onClick={(e) => removeGalleryImage(pic.id, e)}
                        className="absolute top-2 right-2 bg-rose-950/90 border border-rose-500/30 p-1.5 rounded-lg text-rose-300 hover:text-rose-200 transition-colors cursor-pointer shadow"
                        title={t.delete}
                        aria-label={t.delete}
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="absolute bottom-2 left-2 bg-neutral-900/80 px-1.5 py-0.5 text-[9px] font-mono rounded text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-600 font-mono text-[10px] select-none" id="gallery-empty-notif">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30 text-violet-400" />
                {t.labelGalleryEmpty}
              </div>
            )}
          </div>
  );
}
