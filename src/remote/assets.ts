// Where an image's bytes come from (R3.3): the server's protected asset route,
// or, in demo builds, the in-browser mock server. R3.4's image helper grows
// from this, adding images picked on the device before they are uploaded.
let resolve = (id: string) => `/api/v1/assets/${encodeURIComponent(id)}`;

export const assetUrl = (id: string) => resolve(id);
export function setAssetResolver(resolver: (id: string) => string) { resolve = resolver; }

/** What an <img> shows for an image field: an uploaded asset ID, or a picture just picked on this device (data URL). */
export const imageSrc = (value: string | null | undefined) => (!value ? "" : value.startsWith("data:") ? value : assetUrl(value));
