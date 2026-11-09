/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The portrait crop dialog, the same on the creation form, the character sheet and
// the familiar sheet: the image in a 3:4 frame, a zoom slider, «Cancelar» and «Confirmar».
import React from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Check, X } from "lucide-react";
import { Slider } from "./Slider";

export interface CropDialogTexts {
  cropHeader: string;
  cropZoom: string;
  cropConfirm: string;
  cancel: string;
}

export function CropDialog({ t, image, crop, zoom, onCropChange, onZoomChange, onCropComplete, onCancel, onConfirm }: {
  t: CropDialogTexts;
  image: string;
  crop: Point;
  zoom: number;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (area: Area, pixels: Area) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" id="crop-avatar-modal">
      <div className="bg-neutral-900 border border-violet-500/25 rounded-2xl w-full max-w-md p-6 flex flex-col space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h4 className="font-magic text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>📐</span> {t.cropHeader}
          </h4>
          <button
            type="button"
            aria-label={t.cancel}
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-lg cursor-pointer max-w-max bg-transparent border-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative w-full aspect-[3/4] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 select-none">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={onCropChange}
            onCropComplete={onCropComplete}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span>🔍 {t.cropZoom}</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <Slider id="crop-zoom" label={t.cropZoom} min={1} max={3} step={0.05} value={zoom} onChange={onZoomChange} />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            id="btn-crop-confirm"
            onClick={onConfirm}
            className="w-full py-2.5 bg-violet-900 hover:bg-violet-800 border border-violet-600 text-violet-100 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {t.cropConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
