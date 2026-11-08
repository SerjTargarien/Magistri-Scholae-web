/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The familiar sheet's state and handlers, moved verbatim out of
// FamiliarDetail.tsx (R3.4) so each tab can live in its own file.
import React, { useState, useRef } from "react";
import { Familiar, Character, VisualStyle, JournalNote } from "../../types";
import { Language, TRANSLATIONS } from "../../localization";
import { storage } from "../../storage";
import { referencesCharacter } from "../../storage/backup";
import { FiligreeCorner, CompassStarDivider } from "../AcademyOrnaments";
import { HouseCrest } from "../HouseCrest";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/imageCompressor";
import {
  ArrowLeft,
  Edit,
  Trash2,
  PawPrint,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash,
  X,
  Maximize2,
  Check,
  Upload,
  User,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
} from "lucide-react";

import type { FamiliarDetailProps } from "../FamiliarDetail";

export function useFamiliarDetail(screenProps: FamiliarDetailProps) {
  const {
  lang,
  visualStyle = "academy",
  familiar,
  characters,
  onBack,
  onEditInEditor,
  onDelete,
  onUpdateFamiliar,
  onSelectCharacter,
  onBondMaster,
  onShowToast,
  } = screenProps;
  const t = TRANSLATIONS[lang];
  const isAcademy = visualStyle === "academy";

  // Tabs: perfil, notas, galeria
  const [activeTab, setActiveTab] = useState<"perfil" | "notas" | "galeria">("perfil");

  // Quick edit mode
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(familiar.nombre);
  const [editEspecie, setEditEspecie] = useState(familiar.especie);
  const [editDescripcion, setEditDescripcion] = useState(familiar.descripcion || "");
  const [editImageFit, setEditImageFit] = useState<"cover" | "contain">(familiar.imageFit || "cover");

  // Notes state
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Gallery state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Avatar cropping state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSelectMasterOpen, setIsSelectMasterOpen] = useState(false);

  // Find linked character
  const linkedMaster = familiar.studentId
    ? characters.find((c) => referencesCharacter(familiar.studentId, c.id!))
    : undefined;

  // Auto-save helper
  const saveFamiliarToDB = async (updated: Familiar) => {
    try {
      updated.updatedAt = Date.now();
      const saved = await storage.familiars.save(updated);
      onUpdateFamiliar(saved);
    } catch (err) {
      console.error("Failed to save familiar to IndexedDB:", err);
    }
  };

  const handleSaveQuickEdit = async () => {
    const updated: Familiar = {
      ...familiar,
      nombre: editNombre.trim() || familiar.nombre,
      especie: editEspecie.trim() || familiar.especie,
      descripcion: editDescripcion.trim(),
      imageFit: editImageFit,
    };
    await saveFamiliarToDB(updated);
    setIsQuickEditing(false);
    if (onShowToast) {
      onShowToast("success", t.familiarSavedInlineToast);
    }
  };

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
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const updated: Familiar = {
        ...familiar,
        imagen: croppedBase64,
      };
      await saveFamiliarToDB(updated);
      setIsCropperOpen(false);
      setCropImageSrc(null);
    } catch (err) {
      console.error("Cropping error:", err);
    }
  };

  // Notes management
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    const newNote: JournalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titulo: newNoteTitle.trim() || t.noName,
      contenido: newNoteContent.trim(),
      fecha: Date.now(),
    };

    const currentNotes = familiar.notasList || [];
    const updated: Familiar = {
      ...familiar,
      notasList: [newNote, ...currentNotes],
    };
    await saveFamiliarToDB(updated);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleSaveEditedNote = async (noteId: string) => {
    const currentNotes = familiar.notasList || [];
    const updatedNotes = currentNotes.map((n) =>
      n.id === noteId
        ? { ...n, titulo: editingNoteTitle.trim() || n.titulo, contenido: editingNoteContent.trim() }
        : n
    );
    const updated: Familiar = { ...familiar, notasList: updatedNotes };
    await saveFamiliarToDB(updated);
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    const currentNotes = familiar.notasList || [];
    const updated: Familiar = {
      ...familiar,
      notasList: currentNotes.filter((n) => n.id !== noteId),
    };
    await saveFamiliarToDB(updated);
  };

  // Gallery management
  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(null);

    if (file.size > 2.5 * 1024 * 1024) {
      setGalleryError(t.imageTooLarge);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const currentGallery = familiar.galleryImages || [];
        const updated: Familiar = {
          ...familiar,
          galleryImages: [...currentGallery, base64],
        };
        await saveFamiliarToDB(updated);
      };
      reader.readAsDataURL(file);
    } catch {
      setGalleryError(t.imageUploadError);
    } finally {
      e.target.value = "";
    }
  };

  const handleAddUrlImage = async () => {
    if (!pastedUrl.trim()) return;
    setGalleryError(null);
    const currentGallery = familiar.galleryImages || [];
    const updated: Familiar = {
      ...familiar,
      galleryImages: [...currentGallery, pastedUrl.trim()],
    };
    await saveFamiliarToDB(updated);
    setPastedUrl("");
  };

  const handleDeleteGalleryImage = async (idx: number) => {
    const currentGallery = familiar.galleryImages || [];
    const updated: Familiar = {
      ...familiar,
      galleryImages: currentGallery.filter((_, i) => i !== idx),
    };
    await saveFamiliarToDB(updated);
  };

  return {
    lang,
    visualStyle,
    familiar,
    characters,
    onBack,
    onEditInEditor,
    onDelete,
    onUpdateFamiliar,
    onSelectCharacter,
    onBondMaster,
    onShowToast,
    t,
    isAcademy,
    activeTab,
    setActiveTab,
    isQuickEditing,
    setIsQuickEditing,
    editNombre,
    setEditNombre,
    editEspecie,
    setEditEspecie,
    editDescripcion,
    setEditDescripcion,
    editImageFit,
    setEditImageFit,
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
    lightboxImage,
    setLightboxImage,
    galleryError,
    setGalleryError,
    pastedUrl,
    setPastedUrl,
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
    saveFamiliarToDB,
    handleSaveQuickEdit,
    handleAvatarChange,
    handleConfirmCrop,
    handleAddNote,
    handleSaveEditedNote,
    handleDeleteNote,
    handleAddGalleryImage,
    handleAddUrlImage,
    handleDeleteGalleryImage,
  };
}

export type FamiliarContext = ReturnType<typeof useFamiliarDetail>;
