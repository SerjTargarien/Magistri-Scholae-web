/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's "galeria" tab (R3.4).
import React from "react";
import { Image as ImageIcon, Trash, Upload } from "lucide-react";
import { imageSrc } from "../../remote/assets";

import type { FamiliarContext } from "./useFamiliarDetail";
import { ListCounter } from "../LimitHint";

export function FamiliarGalleryTab({ ctx }: { ctx: FamiliarContext }) {
  const {
    gallery, t, setLightboxImage, galleryError, handleAddGalleryImage, handleDeleteGalleryImage,
    canAddGalleryImage, canDeleteGalleryImage, isQuickEditing,
  } = ctx;
  return (
        <div className="space-y-6 animate-fade-in">
          {/* Gallery upload header: in edit mode, as on the character sheet */}
          {isQuickEditing && canAddGalleryImage && (
          <div
            className={`glass-panel p-5 sm:p-6 rounded-2xl border border-amber-500/25`}
          >
            <h2 className="font-magic text-sm uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {t.uploadGallery}
            </h2>
            <ListCounter id="familiar-gallery-count" kind="familiar" path="galleryImages" count={gallery.length} word={t.limitImages} fullWord={t.limitReached} />

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{t.chooseImage}</span>
                <input
                  id="input-familiar-gallery-picker"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddGalleryImage}
                />
              </label>

              {/* The "add from web address" input is hidden until it downloads and uploads the image (R3.4). */}
            </div>

            {galleryError && (
              <div className="mt-2 text-xs text-rose-400 font-mono">{galleryError}</div>
            )}
          </div>
          )}

          {/* Gallery grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.length === 0 ? (
              <div className="col-span-full glass-panel p-12 text-center text-neutral-500 font-serif italic text-xs rounded-2xl border border-neutral-800">
                {t.labelGalleryEmpty}
              </div>
            ) : (
              gallery.map((entry, idx) => (
                <div
                  key={entry.id}
                  id={`familiar-gallery-item-${idx}`}
                  onClick={() => setLightboxImage(imageSrc(entry.value))}
                  className="relative aspect-square rounded-xl overflow-hidden group bg-neutral-950 border border-neutral-800 shadow-lg cursor-pointer"
                >
                  <img
                    src={imageSrc(entry.value)}
                    alt={`Recuerdo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Tap to enlarge; in edit mode the delete button is always visible (phones have no hover). */}
                  {isQuickEditing && canDeleteGalleryImage(entry.id) && (
                    <button
                      type="button"
                      id={`btn-familiar-del-gal-pic-${idx}`}
                      onClick={(e) => { e.stopPropagation(); handleDeleteGalleryImage(entry.id); }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/90 border border-rose-500/30 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer shadow"
                      title={t.delete}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
  );
}
