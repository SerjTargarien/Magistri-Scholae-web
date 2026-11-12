/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's state and handlers (R3.4). The sheet is read from the
// SheetStore (what the viewer sees) and every change is a single-path edit:
// no whole record or whole list is ever written for an existing familiar.
// Like the character sheet (owner decision, 8 November 2026): one edit mode,
// «Editar» / «Finalizar Edición», each field saved as it is typed.
import React, { useState, useRef } from "react";
import { useAskFirst } from "../ConfirmDialog";
import { useImageViewer } from "../ImageViewer";
import { imageSrc } from "../../remote/assets";
import { FAMILIAR_ARCHIVE_TEXT, TRANSLATIONS } from "../../localization";
import type { FamiliarDetailProps } from "../../account/screens";
import type { CharacterSheet, FamiliarSheet } from "../../model/sheet";
import { newItemId } from "../../model/sheet";
import { getCroppedImg, compressImage } from "../../utils/imageCompressor";

export function useFamiliarDetail(screenProps: FamiliarDetailProps) {
  const {
    lang,
    store,
    characters,
    onBack,
    onArchive,
    onSelectCharacter,
    onBondMaster,
    onUploadImage,
    onShowToast,
  } = screenProps;
  const t = TRANSLATIONS[lang];
  // Removing anything from a saved sheet asks first (product-design.md, Confirmations).
  const asking = useAskFirst();
  const archiveText = FAMILIAR_ARCHIVE_TEXT[lang];
  const familiar = store.fields as FamiliarSheet;
  const familiarId = store.sheet.id;
  const { collectionPaths, bondWritable } = store.sheet.capabilities;

  // What this viewer may change: a viewer without writable paths gets no editing controls.
  const canEditName = store.allowed("nombre");
  const canEditSpecies = store.allowed("especie");
  const canEditDescription = store.allowed("descripcion");
  const canEditImage = store.allowed("imagen");
  const canEditImageFit = store.allowed("imageFit");
  const canEditProfile = canEditName || canEditSpecies || canEditDescription || canEditImage || canEditImageFit;
  const canAddNote = collectionPaths.includes("notasList");
  const canEditNote = (id: string) => store.allowed(`notasList/${id}/titulo`) || store.allowed(`notasList/${id}/contenido`);
  const canDeleteNote = (id: string) => store.allowed(`notasList/${id}`);
  const canAddGalleryImage = collectionPaths.includes("galleryImages");
  const canDeleteGalleryImage = (id: string) => store.allowed(`galleryImages/${id}`);
  const canBond = bondWritable;

  // Hidden lists are shown as empty. Journal entries newest first, as the old
  // app stored them; gallery entries whose image is not uploaded yet are skipped.
  const notes = [...(familiar.notasList ?? [])].sort((a, b) => (b.fecha ?? 0) - (a.fecha ?? 0));
  const gallery = (familiar.galleryImages ?? []).filter((entry) => !!entry.value);

  // Tabs: perfil, notas, galeria
  const [activeTab, setActiveTab] = useState<"perfil" | "notas" | "galeria">("perfil");

  // Edit mode, as on the character sheet: fields save as they are typed.
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const edit = (path: string, value: unknown) => store.edit(path, value);
  const setImageFit = (fit: "cover" | "contain") => edit("imageFit", fit);
  const removeImage = () => asking.ask(t.confirmRemovePortrait, () => edit("imagen", ""), t.remove);

  // Notes state
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // The image viewer (portrait and gallery) and the gallery's upload error
  const viewer = useImageViewer();
  const sheetName = familiar.nombre || t.noName;
  const openGallery = (idx: number) => viewer.open(gallery.map((entry) => imageSrc(entry.value)), idx, sheetName);
  const openPortrait = () => { if (familiar.imagen) viewer.open([imageSrc(familiar.imagen)], 0, sheetName, true); };
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Avatar cropping state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Archive modal state (the GM's archive replaces delete)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSelectMasterOpen, setIsSelectMasterOpen] = useState(false);

  // The bonded character, when the viewer can see it.
  const linkedMasterProjection = store.sheet.bondId
    ? characters.find((c) => c.id === store.sheet.bondId)
    : undefined;
  const linkedMaster = linkedMasterProjection
    ? { id: linkedMasterProjection.id, fields: linkedMasterProjection.fields as CharacterSheet }
    : undefined;
  const isBondedTo = (characterId: string) => store.sheet.bondId === characterId;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawBase64 = event.target?.result as string;
        setCropImageSrc(rawBase64);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file for avatar crop:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    let croppedBase64: string;
    try {
      croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
    } catch (err) {
      console.error("Cropping error:", err);
      return;
    }
    try {
      await onUploadImage("imagen", croppedBase64);
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err) {
      console.error("Familiar image upload error:", err);
      onShowToast("error", t.imageUploadError);
    }
  };

  // Notes management
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    // An entry without a title stores none; the sheet shows one from its date (model/journal.ts).
    const titulo = newNoteTitle.trim();
    const problems = store.edit(`notasList/${newItemId()}`, {
      ...(titulo ? { titulo } : {}),
      contenido: newNoteContent.trim(),
      fecha: Date.now(),
    });
    if (problems.length) {
      onShowToast("error", t.validationErrorGeneric);
      return;
    }
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleSaveEditedNote = async (noteId: string) => {
    const note = (familiar.notasList ?? []).find((n) => n.id === noteId);
    if (!note) {
      setEditingNoteId(null);
      return;
    }
    // Emptying the title brings back the generated one; an entry needs a title or a text.
    const titulo = editingNoteTitle.trim();
    const contenido = editingNoteContent.trim();
    if (!titulo && !contenido) return;
    const problems = [
      ...(titulo !== (note.titulo ?? "") ? store.edit(`notasList/${noteId}/titulo`, titulo) : []),
      ...(contenido !== (note.contenido ?? "") ? store.edit(`notasList/${noteId}/contenido`, contenido) : []),
    ];
    if (problems.length) {
      onShowToast("error", t.validationErrorGeneric);
      return;
    }
    setEditingNoteId(null);
  };

  const handleDeleteNote = (noteId: string) =>
    asking.ask(t.confirmDeleteNote, () => store.edit(`notasList/${noteId}`, null));

  // Gallery management
  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(null);
    let dataUrl: string;
    try {
      dataUrl = await compressImage(file, 1600, 1600, 0.75);
    } catch (err) {
      console.error("Gallery compress error:", err);
      setGalleryError(t.imageUploadError);
      e.target.value = "";
      return;
    }
    e.target.value = "";
    const id = newItemId();
    if (store.edit(`galleryImages/${id}`, { value: "" }).length) {
      setGalleryError(t.imageUploadError);
      return;
    }
    try {
      await onUploadImage(`galleryImages/${id}/value`, dataUrl);
    } catch (err) {
      console.error("Gallery upload error:", err);
      setGalleryError(t.imageUploadError);
      // Do not leave an empty entry behind.
      store.edit(`galleryImages/${id}`, null);
    }
  };

  const handleDeleteGalleryImage = (entryId: string) =>
    asking.ask(t.confirmDeleteGalleryImage, () => store.edit(`galleryImages/${entryId}`, null));

  const handleBondMaster = async (characterId: string | null) => {
    try {
      await onBondMaster(characterId);
    } catch (err) {
      console.error("Bond error:", err);
      onShowToast("error", archiveText.bondError);
    }
  };

  return {
    lang,
    store,
    familiar,
    familiarId,
    notes,
    gallery,
    characters,
    onBack,
    onArchive,
    onSelectCharacter,
    onShowToast,
    t,
    archiveText,
    asking,
    canEditName,
    canEditSpecies,
    canEditDescription,
    canEditImage,
    canEditImageFit,
    canEditProfile,
    canAddNote,
    canEditNote,
    canDeleteNote,
    canAddGalleryImage,
    canDeleteGalleryImage,
    canBond,
    activeTab,
    setActiveTab,
    isQuickEditing,
    setIsQuickEditing,
    edit,
    setImageFit,
    removeImage,
    newNoteTitle,
    setNewNoteTitle,
    newNoteContent,
    setNewNoteContent,
    editingNoteId,
    setEditingNoteId,
    editingNoteTitle,
    setEditingNoteTitle,
    editingNoteContent,
    setEditingNoteContent,
    viewer,
    openGallery,
    openPortrait,
    galleryError,
    setGalleryError,
    avatarInputRef,
    cropImageSrc,
    setCropImageSrc,
    isCropperOpen,
    setIsCropperOpen,
    crop,
    setCrop,
    zoom,
    setZoom,
    croppedAreaPixels,
    setCroppedAreaPixels,
    isDeleteOpen,
    setIsDeleteOpen,
    isSelectMasterOpen,
    setIsSelectMasterOpen,
    linkedMaster,
    isBondedTo,
    handleAvatarChange,
    handleConfirmCrop,
    handleAddNote,
    handleSaveEditedNote,
    handleDeleteNote,
    handleAddGalleryImage,
    handleDeleteGalleryImage,
    handleBondMaster,
  };
}

export type FamiliarContext = ReturnType<typeof useFamiliarDetail>;
