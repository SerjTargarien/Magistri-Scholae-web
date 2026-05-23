/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "es" | "en";

export interface TranslationDict {
  appName: string;
  tagline: string;
  languageName: string;
  searchPlaceholder: string;
  filterAllHouses: string;
  noCharacters: string;
  addCharacter: string;
  settings: string;
  back: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  confirmDelete: string;
  confirmDeleteText: string;
  confirmDeleteCheckbox: string;
  confirmDeleteButton: string;
  confirmDeleteTitle: string;
  about: string;
  installHelp: string;
  installHelpText: string;
  storageInfo: string;
  storageInfoText: string;
  languageSelector: string;
  exportBackup: string;
  importBackup: string;
  resetData: string;
  resetDataConfirmPlaceholder: string;
  resetDataConfirmError: string;
  resetSuccess: string;
  importSuccess: string;
  importError: string;
  importReplace: string;
  importAdd: string;
  importMergeRequestTitle: string;
  importMergeRequestText: string;
  validationErrorName: string;
  validationErrorGeneric: string;
  draftDiscardConfirm: string;

  // Tabs
  perfil: string;
  sesion: string;
  habilidades: string;
  hechizos: string;
  notas: string;
  galeria: string;

  // Fields and Labels
  nombre: string;
  jugador: string;
  edad: string;
  casa: string;
  curso: string;
  puestoClase: string;
  concepto: string;
  lema: string;
  escudoText: string;
  complicaciones: string;
  linaje: string;
  puntosDestino: number | string;
  economia: string;
  familiar: string;
  varitaSintonia: string;
  estresFisico: string;
  estresMental: string;
  estresMentalConsecuencia: string;
  estresSocial: string;
  consecuenciasFisicas: string;
  consecuenciasMentales: string;
  consecuenciasSociales: string;
  pxs: string;
  aspectoTemporal: string;
  aspectosPersonales: string;
  addAspecto: string;
  clubes: string;
  equipo: string;
  customFields: string;
  addCustomField: string;
  fieldName: string;
  fieldValue: string;

  // Spells & Potions
  conjuroName: string;
  pocionName: string;
  spellsAndPotions: string;
  specialized: string;
  level: string;
  addSpell: string;
  addPotion: string;

  // Categories
  catFisicas: string;
  catMentales: string;
  catSociales: string;
  catTroncales: string;
  catOptativas: string;

  // Gallery
  uploadAvatar: string;
  uploadGallery: string;
  pasteUrl: string;
  invalidUrl: string;
  galleryInstructions: string;

  // New keys for complete localization
  placeholderNombre: string;
  placeholderJugador: string;
  placeholderPuestoClase: string;
  placeholderConcepto: string;
  placeholderLinaje: string;
  placeholderEconomia: string;
  placeholderComplicaciones: string;
  placeholderAspectoTemporal: string;
  placeholderFamiliar: string;
  placeholderVaritaSintonia: string;
  placeholderConsecuenciaMental: string;
  placeholderConsecuenciaFisica: string;
  placeholderConsecuenciaSocial: string;
  placeholderNuevoAspecto: string;
  placeholderConjuroName: string;
  placeholderPocionName: string;
  placeholderClubes: string;
  placeholderEquipo: string;
  placeholderNotasChronicle: string;

  schoolShield: string;
  secDatosAlumno: string;
  secLinajeDestino: string;
  secFamiliarVarita: string;
  secEstresRango: string;
  secPersonalAspects: string;
  secCustomFields: string;
  labelActual: string;
  labelMaximo: string;
  labelSalud: string;
  labelHerido: string;
  labelSereno: string;
  labelAislado: string;
  labelCordura: string;
  labelLocura: string;
  labelGrado: string;
  labelDificultad: string;
  labelFamiliarEmpty: string;
  labelVaritaEmpty: string;
  labelComplicacionesEmpty: string;
  labelAspectsEmpty: string;
  labelAspectosTemporalesEmpty: string;
  labelConsecuenciasFisicasEmpty: string;
  labelConsecuenciasMentalesEmpty: string;
  labelConsecuenciasSocialesEmpty: string;
  labelSpellsEmpty: string;
  labelPotionsEmpty: string;
  labelGalleryEmpty: string;
  labelOfflineAutoSave: string;
  pwaOfflineStatusSuffix: string;
  pwaStatusLabel: string;
  schoolSealPrefix: string;
  settingsTitleDatabaseTools: string;
  settingsDDBBExplanation: string;
  settingsLanguageExplanation: string;
  settingsCurrentLanguage: string;
  settingsExecutePurge: string;
  settingsConfirmWipeDDBBDescription: string;
  backupDownloadedMsg: string;
  backupErrorExportMsg: string;
  backupErrorOverwriteMsg: string;
  backupErrorMergeMsg: string;
  backupErrorWipeMsg: string;
  backupTotalStudentsInFile: string;
  backupExportedOn: string;
  confirmDeleteSpell: string;
  confirmDeletePotion: string;
  confirmDeleteGalleryImage: string;
  confirmDeleteClub: string;
  confirmDeleteItem: string;
  confirmDeleteNote: string;
  labelQuantity: string;
  addClub: string;
  addItem: string;
  addNote: string;
  emptyClubs: string;
  emptyInventory: string;
  emptyNotes: string;
  placeholderNoteTitle: string;
  placeholderNoteContent: string;
  labelNotesChronicleTitle: string;
  noConceptDefined: string;
  filterByHouse: string;
  studentPrefix: string;
  noName: string;
  subirArchivoLocalMax: string;
  imageTooLarge: string;
  imageUploadError: string;
  errorStoringStudent: string;
  loadingMessage: string;
  lblAvatarFit: string;
  optAvatarCover: string;
  optAvatarContain: string;
  cropHeader: string;
  cropConfirm: string;
  cropZoom: string;
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  es: {
    appName: "Magistri Scholae",
    tagline: "Editor de fichas de Personaje",
    languageName: "Español",
    searchPlaceholder: "Buscar por nombre, jugador o concepto...",
    filterAllHouses: "Todas las Casas",
    noCharacters: "No se encontraron alumnos. ¡Crea el primero!",
    addCharacter: "Añadir Alumno",
    settings: "Ajustes",
    back: "Volver",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar a este alumno?",
    confirmDeleteText: "Esta acción es irreversible y se perderán todos sus datos y fotos.",
    confirmDeleteCheckbox: "Entiendo que esta acción es permanente e irreversible",
    confirmDeleteButton: "Confirmar eliminación definitiva",
    confirmDeleteTitle: "Confirmar eliminación",
    about: "Acerca de",
    installHelp: "Instalación PWA",
    installHelpText: "Esta aplicación se ejecuta localmente y sin conexión. En tu dispositivo móvil o de escritorio, selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio' en el menú de tu navegador para llevar la experiencia mágica a pantalla completa.",
    storageInfo: "Información de Almacenamiento",
    storageInfoText: "Tus datos se guardan de forma permanente e individual en la base de datos IndexedDB de tu propio navegador. El almacenamiento es local y privado.",
    languageSelector: "Seleccionar Idioma",
    exportBackup: "Exportar Copia de Seguridad",
    importBackup: "Importar Copia de Seguridad",
    resetData: "Restablecer Base de Datos",
    resetDataConfirmPlaceholder: "Escribe 'ELIMINAR TODO' para confirmar",
    resetDataConfirmError: "El texto de confirmación no coincide.",
    resetSuccess: "Se ha restablecido la base de datos por completo.",
    importSuccess: "Copia de seguridad importada con éxito.",
    importError: "Archivo inválido o corrupto.",
    importReplace: "Reemplazar base de datos",
    importAdd: "Añadir a los existentes",
    importMergeRequestTitle: "Conflicto de Copia de Seguridad",
    importMergeRequestText: "Se ha cargado una copia de seguridad. ¿Deseas reemplazar todos tus alumnos actuales con el archivo importado, o prefieres añadir los nuevos alumnos a tu lista actual sin perder nada?",
    validationErrorName: "El nombre del alumno es obligatorio.",
    validationErrorGeneric: "Por favor, corrige los errores antes de continuar.",
    draftDiscardConfirm: "¿Deseas descartar este borrador? Todos los cambios no guardados se perderán.",

    // Tabs
    perfil: "Perfil",
    sesion: "Sesión",
    habilidades: "Atributos y Habilidades",
    hechizos: "Conjuros y Pociones",
    notas: "Notas del Alumno",
    galeria: "Galería de Fotos",

    // Fields
    nombre: "Nombre del Alumno",
    jugador: "Jugador",
    edad: "Edad",
    casa: "Casa Funadadora",
    curso: "Curso Académico",
    puestoClase: "Puesto en la Clase",
    concepto: "Concepto",
    lema: "Lema de la Casa",
    escudoText: "Escudo y Emblema",
    complicaciones: "Complicaciones",
    linaje: "Linaje Familiar",
    puntosDestino: "Puntos de Destino",
    economia: "Economía",
    familiar: "Familiar",
    varitaSintonia: "Varita",
    estresFisico: "Estrés Físico",
    estresMental: "Estrés Mental",
    estresMentalConsecuencia: "Consecuencia Mental",
    estresSocial: "Estrés Social",
    consecuenciasFisicas: "Consecuencias Físicas",
    consecuenciasMentales: "Consecuencias Mentales",
    consecuenciasSociales: "Consecuencias Sociales",
    pxs: "Experiencia Acumulada",
    aspectoTemporal: "Aspecto Temporal",
    aspectosPersonales: "Aspectos Personales",
    addAspecto: "Añadir Aspecto",
    clubes: "Clubes Escolares",
    equipo: "Equipamiento",
    customFields: "Campos Personalizados",
    addCustomField: "Añadir Atributo Personalizado",
    fieldName: "Nombre del Atributo",
    fieldValue: "Valor",

    // Spells & Potions
    conjuroName: "Nombre del Conjuro",
    pocionName: "Fórmula de la Poción",
    spellsAndPotions: "Hechizos y Pociones",
    specialized: "Especialista",
    level: "Grado",
    addSpell: "Registrar Hechizo",
    addPotion: "Registrar Poción",

    // Categories
    catFisicas: "Habilidades Físicas",
    catMentales: "Habilidades Mentales",
    catSociales: "Habilidades Sociales",
    catTroncales: "Asignaturas Troncales",
    catOptativas: "Asignaturas Optativas",

    // Gallery
    uploadAvatar: "Cargar Retrato Principal",
    uploadGallery: "Añadir Foto a la Galería",
    pasteUrl: "Pegar URL remota",
    invalidUrl: "URL inválida",
    galleryInstructions: "Haz clic para añadir fotos a tu galería de imágenes.",

    // New localized entries
    placeholderNombre: "p. ej. Leonora Vance",
    placeholderJugador: "p. ej. Miguel Ángel",
    placeholderPuestoClase: "p. ej. Prefecta, Monitor",
    placeholderConcepto: "p. ej. Alquimista rebelde con un secreto familiar",
    placeholderLinaje: "p. ej. Sangre Pura, Mítico",
    placeholderEconomia: "p. ej. Normal, Precaria, Rica",
    placeholderComplicaciones: "p. ej. Maldición familiar latente, Temor irracional al fuego",
    placeholderAspectoTemporal: "p. ej. Convertido en sapo (Temporal)",
    placeholderFamiliar: "p. ej. Gato negro de tres ojos",
    placeholderVaritaSintonia: "p. ej. Madera de sauce con núcleo de pluma de fénix",
    placeholderConsecuenciaMental: "p. ej. Memoria mermada",
    placeholderConsecuenciaFisica: "p. ej. Brazo entumecido",
    placeholderConsecuenciaSocial: "p. ej. Murmullos a mi paso",
    placeholderNuevoAspecto: "p. ej. Hijo Predilecto de Urania",
    placeholderConjuroName: "p. ej. Revelio",
    placeholderPocionName: "p. ej. Poción Herbovitalizante",
    placeholderClubes: "p. ej. Club de Duelo escolar",
    placeholderEquipo: "p. ej. Reloj de arena, caldero peltre, grimorio antiguo de transmutación",
    placeholderNotasChronicle: "Escribe aquí las crónicas del alumno, registros de clase, pactos extraescolares o secretos que vaya descubriendo de la academia...",

    schoolShield: "ESCUELA:",
    secDatosAlumno: "Datos del Alumno",
    secLinajeDestino: "Linaje, Destino y Economía",
    secFamiliarVarita: "Familiar y Varita",
    secEstresRango: "Ajustar Rangos de Estrés",
    secPersonalAspects: "Aspectos Personales",
    secCustomFields: "Atributos Personalizados",
    labelActual: "ACTUAL",
    labelMaximo: "MÁXIMO",
    labelSalud: "SANO",
    labelHerido: "HERIDO",
    labelSereno: "INTEGRADO",
    labelAislado: "AISLADO",
    labelCordura: "SERENO",
    labelLocura: "AGITADO",
    labelGrado: "Grado",
    labelDificultad: "Dificultad",
    labelFamiliarEmpty: "Sin acompañante registrado",
    labelVaritaEmpty: "Varita básica de la academia",
    labelComplicacionesEmpty: "El alumno no reporta trabas ni maldiciones latentes.",
    labelAspectsEmpty: "Sin rasgos de guardián declarados.",
    labelAspectosTemporalesEmpty: "Sin aspectos temporales.",
    labelConsecuenciasFisicasEmpty: "Sin secuelas físicas ni heridas.",
    labelConsecuenciasMentalesEmpty: "Sin traumas ni afecciones mentales.",
    labelConsecuenciasSocialesEmpty: "Sin estigmas ni perjuicios sociales.",
    labelSpellsEmpty: "GRIMORIO VACÍO",
    labelPotionsEmpty: "ALAMBIQUE LIMPIO",
    labelGalleryEmpty: "GALERÍA DE FOTOS TOTALMENTE VACÍA",
    labelOfflineAutoSave: "ACTIVO AUTOGUARDADO OFFLINE",
    pwaOfflineStatusSuffix: "Activo",
    pwaStatusLabel: "Estado: Sin conexión",
    schoolSealPrefix: "Sello de la Escuela Magistri Scholae — 2026",
    settingsTitleDatabaseTools: "Copia de Seguridad",
    settingsDDBBExplanation: "Descarga una copia física de todos tus alumnos, incluyendo biografías, puntuaciones e imágenes persistentes.",
    settingsLanguageExplanation: "Configura el idioma preferido para la interfaz mágica y todas las fichas.",
    settingsCurrentLanguage: "Idioma Actual",
    settingsExecutePurge: "EJECUTAR PURGA",
    settingsConfirmWipeDDBBDescription: "Esta acción borrará de forma definitiva TODAS las fichas de alumnos y la biblioteca de imágenes de tu base de datos de este navegador. Para proceder, escribe el código de confirmación exactamente en el campo de abajo:",
    backupDownloadedMsg: "Copia de seguridad descargada.",
    backupErrorExportMsg: "Error al exportar los datos.",
    backupErrorOverwriteMsg: "Error al sobreescribir.",
    backupErrorMergeMsg: "Error al combinar datos.",
    backupErrorWipeMsg: "Fallo al borrar la base de datos.",
    backupTotalStudentsInFile: "Alumnos en backup",
    backupExportedOn: "Fecha de copia",
    confirmDeleteSpell: "¿Eliminar este conjuro?",
    confirmDeletePotion: "¿Eliminar esta poción?",
    confirmDeleteGalleryImage: "¿Eliminar esta imagen de la galería?",
    confirmDeleteClub: "¿Eliminar este club del alumno?",
    confirmDeleteItem: "¿Eliminar este de objeto del inventario?",
    confirmDeleteNote: "¿Eliminar esta nota del alumno?",
    labelQuantity: "Cantidad",
    addClub: "Registrar Club",
    addItem: "Registrar Objeto de Inventario",
    addNote: "Añadir Nota a la Bitácora",
    emptyClubs: "Sin clubes ni extracurriculares registrados.",
    emptyInventory: "El inventario de equipamiento del alumno está vacío.",
    emptyNotes: "La bitácora de notas del alumno está vacía.",
    placeholderNoteTitle: "p. ej. Sospechas sobre el Profesor de Alquimia",
    placeholderNoteContent: "Escribe el contenido detallado de la nota aquí...",
    labelNotesChronicleTitle: "Bitácora Celestial",
    noConceptDefined: "Sin concepto definido",
    filterByHouse: "Filtrar por Casa",
    studentPrefix: "ALUMNO",
    noName: "Sin Nombre",
    subirArchivoLocalMax: "Subir Archivo Local (Tamaño Máx: 2MB)",
    imageTooLarge: "La imagen es demasiado pesada y no se pudo reducir lo suficiente. Selecciona una menor de 5MB.",
    imageUploadError: "No se pudo procesar la imagen. Comprueba el formato o tamaño del archivo.",
    errorStoringStudent: "Error al guardar el alumno en la base de datos.",
    loadingMessage: "Abriendo grimorio de la escuela...",
    lblAvatarFit: "Ajuste de Retrato",
    optAvatarCover: "Recortar / Llenar",
    optAvatarContain: "Ajustar / Lienzo Completo",
    cropHeader: "Recortar y Ajustar Retrato",
    cropConfirm: "Confirmar Recorte",
    cropZoom: "Zoom",
  },
  en: {
    appName: "Magistri Scholae",
    tagline: "Offline Character Sheet Manager for Magic Academies",
    languageName: "English",
    searchPlaceholder: "Search by name, player, or concept...",
    filterAllHouses: "All Houses",
    noCharacters: "No student characters found. Create the first one!",
    addCharacter: "Add Student",
    settings: "System Settings",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this student?",
    confirmDeleteText: "This action is irreversible and all student data and photos will be lost.",
    confirmDeleteCheckbox: "I understand that this action is permanent and irreversible",
    confirmDeleteButton: "Confirm permanent deletion",
    confirmDeleteTitle: "Confirm Deletion",
    about: "About",
    installHelp: "PWA Installation",
    installHelpText: "This app runs fully locally and offline. On desktop or mobile devices, select 'Install app' or 'Add to home screen' from your browser menu to open it in full-screen immersion.",
    storageInfo: "Storage Information",
    storageInfoText: "Your characters are safely stored locally in your browser's IndexedDB database. Your data is private and offline-first.",
    languageSelector: "Select Language",
    exportBackup: "Export System Backup",
    importBackup: "Import System Backup",
    resetData: "Wipe System Database",
    resetDataConfirmPlaceholder: "Type 'DELETE ALL' to confirm",
    resetDataConfirmError: "Confirmation word does not match.",
    resetSuccess: "The local database has been completely wiped.",
    importSuccess: "Database backup imported successfully.",
    importError: "Invalid or corrupted backup file.",
    importReplace: "Replace database completely",
    importAdd: "Merge with current students",
    importMergeRequestTitle: "Backup Import Selection",
    importMergeRequestText: "A backup file has been read. Do you want to replace all current students with the imported file, or merge the imported students without losing current data?",
    validationErrorName: "Student name is required.",
    validationErrorGeneric: "Please fix the form errors before saving.",
    draftDiscardConfirm: "Do you want to discard this draft? All unsaved changes will be lost.",

    // Tabs
    perfil: "Profile",
    sesion: "Session Tracker",
    habilidades: "Attributes & Skills",
    hechizos: "Spells & Potions",
    notas: "Student Chronicles",
    galeria: "Photo Vault",

    // Fields
    nombre: "Student Name",
    jugador: "Player / Master",
    edad: "Age of admittance",
    casa: "Academy House",
    curso: "School Year",
    puestoClase: "Class Rank / Assignment",
    concepto: "Archetype or Concept",
    lema: "House Motto",
    escudoText: "Emblem & Insignia",
    complicaciones: "Flaws & Hardships",
    linaje: "Heritage / Bloodline",
    puntosDestino: "Destiny Points",
    economia: "Monetary Funds",
    familiar: "Familiar Companion",
    varitaSintonia: "Wand Tunement (Sintonía)",
    estresFisico: "Physical Stress",
    estresMental: "Mental Stress",
    estresMentalConsecuencia: "Severe Mental Scar",
    estresSocial: "Social Stress",
    consecuenciasFisicas: "Physical Consequences",
    consecuenciasMentales: "Mental Consequences",
    consecuenciasSociales: "Social Consequences",
    pxs: "Earned Experience (Pxs)",
    aspectoTemporal: "Temporary Aspect",
    aspectosPersonales: "Personal Aspects / Traits",
    addAspecto: "Add Aspect",
    clubes: "Clubs & Extracurriculars",
    equipo: "Spellbooks & Inventory",
    customFields: "Custom Attributes",
    addCustomField: "Add Custom Attribute",
    fieldName: "Attribute Name",
    fieldValue: "Detail or Value",

    // Spells & Potions
    conjuroName: "Spell Name",
    pocionName: "Potion Formula",
    spellsAndPotions: "Spellbooks & Brews",
    specialized: "Specialist",
    level: "Grade",
    addSpell: "Scribe Spell",
    addPotion: "Elabor Potion",

    // Categories
    catFisicas: "Physical Skills",
    catMentales: "Mental Skills",
    catSociales: "Social Skills",
    catTroncales: "Core Curriculum",
    catOptativas: "Elective Subjects",

    // Gallery
    uploadAvatar: "Upload Academy Portrait",
    uploadGallery: "Add Photo to Vault",
    pasteUrl: "Paste internet link",
    invalidUrl: "Invalid URL",
    galleryInstructions: "Drag and drop or click to upload local images directly into your offline browser storage database. Internet links are also supported.",

    // New localized entries
    placeholderNombre: "e.g., Leonora Vance",
    placeholderJugador: "e.g., Michael Angel",
    placeholderPuestoClase: "e.g., Prefect, Monitor",
    placeholderConcepto: "e.g., Rebel alchemist with a family secret",
    placeholderLinaje: "e.g., Pureblood, Mythical",
    placeholderEconomia: "e.g., Normal, Poor, Rich",
    placeholderComplicaciones: "e.g., Latent family curse, Irrational fear of fire",
    placeholderAspectoTemporal: "e.g., Turned into a toad (Temporary)",
    placeholderFamiliar: "e.g., Three-eyed black cat",
    placeholderVaritaSintonia: "e.g., Willow wood with phoenix feather core",
    placeholderConsecuenciaMental: "e.g., Fading memory",
    placeholderConsecuenciaFisica: "e.g., Numbed arm, Exhaustion",
    placeholderConsecuenciaSocial: "e.g., Rumors, Damaged reputation",
    placeholderNuevoAspecto: "e.g., Urania's Favorite Son",
    placeholderConjuroName: "e.g., Ignis Fatuus",
    placeholderPocionName: "e.g., Peace Draught",
    placeholderClubes: "e.g., School Dueling Club (Gold Tier)",
    placeholderEquipo: "e.g., Hourglass, pewter cauldron, ancient transmutation scroll",
    placeholderNotasChronicle: "Write here the chronicles, class logs, extracurricular pacts or secrets discovered in the academy...",

    schoolShield: "ACADEMY:",
    secDatosAlumno: "Student Personal Details",
    secLinajeDestino: "Heritage, Destiny & Economy",
    secFamiliarVarita: "Companion Familiar & Wand",
    secEstresRango: "Stress Thresholds",
    secPersonalAspects: "Personal Aspects",
    secCustomFields: "Custom Attributes",
    labelActual: "CURRENT",
    labelMaximo: "MAXIMUM",
    labelSalud: "HEALTH",
    labelHerido: "HURT",
    labelSereno: "SERENE",
    labelAislado: "SHUNNED",
    labelCordura: "SANITY",
    labelLocura: "SHATTERED",
    labelGrado: "Grade",
    labelDificultad: "Difficulty",
    labelFamiliarEmpty: "No companion registered",
    labelVaritaEmpty: "Academy basic issue wand",
    labelComplicacionesEmpty: "No hardships documented.",
    labelAspectsEmpty: "Empty personal qualities.",
    labelAspectosTemporalesEmpty: "No active temporary aspects.",
    labelConsecuenciasFisicasEmpty: "No physical ailments or injuries currently active.",
    labelConsecuenciasMentalesEmpty: "No mental scars or traumas currently active.",
    labelConsecuenciasSocialesEmpty: "No social drawbacks or community exclusion currently active.",
    labelSpellsEmpty: "NO SPELLS INDEXED",
    labelPotionsEmpty: "NO POTIONS INDEXED",
    labelGalleryEmpty: "EMPTY GALLERIES",
    labelOfflineAutoSave: "OFFLINE AUTO-SAVE ENABLED",
    pwaOfflineStatusSuffix: "Cached",
    pwaStatusLabel: "PWA Status: Offline",
    schoolSealPrefix: "School Seal — Magistri Scholae 2026",
    settingsTitleDatabaseTools: "Backup & Safe Export",
    settingsDDBBExplanation: "Download local records as highly portable JSON backups containing all student traits.",
    settingsLanguageExplanation: "Configure the wizarding interface preferred language.",
    settingsCurrentLanguage: "Current Language",
    settingsExecutePurge: "EXECUTE PURGE",
    settingsConfirmWipeDDBBDescription: "This action will permanently delete ALL local students and stored images. Type 'DELETE ALL' inside the field to proceed:",
    backupDownloadedMsg: "Backup downloaded successfully.",
    backupErrorExportMsg: "Error exporting records.",
    backupErrorOverwriteMsg: "Overwrite failed.",
    backupErrorMergeMsg: "Merge failed.",
    backupErrorWipeMsg: "Failed to wipe database.",
    backupTotalStudentsInFile: "Students in file",
    backupExportedOn: "Exported on",
    confirmDeleteSpell: "Delete this spell?",
    confirmDeletePotion: "Delete this formula?",
    confirmDeleteGalleryImage: "Delete this picture?",
    confirmDeleteClub: "Delete this club from the student's profile?",
    confirmDeleteItem: "Delete this item from the student's inventory?",
    confirmDeleteNote: "Delete this journal note?",
    labelQuantity: "Quantity",
    addClub: "Register Club",
    addItem: "Register Inventory Item",
    addNote: "Add Journal Note",
    emptyClubs: "No clubs or extracurricular activities registered.",
    emptyInventory: "The student's inventory is empty.",
    emptyNotes: "The student's journal is empty.",
    placeholderNoteTitle: "e.g. Suspicions on the Alchemy Professor",
    placeholderNoteContent: "Write detailed note content here...",
    labelNotesChronicleTitle: "Celestial Journal",
    noConceptDefined: "No concept defined",
    filterByHouse: "House Filter",
    studentPrefix: "STUDENT",
    noName: "No Name",
    subirArchivoLocalMax: "Upload File (Max Size: 2MB)",
    imageTooLarge: "Image is too large and compression could not reduce it enough. Please select a dynamic image under 5MB.",
    imageUploadError: "Could not process image. Please check file format or select a smaller image.",
    errorStoringStudent: "Error storing student in the database.",
    loadingMessage: "Decrypting School Tomes...",
    lblAvatarFit: "Portrait Fit",
    optAvatarCover: "Crop / Fill Frame",
    optAvatarContain: "Fit / Whole Canvas",
    cropHeader: "Crop & Adjust Portrait",
    cropConfirm: "Confirm Crop",
    cropZoom: "Zoom",
  },
};
