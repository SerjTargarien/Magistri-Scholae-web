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
    settings: "Ajustes del Sistema",
    back: "Volver",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar a este alumno?",
    confirmDeleteText: "Esta acción es irreversible y se perderán todos sus datos y fotos.",
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
    economia: "Fondo Monetario",
    familiar: "Familiar",
    varitaSintonia: "Varita",
    estresFisico: "Estrés Físico",
    estresMental: "Estrés Mental",
    estresMentalConsecuencia: "Consecuencia Mental",
    estresSocial: "Estrés Social",
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
    galleryInstructions: "Haz clic o arrastra imágenes locales para almancenarlas directamente en tu base de datos offline. También puedes pegar enlaces de internet.",
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
    about: "About",
    installHelp: "PWA Installation",
    installHelpText: "This app runs fully locally and offline. On desktop or mobile devices, select 'Install app' or 'Add to home screen' from your browser menu to open it in full-screen immersion.",
    storageInfo: "Storage Information",
    storageInfoText: "Your characters are safely stored locally in your browser's IndexedDB database. Your data is private and offline-first.",
    languageSelector: "Select Language",
    exportBackup: "Export System Backup",
    importBackup: "Import System Backup",
    resetData: "Wipe System Database",
    resetDataConfirmPlaceholder: "Type 'ELIMINAR TODO' to confirm",
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
  },
};
