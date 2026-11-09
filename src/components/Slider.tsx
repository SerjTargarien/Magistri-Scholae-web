/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A slider for a continuous value (the crop dialogs' zoom). The controls rule allows
// one only fully restyled (product-design.md, Controls): track and thumb are drawn
// by the app's CSS (`.ms-slider` in index.css), the touch area is 40 px tall, and
// the filled part of the track shows the value.
import React from "react";

export function Slider({ id, label, value, min, max, step, onChange }: {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <input
      id={id}
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="ms-slider"
      style={{ "--fill": fill } as React.CSSProperties}
    />
  );
}
