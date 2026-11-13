/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The sheet's "institucion" tab («Institución», owner, 13 November 2026), second after Perfil:
// the character's school and house, side by side on wide screens, one above the other on a phone.
import React from "react";

import type { SheetContext } from "./useCharacterSheet";
import { HousePanel } from "./HousePanel";
import { SchoolPanel } from "./SchoolPanel";

export function InstitutionTab({ ctx }: { ctx: SheetContext }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch animate-fade-in" id="detail-tab-institucion">
      <SchoolPanel ctx={ctx} />
      <HousePanel ctx={ctx} />
    </div>
  );
}
