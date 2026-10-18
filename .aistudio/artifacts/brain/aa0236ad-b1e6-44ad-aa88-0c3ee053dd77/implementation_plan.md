# Rediseño del Banner de Perfil para Móvil (Retrato con Familiar en Esquina + Escudo Compacto)

## Contexto y Objetivo
Las vistas de escritorio y tablet (`md:` en adelante, $\ge 768\text{px}$) lucen bien y se mantendrán exactamente igual (retrato del mago a la izquierda, nombre y cita en el centro, y retrato del familiar junto al escudo de la casa a la derecha).

En pantallas de teléfono (`< 768px`), el diseño actual apila los tres bloques verticalmente, provocando que el familiar quede aislado abajo del todo y que el escudo de la casa desaparezca. Este plan rediseña exclusivamente la disposición móvil del banner para que sea compacta, equilibrada y mantenga la identidad visual del mago, su familiar y su casa.

---

## Diseño Propuesto para Teléfonos (`< 768px`)

### 1. Bloque Superior Móvil: Retrato del Mago + Familiar Superpuesto en Esquina + Escudo Compacto
- **Composición horizontal centrada en la parte superior del banner**:
  - **Retrato del Mago**: Mantiene su proporción vertical `3:4` (`w-28`) con su marco dorado/violeta.
  - **Retrato del Familiar Superpuesto en Esquina**:
    - En móvil (`md:hidden`), cuando el mago tiene un familiar vinculado (o está en Modo Edición), el retrato enmarcado del familiar se posiciona **superpuesto en la esquina inferior derecha del retrato del mago** (`-bottom-2.5 -right-5`, `w-14 aspect-[3/4]`, con `z-20`, borde destacado y sombra profunda para separarlo visualmente de la foto del mago).
    - Incluye su etiqueta inferior superpuesta con el nombre del familiar y conserva la misma interactividad: al pulsarlo en modo lectura abre la ficha del familiar, y en modo edición permite vincular/cambiar de familiar.
  - **Escudo de la Casa Compacto junto al Retrato**:
    - En lugar de ocultarse en móvil (`hidden md:flex`), el escudo (`HouseCrest`) se muestra en formato compacto (`w-16 h-20`) justo a la derecha del conjunto de retratos (con un margen suave para dar espacio a la esquina superpuesta del familiar), equilibrando visualmente la cabecera superior antes del título.

### 2. Bloque Inferior Móvil: Nombre del Mago y Cita / Concepto
- Debajo del bloque visual de retratos y escudo se sitúa el **Nombre del Mago** y su **Concepto / Cita** centrados, con un espaciado más limpio (`gap-4` en móvil en lugar de `gap-6`) para que el banner completo quepa cómodamente en la pantalla del teléfono sin empujar el menú de pestañas hacia abajo.
- En **Modo Edición Rápida**, los controles de foto (`Cover/Contain`, quitar foto y desvincular familiar) se organizan en una fila compacta bajo los retratos para evitar solapamientos con la miniatura en esquina.

### 3. Preservación Total de Tablet y Web (`md:` en adelante)
- En resoluciones `md:` ($\ge 768\text{px}$), la insignia superpuesta móvil y el escudo móvil se ocultan (`md:hidden`), y se muestra exactamente la estructura horizontal de tres columnas actual:
  1. Retrato del mago a la izquierda.
  2. Nombre y concepto alineados a la izquierda en el bloque central.
  3. Retrato completo del familiar (`w-28 aspect-[3/4]`) a la izquierda del escudo de la casa (`w-20 h-24`) en el extremo derecho.

---

## Archivos a Modificar
- **`src/components/CharacterDetail.tsx`**:
  - Actualizar la sección `Dynamic Profile Cover Banner` para incorporar la composición móvil en esquina + escudo compacto (`flex md:hidden`) en el bloque superior del avatar, y ocultar en móvil (`hidden md:flex`) el bloque derecho duplicado para que solo actúe en tablet y escritorio.
