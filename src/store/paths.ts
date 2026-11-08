// Reading and writing a value by path ("habilidades/<id>/valor") in a sheet's
// fields. List entries are addressed by their permanent ID, never by position.

export function pathValue(data: any, path: string): any {
  return path.split("/").reduce((value, part) => Array.isArray(value) ? value.find(item => item.id === part) : value?.[part], data);
}

/** A copy of `data` with the value at `path` replaced; `null` removes a list entry. */
export function setPath(data: any, path: string, value: unknown): any {
  const result = structuredClone(data ?? {});
  const parts = path.split("/");
  let target = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (Array.isArray(target)) target = target.find(item => item.id === key);
    else target = target[key] ??= {};
    if (!target) return result;
  }
  const last = parts.at(-1)!;
  if (Array.isArray(target)) {
    const index = target.findIndex(item => item.id === last);
    if (value === null) { if (index >= 0) target.splice(index, 1); }
    else if (index < 0) target.push({ id: last, ...(value as object) });
    else target[index] = { id: last, ...(value as object) };
  } else target[last] = structuredClone(value);
  return result;
}
