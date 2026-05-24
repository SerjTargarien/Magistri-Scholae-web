/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "es" | "en";

export interface TranslationDict {
  // 1. General UI Elements & Common Labels
  appName: string;
  tagline: string;
  languageName: string;
  searchPlaceholder: string;
  settings: string;
  back: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  add: string;
  noName: string;
  studentPrefix: string;
  loadingMessage: string;
  errorStoringStudent: string;
  resetConfirmPhrase: string;
  btnFinish: string;
  confirmDelete: string;
  confirmDeleteText: string;
  confirmDeleteCheckbox: string;
  confirmDeleteButton: string;
  confirmDeleteTitle: string;

  // 2. Navigation Tabs
  perfil: string;
  sesion: string;
  habilidades: string;
  hechizos: string;
  notas: string;
  galeria: string;

  // 3. Student Personal Details & Fields
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
  noConceptDefined: string;
  labelFamiliarEmpty: string;
  labelVaritaEmpty: string;

  // 4. Input Field Placeholders
  placeholderNombre: string;
  placeholderJugador: string;
  placeholderPuestoClase: string;
  placeholderConcepto: string;
  placeholderLinaje: string;
  placeholderEconomia: string;
  placeholderComplicaciones: string;
  placeholderFamiliar: string;
  placeholderVaritaSintonia: string;
  placeholderConceptoEdit: string;

  // 5. Dashboard / List View Elements
  filterAllHouses: string;
  noCharacters: string;
  addCharacter: string;
  filterByHouse: string;
  emptyRecords: string;
  lblDestino: string;
  lblExp: string;

  // 6. Character Form Layout, Creation & Section Headers
  studentRegistration: string;
  tabIdentification: string;
  tabAspects: string;
  tabHouseMotto: string;
  tabAcademicSkills: string;
  tabStress: string;
  titleBasicRegistry: string;
  titleHouseHeraldry: string;
  titleMaxStress: string;
  titleSkillsExpedient: string;
  titleAspectsPossessions: string;
  validationErrorName: string;
  validationErrorGeneric: string;
  draftDiscardConfirm: string;
  schoolShield: string;
  secDatosAlumno: string;
  secLinajeDestino: string;
  secFamiliarVarita: string;
  secEstresRango: string;
  secPersonalAspects: string;
  secCustomFields: string;

  // 7. Stress Systems, Counters & Health Labels
  estresFisico: string;
  estresMental: string;
  estresMentalConsecuencia: string;
  estresSocial: string;
  consecuenciasFisicas: string;
  consecuenciasMentales: string;
  consecuenciasSociales: string;
  pxs: string;
  placeholderConsecuenciaFisica: string;
  placeholderConsecuenciaMental: string;
  placeholderConsecuenciaSocial: string;
  labelActual: string;
  labelMaximo: string;
  labelSalud: string;
  labelHerido: string;
  labelSereno: string;
  labelAislado: string;
  labelCordura: string;
  labelLocura: string;
  labelConsecuenciasFisicasEmpty: string;
  labelConsecuenciasMentalesEmpty: string;
  labelConsecuenciasSocialesEmpty: string;
  countersAndDestiny: string;
  decreaseDestiny: string;
  increaseDestiny: string;
  noStress: string;
  removeConsequence: string;

  // 8. Aspects, Belongings, Clubs & Custom Fields
  aspectosPersonales: string;
  addAspecto: string;
  equipo: string;
  clubes: string;
  customFields: string;
  addCustomField: string;
  fieldName: string;
  fieldValue: string;
  deleteAspect: string;
  emptyAspects: string;
  addAspect: string;
  deleteComplication: string;
  emptyComplications: string;
  addComplication: string;
  deleteItem: string;
  emptyInventory: string;
  addItem: string;
  addClub: string;
  emptyClubs: string;
  labelQuantity: string;
  labelAspectsEmpty: string;
  labelAspectosTemporalesEmpty: string;
  labelComplicacionesEmpty: string;
  aspectoTemporal: string;
  placeholderAspectoTemporal: string;
  placeholderAddAspect: string;
  placeholderAddComplication: string;
  placeholderAspectExample: string;
  placeholderEquipmentExample: string;
  placeholderClubes: string;
  placeholderEquipo: string;
  confirmDeleteClub: string;
  confirmDeleteItem: string;

  // 9. Academic Skills & Preset Templates
  catFisicas: string;
  catMentales: string;
  catSociales: string;
  catTroncales: string;
  catOptativas: string;
  removeSkill: string;
  addSkill: string;
  placeholderNewSkillCategory: string;
  placeholderNewSkillName: string;
  labelCreationRange: string;
  btnSaveSkillPreset: string;
  btnSetDefaultPreset: string;
  savedPreset: string;
  descSaveSkillPreset: string;
  errSkillExists: string;

  // 10. Spellbooks, Brews & Grimoires
  conjuroName: string;
  pocionName: string;
  spellsAndPotions: string;
  specialized: string;
  level: string;
  addSpell: string;
  addPotion: string;
  placeholderConjuroName: string;
  placeholderPocionName: string;
  labelSpellsEmpty: string;
  labelPotionsEmpty: string;
  confirmDeleteSpell: string;
  confirmDeletePotion: string;
  grimoireOfSpells: string;
  registerNewSpell: string;
  register: string;
  catalogOfPotions: string;
  registerNewPotion: string;
  labelGrado: string;
  labelDificultad: string;

  // 11. Journal / Chronicles Notes
  emptyNotes: string;
  addNote: string;
  confirmDeleteNote: string;
  placeholderNoteTitle: string;
  placeholderNoteContent: string;
  labelNotesChronicleTitle: string;
  placeholderNotasChronicle: string;
  notesLabel: string;
  registerNote: string;
  entryFrom: string;
  consolidatedJournal: string;

  // 12. Gallery, Portrait Fitting & Cropping
  uploadAvatar: string;
  uploadGallery: string;
  pasteUrl: string;
  invalidUrl: string;
  galleryInstructions: string;
  labelGalleryEmpty: string;
  confirmDeleteGalleryImage: string;
  subirArchivoLocalMax: string;
  imageTooLarge: string;
  imageUploadError: string;
  btnChangePhoto: string;
  lblAvatarFit: string;
  optAvatarCover: string;
  optAvatarContain: string;
  cropHeader: string;
  cropConfirm: string;
  cropZoom: string;

  // 13. Settings, Storage, Purging & Backups
  about: string;
  aboutDescription: string;
  installHelp: string;
  installHelpText: string;
  storageInfo: string;
  storageInfoText: string;
  estimatedUsage: string;
  totalQuota: string;
  schoolSealPrefix: string;
  languageSelector: string;
  settingsCurrentLanguage: string;
  settingsLanguageExplanation: string;
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
  settingsTitleDatabaseTools: string;
  settingsDDBBExplanation: string;
  settingsExecutePurge: string;
  settingsConfirmWipeDDBBDescription: string;
  backupDownloadedMsg: string;
  backupErrorExportMsg: string;
  backupErrorOverwriteMsg: string;
  backupErrorMergeMsg: string;
  backupErrorWipeMsg: string;
  backupTotalStudentsInFile: string;
  backupExportedOn: string;
  labelOfflineAutoSave: string;
  pwaOfflineStatusSuffix: string;
  pwaStatusLabel: string;
  exportSelect: string;
  selectStudents: string;
  selectAll: string;
  deselectAll: string;
  exportStudent: string;
  studentListEmptyBackup: string;
  exportSelectTitle: string;
  exportSelectDescription: string;
  searchBackupStudents: string;
  exportSelectedCount: string;
  exportFullBackup: string;
  characterTypeStudent: string;
  characterTypeAdultWizard: string;
  characterTypeAdultWizardDescription: string;
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  es: {
    // 1. General UI Elements & Common Labels
    appName: "Magistri Scholae",
    tagline: "Editor de fichas de Personaje",
    languageName: "Español",
    searchPlaceholder: "Buscar por nombre, jugador o concepto...",
    settings: "Ajustes",
    back: "Volver",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    add: "Añadir",
    noName: "Sin Nombre",
    studentPrefix: "ALUMNO",
    loadingMessage: "Abriendo grimorio de la escuela...",
    errorStoringStudent: "Error al guardar el alumno en la base de datos.",
    resetConfirmPhrase: "ELIMINAR TODO",
    btnFinish: "Finalizar Edición",
    confirmDelete: "Eliminar Alumno permanentemente",
    confirmDeleteText: "¿Estás seguro de que deseas eliminar permanentemente a este alumno? Esta acción es irreversible, destruirá de forma completa su bitácora de crónicas, galería de retratos, conjuros, pociones y equipamiento.",
    confirmDeleteCheckbox: "Entiendo que esta acción es definitiva y no podré recuperar de ningún modo la ficha de este alumno.",
    confirmDeleteButton: "Eliminar Permanente",
    confirmDeleteTitle: "Confirmar Eliminación",

    // 2. Navigation Tabs
    perfil: "Perfil",
    sesion: "Sesión",
    habilidades: "Habilidades",
    hechizos: "Conjuros y Pociones",
    notas: "Inventario y Notas",
    galeria: "Galería",

    // 3. Student Personal Details & Fields
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
    noConceptDefined: "Sin arquetipo ni concepto definido",
    labelFamiliarEmpty: "Ningún animal o familiar en sintonía.",
    labelVaritaEmpty: "Sin varita vinculada.",

    // 4. Input Field Placeholders
    placeholderNombre: "p. ej. Leonora Vance",
    placeholderJugador: "p. ej. Miguel Ángel",
    placeholderPuestoClase: "p. ej. Prefecta, Monitor",
    placeholderConcepto: "p. ej. Alquimista rebelde con un secreto familiar",
    placeholderLinaje: "p. ej. Sangre Pura, Mítico",
    placeholderEconomia: "p. ej. Normal, Precaria, Rica",
    placeholderComplicaciones: "p. ej. Maldición familiar latente, Temor irracional al fuego",
    placeholderFamiliar: "p. ej. Gato negro de tres ojos",
    placeholderVaritaSintonia: "p. ej. Madera de sauce con núcleo de pluma de fénix",
    placeholderConceptoEdit: "Concepto del alumno",

    // 5. Dashboard / List View Elements
    filterAllHouses: "Todas las Casas",
    noCharacters: "No se encontraron alumnos. ¡Crea el primero!",
    addCharacter: "Nuevo Alumno",
    filterByHouse: "Filtrar por Casa",
    emptyRecords: "Bóveda Vacía",
    lblDestino: "Destino",
    lblExp: "Exp",

    // 6. Character Form Layout, Creation & Section Headers
    studentRegistration: "Matriculación de Alumno",
    tabIdentification: "Identificación",
    tabAspects: "Aspectos y Posesiones",
    tabHouseMotto: "Casa y Lema",
    tabAcademicSkills: "Habilidades",
    tabStress: "Estrés",
    titleBasicRegistry: "Filiación Académica Básica y Retrato",
    titleHouseHeraldry: "Filiación de la Casa y Heráldica",
    titleMaxStress: "Máximos de Estrés del Alumno",
    titleSkillsExpedient: "Habilidades del Expediente del Alumno",
    titleAspectsPossessions: "Aspectos Personales y Posesiones del Alumno",
    validationErrorName: "El nombre del alumno es obligatorio.",
    validationErrorGeneric: "Por favor, corrige los errores antes de continuar.",
    draftDiscardConfirm: "¿Deseas descartar este borrador? Todos los cambios no guardados se perderán.",
    schoolShield: "ESCUELA:",
    secDatosAlumno: "Datos del Alumno",
    secLinajeDestino: "Linaje, Destino y Economía",
    secFamiliarVarita: "Familiar y Varita",
    secEstresRango: "Ajustar Rangos de Estrés",
    secPersonalAspects: "Aspectos Personales",
    secCustomFields: "Atributos Personalizados",

    // 7. Stress Systems, Counters & Health Labels
    estresFisico: "Estrés Físico",
    estresMental: "Estrés Mental",
    estresMentalConsecuencia: "Consecuencia Mental",
    estresSocial: "Estrés Social",
    consecuenciasFisicas: "Consecuencias Físicas",
    consecuenciasMentales: "Consecuencias Mentales",
    consecuenciasSociales: "Consecuencias Sociales",
    pxs: "Experiencia Acumulada",
    placeholderConsecuenciaFisica: "p. ej. Brazo entumecido",
    placeholderConsecuenciaMental: "p. ej. Memoria mermada",
    placeholderConsecuenciaSocial: "p. ej. Murmullos a mi paso",
    labelActual: "ACTUAL",
    labelMaximo: "MÁXIMO",
    labelSalud: "SANO",
    labelHerido: "HERIDO",
    labelSereno: "INTEGRADO",
    labelAislado: "AISLADO",
    labelCordura: "SERENO",
    labelLocura: "AGITADO",
    labelConsecuenciasFisicasEmpty: "Sin secuelas físicas ni heridas.",
    labelConsecuenciasMentalesEmpty: "Sin traumas ni afecciones mentales.",
    labelConsecuenciasSocialesEmpty: "Sin estigmas ni perjuicios sociales.",
    countersAndDestiny: "Recursos y Destino",
    decreaseDestiny: "Disminuir destino",
    increaseDestiny: "Aumentar destino",
    noStress: "Sin estrés",
    removeConsequence: "Eliminar consecuencia",

    // 8. Aspects, Belongings, Clubs & Custom Fields
    aspectosPersonales: "Aspectos Personales",
    addAspecto: "Añadir Aspecto",
    equipo: "Equipamiento",
    clubes: "Clubes Escolares",
    customFields: "Campos Personalizados",
    addCustomField: "Añadir Atributo Personalizado",
    fieldName: "Nombre del Atributo",
    fieldValue: "Valor",
    deleteAspect: "Eliminar aspecto",
    emptyAspects: "No hay aspectos personales registrados.",
    addAspect: "Añadir aspecto",
    deleteComplication: "Eliminar complicación",
    emptyComplications: "No hay complicaciones registradas.",
    addComplication: "Añadir complicación",
    deleteItem: "Eliminar objeto",
    emptyInventory: "El inventario de equipamiento del alumno está vacío.",
    addItem: "Registrar Objeto de Inventario",
    addClub: "Registrar Club",
    emptyClubs: "Sin clubes ni extracurriculares registrados.",
    labelQuantity: "Cantidad",
    labelAspectsEmpty: "Sin rasgos de guardián declarados.",
    labelAspectosTemporalesEmpty: "Sin aspectos temporales.",
    labelComplicacionesEmpty: "El alumno no reporta trabas ni maldiciones latentes.",
    aspectoTemporal: "Aspecto Temporal",
    placeholderAspectoTemporal: "p. ej. Convertido en sapo (Temporal)",
    placeholderAddAspect: "Añadir nuevo aspecto...",
    placeholderAddComplication: "Añadir complicación...",
    placeholderAspectExample: "Ej. Voluntad de Hierro, Tercera Generación...",
    placeholderEquipmentExample: "Ej. Varita de Fénix, Capa de Invisibilidad...",
    placeholderClubes: "p. ej. Club de Duelo escolar",
    placeholderEquipo: "p. ej. Reloj de arena, caldero peltre, grimorio antiguo de transmutación",
    confirmDeleteClub: "¿Eliminar este club del alumno?",
    confirmDeleteItem: "¿Eliminar este de objeto del inventario?",

    // 9. Academic Skills & Preset Templates
    catFisicas: "Habilidades Físicas",
    catMentales: "Habilidades Mentales",
    catSociales: "Habilidades Sociales",
    catTroncales: "Asignaturas Troncales",
    catOptativas: "Asignaturas Optativas",
    removeSkill: "Quitar Habilidad",
    addSkill: "Añadir Habilidad",
    placeholderNewSkillCategory: "Nueva habilidad en esta categoría...",
    placeholderNewSkillName: "Nueva habilidad...",
    labelCreationRange: "Rango de creación: 0 a 5",
    btnSaveSkillPreset: "Guardar Plantilla de Habilidades",
    btnSetDefaultPreset: "Fijar por Defecto",
    savedPreset: "¡Registrado!",
    descSaveSkillPreset: "Establece la lista de habilidades actual como el borrador predeterminado para futuras matrículas.",
    errSkillExists: 'La habilidad "{name}" ya existe',

    // 10. Spellbooks, Brews & Grimoires
    conjuroName: "Nombre del Conjuro",
    pocionName: "Fórmula de la Poción",
    spellsAndPotions: "Hechizos y Pociones",
    specialized: "Especialista",
    level: "Grado",
    addSpell: "Registrar Hechizo",
    addPotion: "Registrar Poción",
    placeholderConjuroName: "p. ej. Revelio",
    placeholderPocionName: "p. ej. Poción Herbovitalizante",
    labelSpellsEmpty: "GRIMORIO VACÍO",
    labelPotionsEmpty: "ALAMBIQUE LIMPIO",
    confirmDeleteSpell: "¿Eliminar este conjuro?",
    confirmDeletePotion: "¿Eliminar esta poción?",
    grimoireOfSpells: "Grimorio de Conjuros",
    registerNewSpell: "Registrar Nuevo Hechizo",
    register: "Registrar",
    catalogOfPotions: "Catálogo de Pociones",
    registerNewPotion: "Registrar Nueva Poción",
    labelGrado: "Grado",
    labelDificultad: "Dificultad",

    // 11. Journal / Chronicles Notes
    emptyNotes: "La bitácora de notas del alumno está vacía.",
    addNote: "Añadir Nota a la Bitácora",
    confirmDeleteNote: "¿Eliminar esta nota del alumno?",
    placeholderNoteTitle: "p. ej. Sospechas sobre el Profesor de Alquimia",
    placeholderNoteContent: "Escribe el contenido detallado de la nota aquí...",
    labelNotesChronicleTitle: "Bitácora Celestial",
    placeholderNotasChronicle: "Escribe aquí las crónicas del alumno, registros de clase, pactos extraescolares o secretos que vaya descubriendo de la academia...",
    notesLabel: "Notas",
    registerNote: "Registrar Entrada",
    entryFrom: "Entrada del ",
    consolidatedJournal: "Bitácora Consolidada",

    // 12. Gallery, Portrait Fitting & Cropping
    uploadAvatar: "Cargar Retrato Principal",
    uploadGallery: "Añadir Foto a la Galería",
    pasteUrl: "Pegar URL remota",
    invalidUrl: "URL inválida",
    galleryInstructions: "Haz clic para añadir fotos a tu galería de imágenes.",
    labelGalleryEmpty: "GALERÍA DE FOTOS TOTALMENTE VACÍA",
    confirmDeleteGalleryImage: "¿Eliminar esta imagen de la galería?",
    subirArchivoLocalMax: "Subir Archivo Local (Tamaño Máx: 2MB)",
    imageTooLarge: "La imagen es demasiado pesada y no se pudo reducir lo suficiente. Selecciona una menor de 5MB.",
    imageUploadError: "No se pudo procesar la imagen. Comprueba el formato o tamaño del archivo.",
    btnChangePhoto: "Cambiar foto",
    lblAvatarFit: "Ajuste de Retrato",
    optAvatarCover: "Recortar / Llenar",
    optAvatarContain: "Ajustar / Lienzo Completo",
    cropHeader: "Recortar y Ajustar Retrato",
    cropConfirm: "Confirmar Recorte",
    cropZoom: "Zoom",

    // 13. Settings, Storage, Purging & Backups
    about: "Acerca de",
    aboutDescription: "Herramienta diseñada para directores de juego y alumnos de academias mágicas. Permite administrar fichas completas.",
    installHelp: "Instalación PWA",
    installHelpText: "Esta aplicación se ejecuta localmente y sin conexión. En tu dispositivo móvil o de escritorio, selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio' en el menú de tu navegador para llevar la experiencia mágica a pantalla completa.",
    storageInfo: "Información de Almacenamiento",
    storageInfoText: "Tus datos se guardan de forma permanente e individual en la base de datos IndexedDB de tu propio navegador. El almacenamiento es local y privado.",
    estimatedUsage: "Uso estimado:",
    totalQuota: "Cuota total:",
    schoolSealPrefix: "Diseñado con cariño por Serj, en 2026",
    languageSelector: "Seleccionar Idioma",
    settingsCurrentLanguage: "Idioma Actual",
    settingsLanguageExplanation: "Configura el idioma preferido para la interfaz mágica y todas las fichas.",
    exportBackup: "Exportar Copia de Seguridad",
    importBackup: "Importar Copia de Seguridad",
    resetData: "Purgar Base de Datos",
    resetDataConfirmPlaceholder: "Escribe 'ELIMINAR TODO' para confirmar",
    resetDataConfirmError: "El texto de confirmación no coincide.",
    resetSuccess: "Se ha restablecido la base de datos por completo.",
    importSuccess: "Copia de seguridad importada con éxito.",
    importError: "Archivo inválido o corrupto.",
    importReplace: "Reemplazar base de datos",
    importAdd: "Añadir a los existentes",
    importMergeRequestTitle: "Conflicto de Copia de Seguridad",
    importMergeRequestText: "Se ha cargado una copia de seguridad. ¿Deseas reemplazar todos tus alumnos actuales con el archivo importado, o prefieres añadir los nuevos alumnos a tu lista actual sin perder nada?",
    settingsTitleDatabaseTools: "Copia de Seguridad",
    settingsDDBBExplanation: "Descarga una copia física de todos tus alumnos, incluyendo biografías, puntuaciones e imágenes persistentes.",
    settingsExecutePurge: "EJECUTAR PURGA",
    settingsConfirmWipeDDBBDescription: "Esta acción borrará de forma definitiva TODAS las fichas de alumnos y la biblioteca de imágenes de tu base de datos de este navegador. Para proceder, escribe el código de confirmación exactamente en el campo de abajo:",
    backupDownloadedMsg: "Copia de seguridad descargada.",
    backupErrorExportMsg: "Error al exportar los datos.",
    backupErrorOverwriteMsg: "Error al sobreescribir.",
    backupErrorMergeMsg: "Error al combinar datos.",
    backupErrorWipeMsg: "Fallo al borrar la base de datos.",
    backupTotalStudentsInFile: "Alumnos en backup",
    backupExportedOn: "Fecha de copia",
    labelOfflineAutoSave: "ACTIVO AUTOGUARDADO OFFLINE",
    pwaOfflineStatusSuffix: "Activo",
    pwaStatusLabel: "Estado: Sin conexión",
    exportSelect: "Copia parcial",
    selectStudents: "Seleccionar Alumnos",
    selectAll: "Seleccionar Todos",
    deselectAll: "Deseleccionar Todos",
    exportStudent: "Exportar Alumno",
    studentListEmptyBackup: "No hay alumnos inscritos en este navegador para exportar.",
    exportSelectTitle: "Exportación Selectiva",
    exportSelectDescription: "Selecciona qué fichas de alumnos deseas empaquetar en el archivo de copia de seguridad JSON.",
    searchBackupStudents: "Buscar alumno (por nombre o casa)...",
    exportSelectedCount: "Fichas a exportar: {n}",
    exportFullBackup: "Copia Completa",
    characterTypeStudent: "Alumno",
    characterTypeAdultWizard: "Mago adulto",
    characterTypeAdultWizardDescription: "Mago adulto, profesor o personaje mágico externo.",
  },
  en: {
    // 1. General UI Elements & Common Labels
    appName: "Magistri Scholae",
    tagline: "Offline Character Sheet Manager for Magic Academies",
    languageName: "English",
    searchPlaceholder: "Search by name, player, or concept...",
    settings: "System Settings",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    noName: "No Name",
    studentPrefix: "STUDENT",
    loadingMessage: "Decrypting School Tomes...",
    errorStoringStudent: "Error storing student in the database.",
    resetConfirmPhrase: "DELETE ALL",
    btnFinish: "Finish Editing",
    confirmDelete: "Permanently Delete Student",
    confirmDeleteText: "Are you sure you want to permanently delete this student from the academic archives? This action is completely irreversible and will permanently delete all of their chronicled journals, photo galleries, spells, custom potions, and belongings.",
    confirmDeleteCheckbox: "I understand that this action is permanent and I will not be able to recover this student's character sheet under any circumstance.",
    confirmDeleteButton: "Delete Permanently",
    confirmDeleteTitle: "Confirm Deletion",

    // 2. Navigation Tabs
    perfil: "Profile",
    sesion: "Session Tracker",
    habilidades: "Attributes & Skills",
    hechizos: "Spells & Potions",
    notas: "Student Chronicles",
    galeria: "Photo Vault",

    // 3. Student Personal Details & Fields
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
    noConceptDefined: "No archetype or concept defined",
    labelFamiliarEmpty: "No companion animal or familiar attuned.",
    labelVaritaEmpty: "No linked wand.",

    // 4. Input Field Placeholders
    placeholderNombre: "e.g., Leonora Vance",
    placeholderJugador: "e.g., Michael Angel",
    placeholderPuestoClase: "e.g., Prefect, Monitor",
    placeholderConcepto: "e.g., Rebel alchemist with a family secret",
    placeholderLinaje: "e.g., Pureblood, Mythical",
    placeholderEconomia: "e.g., Normal, Poor, Rich",
    placeholderComplicaciones: "e.g., Latent family curse, Irrational fear of fire",
    placeholderFamiliar: "e.g., Three-eyed black cat",
    placeholderVaritaSintonia: "e.g., Willow wood with phoenix feather core",
    placeholderConceptoEdit: "Student concept",

    // 5. Dashboard / List View Elements
    filterAllHouses: "All Houses",
    noCharacters: "No student characters found. Create the first one!",
    addCharacter: "Add Student",
    filterByHouse: "House Filter",
    emptyRecords: "Empty Records",
    lblDestino: "Destiny",
    lblExp: "Pxs",

    // 6. Character Form Layout, Creation & Section Headers
    studentRegistration: "Student Registration",
    tabIdentification: "Identification",
    tabAspects: "Aspects & Belongings",
    tabHouseMotto: "House & Motto",
    tabAcademicSkills: "Academic Skills",
    tabStress: "Stress",
    titleBasicRegistry: "Basic Academic Registry & Portrait",
    titleHouseHeraldry: "Academy House & Household Heraldry",
    titleMaxStress: "Max Stress Ranges of the Student",
    titleSkillsExpedient: "Student Academic Performance Skills (0-5)",
    titleAspectsPossessions: "Personal Aspects & Possessions of the Student",
    validationErrorName: "Student name is required.",
    validationErrorGeneric: "Please fix the form errors before saving.",
    draftDiscardConfirm: "Do you want to discard this draft? All unsaved changes will be lost.",
    schoolShield: "ACADEMY:",
    secDatosAlumno: "Student Personal Details",
    secLinajeDestino: "Heritage, Destiny & Economy",
    secFamiliarVarita: "Companion Familiar & Wand",
    secEstresRango: "Stress Thresholds",
    secPersonalAspects: "Personal Aspects",
    secCustomFields: "Custom Attributes",

    // 7. Stress Systems, Counters & Health Labels
    estresFisico: "Physical Stress",
    estresMental: "Mental Stress",
    estresMentalConsecuencia: "Severe Mental Scar",
    estresSocial: "Social Stress",
    consecuenciasFisicas: "Physical Consequences",
    consecuenciasMentales: "Mental Consequences",
    consecuenciasSociales: "Social Consequences",
    pxs: "Earned Experience (Pxs)",
    placeholderConsecuenciaFisica: "e.g., Numbed arm, Exhaustion",
    placeholderConsecuenciaMental: "e.g., Fading memory",
    placeholderConsecuenciaSocial: "e.g., Rumors, Damaged reputation",
    labelActual: "CURRENT",
    labelMaximo: "MAXIMUM",
    labelSalud: "HEALTH",
    labelHerido: "HURT",
    labelSereno: "SERENE",
    labelAislado: "SHUNNED",
    labelCordura: "SANITY",
    labelLocura: "SHATTERED",
    labelConsecuenciasFisicasEmpty: "No physical ailments or injuries currently active.",
    labelConsecuenciasMentalesEmpty: "No mental scars or traumas currently active.",
    labelConsecuenciasSocialesEmpty: "No social drawbacks or community exclusion currently active.",
    countersAndDestiny: "Counters & Destiny",
    decreaseDestiny: "Decrease destiny",
    increaseDestiny: "Increase destiny",
    noStress: "No stress",
    removeConsequence: "Remove consequence",

    // 8. Aspects, Belongings, Clubs & Custom Fields
    aspectosPersonales: "Personal Aspects / Traits",
    addAspecto: "Add Aspect",
    equipo: "Spellbooks & Inventory",
    clubes: "Clubs & Extracurriculars",
    customFields: "Custom Attributes",
    addCustomField: "Add Custom Attribute",
    fieldName: "Attribute Name",
    fieldValue: "Detail or Value",
    deleteAspect: "Delete aspect",
    emptyAspects: "No personal aspects registered.",
    addAspect: "Add aspect",
    deleteComplication: "Delete complication",
    emptyComplications: "No complications registered.",
    addComplication: "Add complication",
    deleteItem: "Delete item",
    emptyInventory: "The student's inventory is empty.",
    addItem: "Register Inventory Item",
    addClub: "Register Club",
    emptyClubs: "No clubs or extracurricular activities registered.",
    labelQuantity: "Quantity",
    labelAspectsEmpty: "Empty personal qualities.",
    labelAspectosTemporalesEmpty: "No active temporary aspects.",
    labelComplicacionesEmpty: "No hardships documented.",
    aspectoTemporal: "Temporary Aspect",
    placeholderAspectoTemporal: "e.g., Turned into a toad (Temporary)",
    placeholderAddAspect: "Add new aspect...",
    placeholderAddComplication: "Add complication...",
    placeholderAspectExample: "E.g. Will of Iron, Third Generation...",
    placeholderEquipmentExample: "E.g. Phoenix Wand, Cloak of Invisibility...",
    placeholderClubes: "e.g., School Dueling Club (Gold Tier)",
    placeholderEquipo: "e.g., Hourglass, pewter cauldron, ancient transmutation scroll",
    confirmDeleteClub: "Delete this club from the student's profile?",
    confirmDeleteItem: "Delete this item from the student's inventory?",

    // 9. Academic Skills & Preset Templates
    catFisicas: "Physical Skills",
    catMentales: "Mental Skills",
    catSociales: "Social Skills",
    catTroncales: "Core Curriculum",
    catOptativas: "Elective Subjects",
    removeSkill: "Remove Skill",
    addSkill: "Add Skill",
    placeholderNewSkillCategory: "Add skill here...",
    placeholderNewSkillName: "New skill name...",
    labelCreationRange: "Creation range: 0 to 5",
    btnSaveSkillPreset: "Save Skill Preset Template",
    btnSetDefaultPreset: "Set as Default Preset",
    savedPreset: "Saved preset!",
    descSaveSkillPreset: "Saves the current skill list layout as the standard template for all future created characters.",
    errSkillExists: 'Skill "{name}" already exists',

    // 10. Spellbooks, Brews & Grimoires
    conjuroName: "Spell Name",
    pocionName: "Potion Formula",
    spellsAndPotions: "Spellbooks & Brews",
    specialized: "Specialist",
    level: "Grade",
    addSpell: "Scribe Spell",
    addPotion: "Elabor Potion",
    placeholderConjuroName: "e.g., Ignis Fatuus",
    placeholderPocionName: "e.g., Peace Draught",
    labelSpellsEmpty: "NO SPELLS INDEXED",
    labelPotionsEmpty: "NO POTIONS INDEXED",
    confirmDeleteSpell: "Delete this spell?",
    confirmDeletePotion: "Delete this formula?",
    grimoireOfSpells: "Grimoire of Spells",
    registerNewSpell: "Register New Spell",
    register: "Register",
    catalogOfPotions: "Laboratory Potions",
    registerNewPotion: "Register New Potion",
    labelGrado: "Grade",
    labelDificultad: "Difficulty",

    // 11. Journal / Chronicles Notes
    emptyNotes: "The student's journal is empty.",
    addNote: "Add Journal Note",
    confirmDeleteNote: "Delete this journal note?",
    placeholderNoteTitle: "e.g. Suspicions on the Alchemy Professor",
    placeholderNoteContent: "Write detailed note content here...",
    labelNotesChronicleTitle: "Celestial Journal",
    placeholderNotasChronicle: "Write here the chronicles, class logs, extracurricular pacts or secrets discovered in the academy...",
    notesLabel: "Notes",
    registerNote: "Register Note",
    entryFrom: "Entry from ",
    consolidatedJournal: "Consolidated Journal",

    // 12. Gallery, Portrait Fitting & Cropping
    uploadAvatar: "Upload Academy Portrait",
    uploadGallery: "Add Photo to Vault",
    pasteUrl: "Paste internet link",
    invalidUrl: "Invalid URL",
    galleryInstructions: "Drag and drop or click to upload local images directly into your offline browser storage database. Internet links are also supported.",
    labelGalleryEmpty: "EMPTY GALLERIES",
    confirmDeleteGalleryImage: "Delete this picture?",
    subirArchivoLocalMax: "Upload File (Max Size: 2MB)",
    imageTooLarge: "Image is too large and compression could not reduce it enough. Please select a dynamic image under 5MB.",
    imageUploadError: "Could not process image. Please check file format or select a smaller image.",
    btnChangePhoto: "Change photo",
    lblAvatarFit: "Portrait Fit",
    optAvatarCover: "Crop / Fill Frame",
    optAvatarContain: "Fit / Whole Canvas",
    cropHeader: "Crop & Adjust Portrait",
    cropConfirm: "Confirm Crop",
    cropZoom: "Zoom",

    // 13. Settings, Storage, Purging & Backups
    about: "About",
    aboutDescription: "Companion ledger for roleplaying magic campaign characters. Keeps all students, spells, archives and sheets safe offline inside your web browser.",
    installHelp: "PWA Installation",
    installHelpText: "This app runs fully locally and offline. On desktop or mobile devices, select 'Install app' or 'Add to home screen' from your browser menu to open it in full-screen immersion.",
    storageInfo: "Storage Information",
    storageInfoText: "Your characters are safely stored locally in your browser's IndexedDB database. Your data is private and offline-first.",
    estimatedUsage: "Estimated usage:",
    totalQuota: "Total quota:",
    schoolSealPrefix: "School Seal — Magistri Scholae 2026",
    languageSelector: "Select Language",
    settingsCurrentLanguage: "Current Language",
    settingsLanguageExplanation: "Configure the wizarding interface preferred language.",
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
    settingsTitleDatabaseTools: "Backup & Safe Export",
    settingsDDBBExplanation: "Download local records as highly portable JSON backups containing all student traits.",
    settingsExecutePurge: "EXECUTE PURGE",
    settingsConfirmWipeDDBBDescription: "This action will permanently delete ALL local students and stored images. Type 'DELETE ALL' inside the field to proceed:",
    backupDownloadedMsg: "Backup downloaded successfully.",
    backupErrorExportMsg: "Error exporting records.",
    backupErrorOverwriteMsg: "Overwrite failed.",
    backupErrorMergeMsg: "Merge failed.",
    backupErrorWipeMsg: "Failed to wipe database.",
    backupTotalStudentsInFile: "Students in file",
    backupExportedOn: "Exported on",
    labelOfflineAutoSave: "OFFLINE AUTO-SAVE ENABLED",
    pwaOfflineStatusSuffix: "Cached",
    pwaStatusLabel: "PWA Status: Offline",
    exportSelect: "Export Selected",
    selectStudents: "Select Students",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    exportStudent: "Export Student",
    studentListEmptyBackup: "No registered students in this browser to export.",
    exportSelectTitle: "Selective Export",
    exportSelectDescription: "Select which student sheets you want to package into the JSON backup file.",
    searchBackupStudents: "Search student (by name or house)...",
    exportSelectedCount: "Cards to export: {n}",
    exportFullBackup: "Full Backup (All)",
    characterTypeStudent: "Student",
    characterTypeAdultWizard: "Adult Wizard",
    characterTypeAdultWizardDescription: "Adult wizard, teacher, or external magical character.",
  },
};
