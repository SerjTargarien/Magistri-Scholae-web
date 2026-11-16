// Where an image's bytes come from (R3.3): the server's protected asset route,
// or, in demo builds, the in-browser mock server. R3.4's image helper grows
// from this, adding images picked on the device before they are uploaded.
let resolve = (id: string) => `/api/v1/assets/${encodeURIComponent(id)}`;

export const assetUrl = (id: string) => resolve(id);
export function setAssetResolver(resolver: (id: string) => string) { resolve = resolver; }

/** What an <img> shows for an image field: an uploaded asset ID, or a picture just picked on this device (data URL). */
export const imageSrc = (value: string | null | undefined) => (!value ? "" : value.startsWith("data:") ? value : assetUrl(value));

// The players' view (7a): the captured portrait, by the screen's link or, in the app, by the
// campaign for players the Máster lets follow it. Demo builds draw it from the mock server.
let viewPhoto = (token: string, revision: number) => `/api/v1/view/${encodeURIComponent(token)}/photo?r=${revision}`;
let followPhoto = (campaignId: string, revision: number) => `/api/v1/campaigns/${encodeURIComponent(campaignId)}/view/photo?r=${revision}`;
export const viewPhotoUrl = (token: string, revision: number) => viewPhoto(token, revision);
export const followPhotoUrl = (campaignId: string, revision: number) => followPhoto(campaignId, revision);
export function setViewPhotoResolvers(byLink: typeof viewPhoto, byCampaign: typeof followPhoto) { viewPhoto = byLink; followPhoto = byCampaign; }
