/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "es" | "en";

export interface TranslationDict {
  // 1. General UI Elements & Common Labels
  appName: string;
  tagline: string;
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
  mockModeBanner: string;
  storageLoadError: string;
  errorStoringStudent: string;
  btnFinish: string;
  confirmDelete: string;
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
  complicaciones: string;
  linaje: string;
  puntosDestino: number | string;
  economia: string;
  varitaSintonia: string;
  noConceptDefined: string;
  labelVaritaEmpty: string;

  // 4. Input Field Placeholders
  placeholderNombre: string;
  requiredKeepsSaved: string;
  limitEntries: string;
  limitImages: string;
  limitReached: string;
  pickerSearch: string;
  pickerNoMatch: string;
  pickerDone: string;
  pickerClose: string;
  placeholderJugador: string;
  placeholderPuestoClase: string;
  placeholderConcepto: string;
  placeholderLinaje: string;
  placeholderEconomia: string;
  placeholderComplicaciones: string;
  placeholderVaritaSintonia: string;

  // 5. Dashboard / List View Elements
  filterAllHouses: string;
  noCharacters: string;
  addCharacter: string;
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
  secDatosAlumno: string;

  // 7. Stress Systems, Counters & Health Labels
  estresFisico: string;
  estresMental: string;
  estresSocial: string;
  consecuenciasFisicas: string;
  consecuenciasMentales: string;
  consecuenciasSociales: string;
  pxs: string;
  placeholderConsecuenciaFisica: string;
  placeholderConsecuenciaMental: string;
  placeholderConsecuenciaSocial: string;
  labelMaximo: string;
  labelMax: string;
  chooseImage: string;
  imageExpandedAlt: string;
  imageViewerPortrait: string;
  imageViewerPrev: string;
  imageViewerNext: string;
  imageViewerZoomIn: string;
  imageViewerZoomOut: string;
  imageViewerClose: string;
  imageViewerHintPc: string;
  imageViewerHintTouch: string;
  crestAlt: string;
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
  severity: string;
  severityLeve: string;
  severityModerada: string;
  severityGrave: string;
  severityChoose: string;
  severityLeveHint: string;
  severityModeradaHint: string;
  severityGraveHint: string;

  // 8. Aspects, Belongings, Clubs & Custom Fields
  aspectosPersonales: string;
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
  removeSkill: string;
  addSkill: string;
  placeholderNewSkillCategory: string;
  placeholderNewSkillName: string;
  labelCreationRange: string;
  addSkillFromList: string;
  errSkillExists: string;
  noSkillsInCategory: string;

  // 10. Spellbooks, Brews & Grimoires
  specialized: string;
  level: string;
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
  labelDificultad: string;

  // 11. Journal / Chronicles Notes
  emptyNotes: string;
  addNote: string;
  confirmDeleteNote: string;
  remove: string;
  confirmDeleteAspect: string;
  confirmDeleteComplication: string;
  confirmDeleteCustomField: string;
  confirmRemoveConsequence: string;
  confirmRemoveSkill: string;
  confirmRemoveSubject: string;
  confirmRemovePortrait: string;
  placeholderNoteTitle: string;
  placeholderNoteContent: string;
  labelNotesChronicleTitle: string;
  notesLabel: string;
  registerNote: string;
  entryFrom: string;

  // 12. Gallery, Portrait Fitting & Cropping
  uploadAvatar: string;
  uploadGallery: string;
  pasteUrl: string;
  galleryInstructions: string;
  labelGalleryEmpty: string;
  confirmDeleteGalleryImage: string;
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
  storageInfo: string;
  schoolSealPrefix: string;
  languageSelector: string;
  settingsCurrentLanguage: string;
  settingsLanguageExplanation: string;
  characterTypeStudent: string;
  characterTypeStudentDescription: string;
  characterTypeAdultWizard: string;
  characterTypeAdultWizardDescription: string;
  adultWizardRegistration: string;
  adultWizardProfileSection: string;
  adultWizardRole: string;
  adultWizardInstitution: string;
  adultWizardIsTeacher: string;
  adultWizardTeachingSubjects: string;
  adultWizardFormerHouse: string;
  adultWizardReputation: string;
  characterTypeAdultWizardShort: string;
  characterTypeSelectTitle: string;
  characterTypeSelectDescription: string;
  adultWizardRolePlaceholder: string;
  adultWizardInstitutionPlaceholder: string;
  adultWizardFormerHousePlaceholder: string;
  adultWizardReputationPlaceholder: string;
  placeholderAddSubject: string;
  labelNoSubjects: string;
  removeSubject: string;
  addSubject: string;
  yes: string;
  no: string;
  noPortrait: string;
  idealRatio: string;
  minOneChar: string;
  labelProvenance: string;
  labelColors: string;
  labelElement: string;
  labelTotem: string;
  labelMotto: string;
  filterAdultWizards: string;
  editNote: string;
  saveNote: string;
  discardDraftTitle: string;
  discardDraftConfirmBtn: string;
  removeAvatar: string;
  deleteCustomField: string;
  emptyCustomFields: string;
  familiarEditorCardTitle: string;
  familiarEditorCardDescription: string;
  familiarEditorTitle: string;
  familiarEditorSubtitle: string;
  familiarName: string;
  familiarNamePlaceholder: string;
  familiarSpecies: string;
  familiarSpeciesPlaceholder: string;
  familiarDescription: string;
  familiarDescriptionPlaceholder: string;
  familiarValidationError: string;
  familiarSavedToast: string;
  familiarCreateNewBtn: string;
  familiarSaveNewBtn: string;
  confirmFamiliar: string;
  filterFamiliars: string;
  familiarSpeciesShort: string;
  familiarBondLabel: string;
  familiarUnbound: string;
  noDescriptionDefined: string;
  familiarBondSectionTitle: string;
  familiarBondNone: string;
  familiarBondNoneHint: string;
  familiarChangeBond: string;
  familiarUnbind: string;
  familiarBondStudent: string;
  familiarBackToList: string;
  familiarViewDetail: string;
  wizardViewDetail: string;
  tabFamiliarProfile: string;
  tabFamiliarNotes: string;
  familiarNotePlaceholder: string;
  familiarNotesEmpty: string;
  tabFamiliarGallery: string;
  archetypeFamiliar: string;
  bondExistingFamiliar: string;
  createNewFamiliar: string;
  selectFamiliarToBond: string;
  selectFamiliarPlaceholder: string;
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  es: {
    // 1. General UI Elements & Common Labels
    appName: "Magistri Scholae",
    tagline: "Bienvenidos a la escuela",
    searchPlaceholder: "Buscar",
    settings: "Ajustes",
    back: "Volver",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    add: "Añadir",
    noName: "Sin Nombre",
    studentPrefix: "ALUMNO",
    loadingMessage: "Consultando el libro de matrículas…",
    errorStoringStudent: "Error al guardar el personaje.",
    btnFinish: "Finalizar Edición",
    confirmDelete: "Eliminar Personaje permanentemente",
    confirmDeleteTitle: "Confirmar",

    // 2. Navigation Tabs
    perfil: "Perfil",
    sesion: "Sesión",
    habilidades: "Habilidades",
    hechizos: "Conjuros y Pociones",
    notas: "Equipo y Bitácora",
    galeria: "Galería",

    // 3. Student Personal Details & Fields
    nombre: "Nombre del Personaje",
    jugador: "Jugador",
    edad: "Edad",
    casa: "Casa Fundadora",
    curso: "Curso Académico",
    puestoClase: "Puesto en la Clase",
    concepto: "Concepto",
    lema: "Lema de la Casa",
    complicaciones: "Complicaciones",
    linaje: "Linaje Familiar",
    puntosDestino: "Puntos de Destino",
    economia: "Economía",
    varitaSintonia: "Varita o Foco mágico",
    noConceptDefined: "Sin concepto",
    labelVaritaEmpty: "Sin varita vinculada.",

    // 4. Input Field Placeholders
    placeholderNombre: "Leonora Vance",
    requiredKeepsSaved: "No puede quedar vacío; se mantiene el anterior.",
    limitEntries: "entradas",
    limitImages: "imágenes",
    limitReached: "límite alcanzado",
    pickerSearch: "Buscar",
    pickerNoMatch: "Nada coincide con «{q}».",
    pickerDone: "Hecho",
    pickerClose: "Cerrar",
    placeholderJugador: "Miguel Ángel",
    placeholderPuestoClase: "12º",
    placeholderConcepto: "Rastreadora de nieblas con un cuaderno prohibido",
    placeholderLinaje: "Mítico",
    placeholderEconomia: "Precaria",
    placeholderComplicaciones: "Miedo al fuego",
    placeholderVaritaSintonia: "Sauce con núcleo pluma de fénix",

    // 5. Dashboard / List View Elements
    filterAllHouses: "Todas las Casas",
    noCharacters: "¡Crea el primero!",
    addCharacter: "Nuevo Personaje",
    emptyRecords: "Aún no hay personajes",
    lblDestino: "Destino",
    lblExp: "Exp",

    // 6. Character Form Layout, Creation & Section Headers
    studentRegistration: "Registro de Personaje",
    tabIdentification: "Identificación",
    tabAspects: "Aspectos",
    tabHouseMotto: "Casa",
    tabAcademicSkills: "Habilidades",
    tabStress: "Estrés",
    titleBasicRegistry: "Datos y retrato",
    titleHouseHeraldry: "Casa y heráldica",
    titleMaxStress: "Máximos de Estrés",
    titleSkillsExpedient: "Habilidades",
    titleAspectsPossessions: "Aspectos y equipo",
    validationErrorName: "El nombre es obligatorio.",
    validationErrorGeneric: "Por favor, corrige los errores antes de continuar.",
    draftDiscardConfirm: "¿Descartar los cambios? No se guardarán.",
    secDatosAlumno: "Datos Personales",

    // 7. Stress Systems, Counters & Health Labels
    estresFisico: "Estrés Físico",
    estresMental: "Estrés Mental",
    estresSocial: "Estrés Social",
    consecuenciasFisicas: "Consecuencias Físicas",
    consecuenciasMentales: "Consecuencias Mentales",
    consecuenciasSociales: "Consecuencias Sociales",
    pxs: "Experiencia Acumulada",
    placeholderConsecuenciaFisica: "p. ej. Brazo roto",
    placeholderConsecuenciaMental: "p. ej. Pesadillas",
    placeholderConsecuenciaSocial: "p. ej. Mala fama",
    labelMaximo: "MÁXIMO",
    labelMax: "Máx.",
    chooseImage: "Elegir imagen",
    imageExpandedAlt: "Imagen ampliada",
    imageViewerPortrait: "Retrato",
    imageViewerPrev: "Anterior",
    imageViewerNext: "Siguiente",
    imageViewerZoomIn: "Ampliar",
    imageViewerZoomOut: "Reducir",
    imageViewerClose: "Cerrar",
    imageViewerHintPc: "Flechas o ‹ › para cambiar · rueda o doble clic para ampliar · clic para cerrar",
    imageViewerHintTouch: "Desliza para cambiar · pellizca para ampliar · toca o desliza abajo para cerrar",
    crestAlt: "Escudo de la escuela",
    labelSalud: "SANO",
    labelHerido: "HERIDO",
    labelSereno: "INTEGRADO",
    labelAislado: "AISLADO",
    labelCordura: "SERENO",
    labelLocura: "AGITADO",
    labelConsecuenciasFisicasEmpty: "Sin consecuencias.",
    labelConsecuenciasMentalesEmpty: "Sin consecuencias.",
    labelConsecuenciasSocialesEmpty: "Sin consecuencias.",
    countersAndDestiny: "Recursos y Destino",
    decreaseDestiny: "Disminuir destino",
    increaseDestiny: "Aumentar destino",
    noStress: "Sin estrés",
    removeConsequence: "Eliminar consecuencia",
    severity: "Gravedad",
    severityLeve: "Leve",
    severityModerada: "Moderada",
    severityGrave: "Grave",
    severityChoose: "Elegir",
    severityLeveHint: "Puede pasar en la sesión",
    severityModeradaHint: "Pasa tras la sesión",
    severityGraveHint: "No pasa sin medidas",

    // 8. Aspects, Belongings, Clubs & Custom Fields
    aspectosPersonales: "Aspectos Personales",
    equipo: "Equipamiento",
    clubes: "Clubes Escolares",
    customFields: "Campos Personalizados",
    addCustomField: "Añadir campo",
    fieldName: "Nombre del Atributo",
    fieldValue: "Valor",
    deleteAspect: "Eliminar aspecto",
    emptyAspects: "Sin aspectos.",
    addAspect: "Añadir aspecto",
    deleteComplication: "Eliminar complicación",
    emptyComplications: "Sin complicaciones.",
    addComplication: "Añadir complicación",
    deleteItem: "Eliminar objeto",
    emptyInventory: "Sin equipo.",
    addItem: "Añadir objeto",
    addClub: "Añadir club",
    emptyClubs: "Sin clubes.",
    labelQuantity: "Cantidad",
    labelAspectsEmpty: "Sin aspectos.",
    labelAspectosTemporalesEmpty: "Sin aspectos temporales.",
    labelComplicacionesEmpty: "Sin complicaciones.",
    aspectoTemporal: "Aspecto Temporal",
    placeholderAspectoTemporal: "Convertido en sapo",
    placeholderAddAspect: "Nuevo aspecto",
    placeholderAddComplication: "Nueva complicación",
    placeholderAspectExample: "Voluntad de hierro",
    placeholderEquipmentExample: "Capa de invisibilidad",
    placeholderClubes: "Club de Duelo escolar",
    placeholderEquipo: "Reloj de arena",
    confirmDeleteClub: "¿Eliminar este club?",
    confirmDeleteItem: "¿Eliminar este objeto?",

    // 9. Academic Skills & Preset Templates
    removeSkill: "Quitar Habilidad",
    addSkill: "Añadir Habilidad",
    placeholderNewSkillCategory: "Nueva habilidad",
    placeholderNewSkillName: "Nueva habilidad...",
    labelCreationRange: "Rango de creación: 0 a 5",
    addSkillFromList: "Añadir de la lista",
    errSkillExists: 'La habilidad "{name}" ya existe',
    noSkillsInCategory: "Sin habilidades.",

    // 10. Spellbooks, Brews & Grimoires
    specialized: "Especialista",
    level: "Grado",
    placeholderConjuroName: "Revelio",
    placeholderPocionName: "Poción del Olvido",
    labelSpellsEmpty: "GRIMORIO VACÍO",
    labelPotionsEmpty: "ALAMBIQUE SECO",
    confirmDeleteSpell: "¿Eliminar este conjuro?",
    confirmDeletePotion: "¿Eliminar esta poción?",
    grimoireOfSpells: "Grimorio de Conjuros",
    registerNewSpell: "Nuevo conjuro",
    register: "Añadir",
    catalogOfPotions: "Catálogo de Pociones",
    registerNewPotion: "Nueva poción",
    labelDificultad: "Dificultad",

    // 11. Journal / Chronicles Notes
    emptyNotes: "Bitácora vacía.",
    addNote: "Nueva entrada",
    confirmDeleteNote: "¿Eliminar esta entrada?",
    remove: "Quitar",
    confirmDeleteAspect: "¿Eliminar este aspecto?",
    confirmDeleteComplication: "¿Eliminar esta complicación?",
    confirmDeleteCustomField: "¿Eliminar este campo?",
    confirmRemoveConsequence: "¿Eliminar esta consecuencia?",
    confirmRemoveSkill: "¿Quitar esta habilidad de la ficha?",
    confirmRemoveSubject: "¿Quitar esta asignatura?",
    confirmRemovePortrait: "¿Quitar el retrato?",
    placeholderNoteTitle: "Título (opcional)",
    placeholderNoteContent: "Texto de la entrada",
    labelNotesChronicleTitle: "Bitácora Celestial",
    notesLabel: "Entradas",
    registerNote: "Añadir entrada",
    entryFrom: "Entrada del ",

    // 12. Gallery, Portrait Fitting & Cropping
    uploadAvatar: "Subir retrato",
    uploadGallery: "Añadir imagen",
    pasteUrl: "Pegar URL remota",
    galleryInstructions: "Imágenes del personaje",
    labelGalleryEmpty: "Galería vacía",
    confirmDeleteGalleryImage: "¿Eliminar esta imagen?",
    imageUploadError: "No se pudo usar la imagen. Prueba con otro archivo.",
    btnChangePhoto: "Cambiar foto",
    lblAvatarFit: "Ajuste de Retrato",
    optAvatarCover: "Recortar",
    optAvatarContain: "Completa",
    cropHeader: "Recortar retrato",
    cropConfirm: "Confirmar Recorte",
    cropZoom: "Zoom",

    // 13. Settings, Storage, Purging & Backups
    about: "Acerca de",
    aboutDescription: "Aplicación web para organizar y mantener partidas de rol en el universo de Magistri Scholae.",
    storageInfo: "Almacenamiento",
    schoolSealPrefix: "Diseñado con cariño por Serj, en 2026",
    languageSelector: "Seleccionar Idioma",
    settingsCurrentLanguage: "Idioma Actual",
    settingsLanguageExplanation: "Configura el idioma preferido.",
    mockModeBanner: "DEMO — Datos ficticios; nada se guarda en tus fichas.",
    storageLoadError: "No se pudieron cargar los datos. Recarga para reintentar.",
    characterTypeStudent: "Alumno",
    characterTypeStudentDescription: "Alumno de Magistri Scholae perteneciente a una casa fundadora.",
    characterTypeAdultWizard: "Mago adulto",
    characterTypeAdultWizardDescription: "Mago adulto, profesor o personaje mágico externo.",
    adultWizardRegistration: "Registro de Mago Adulto",
    adultWizardProfileSection: "Perfil de Mago Adulto",
    adultWizardRole: "Rol / Título",
    adultWizardInstitution: "Institución",
    adultWizardIsTeacher: "Profesor de la escuela",
    adultWizardTeachingSubjects: "Asignaturas que imparte",
    adultWizardFormerHouse: "Antigua casa",
    adultWizardReputation: "Reputación",
    characterTypeAdultWizardShort: "Adulto",
    characterTypeSelectTitle: "¿A quién registramos hoy?",
    characterTypeSelectDescription: "Elige el tipo de ficha.",
    adultWizardRolePlaceholder: "Investigador de runas",
    adultWizardInstitutionPlaceholder: "Ministerio de dimensiones de bolsillo",
    adultWizardFormerHousePlaceholder: "Irati",
    adultWizardReputationPlaceholder: "Respetado en su gremio",
    placeholderAddSubject: "Nueva asignatura",
    labelNoSubjects: "Sin asignaturas registradas",
    removeSubject: "Quitar asignatura",
    addSubject: "Añadir asignatura",
    yes: "Sí",
    no: "No",
    noPortrait: "SIN RETRATO",
    idealRatio: "Ratio 3:4 Ideal",
    minOneChar: "Mín. 1 letra",
    labelProvenance: "Procedencia",
    labelColors: "Colores",
    labelElement: "Elemento",
    labelTotem: "Tótem",
    labelMotto: "Lema",
    filterAdultWizards: "Magos Adultos",
    editNote: "Editar entrada",
    saveNote: "Guardar cambios",
    discardDraftTitle: "Descartar cambios",
    discardDraftConfirmBtn: "Descartar Cambios",
    removeAvatar: "Quitar retrato",
    deleteCustomField: "Eliminar campo",
    emptyCustomFields: "Sin campos personalizados.",
    familiarEditorCardTitle: "Familiar",
    familiarEditorCardDescription: "Familiares mágicos asignables a los personajes de la escuela.",
    familiarEditorTitle: "Registro de Familiares",
    familiarEditorSubtitle: "Retrato, nombre, especie y descripción del familiar.",
    familiarName: "Nombre del Familiar",
    familiarNamePlaceholder: "Nyx, Bruma, Brasa...",
    familiarSpecies: "Especie / Criatura",
    familiarSpeciesPlaceholder: "Lechuza nival",
    familiarDescription: "Descripción",
    familiarDescriptionPlaceholder: "Apariencia y carácter",
    familiarValidationError: "El nombre y la especie del familiar son obligatorios.",
    familiarSavedToast: "Familiar guardado.",
    familiarCreateNewBtn: "Nuevo Familiar",
    familiarSaveNewBtn: "Guardar Familiar",
    confirmFamiliar: "Confirmar familiar",
    filterFamiliars: "Familiares",
    familiarSpeciesShort: "Especie",
    familiarBondLabel: "Vínculo",
    familiarUnbound: "Sin asignar",
    noDescriptionDefined: "Sin descripción registrada",
    familiarBondSectionTitle: "Vínculo Mágico",
    familiarBondNone: "Sin vínculo",
    familiarBondNoneHint: "No está vinculado a ningún personaje.",
    familiarChangeBond: "Cambiar Vínculo",
    familiarUnbind: "Desvincular",
    familiarBondStudent: "Vincular personaje",
    familiarBackToList: "Volver a Personajes",
    familiarViewDetail: "Ver Ficha de Familiar",
    wizardViewDetail: "Ver Ficha del Personaje",
    tabFamiliarProfile: "Perfil y Vínculo",
    tabFamiliarNotes: "Bitácora del Familiar",
    familiarNotePlaceholder: "Encontró una llave en el jardín",
    familiarNotesEmpty: "Bitácora vacía.",
    tabFamiliarGallery: "Galería de Recuerdos",
    archetypeFamiliar: "Familiar Mágico",
    bondExistingFamiliar: "Vincular",
    createNewFamiliar: "Crear Familiar",
    selectFamiliarToBond: "Elige un personaje.",
    selectFamiliarPlaceholder: "Elige un familiar.",
  },
  en: {
    // 1. General UI Elements & Common Labels
    appName: "Magistri Scholae",
    tagline: "Offline Character Sheet Manager for Magic Academies",
    searchPlaceholder: "Search",
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
    errorStoringStudent: "Error storing character in the database.",
    btnFinish: "Finish Editing",
    confirmDelete: "Permanently Delete Character",
    confirmDeleteTitle: "Confirm Deletion",

    // 2. Navigation Tabs
    perfil: "Profile",
    sesion: "Session Tracker",
    habilidades: "Attributes & Skills",
    hechizos: "Spells & Potions",
    notas: "Character Chronicles",
    galeria: "Photo Vault",

    // 3. Student Personal Details & Fields
    nombre: "Character Name",
    jugador: "Player / Master",
    edad: "Age of admittance",
    casa: "Academy House",
    curso: "School Year",
    puestoClase: "Class Rank / Assignment",
    concepto: "Archetype or Concept",
    lema: "House Motto",
    complicaciones: "Flaws & Hardships",
    linaje: "Heritage / Bloodline",
    puntosDestino: "Destiny Points",
    economia: "Monetary Funds",
    varitaSintonia: "Wand / Magical Focus",
    noConceptDefined: "No concept",
    labelVaritaEmpty: "No linked wand.",

    // 4. Input Field Placeholders
    placeholderNombre: "e.g., Leonora Vance",
    requiredKeepsSaved: "It can't be empty; the previous one stays.",
    limitEntries: "entries",
    limitImages: "images",
    limitReached: "limit reached",
    pickerSearch: "Search",
    pickerNoMatch: "Nothing matches «{q}».",
    pickerDone: "Done",
    pickerClose: "Close",
    placeholderJugador: "e.g., Michael Angel",
    placeholderPuestoClase: "e.g., Prefect, Monitor",
    placeholderConcepto: "e.g. Rebel alchemist",
    placeholderLinaje: "e.g., Pureblood, Mythical",
    placeholderEconomia: "e.g., Normal, Poor, Rich",
    placeholderComplicaciones: "e.g. Afraid of fire",
    placeholderVaritaSintonia: "e.g. Willow and phoenix feather",

    // 5. Dashboard / List View Elements
    filterAllHouses: "All Houses",
    noCharacters: "No characters found. Create the first one!",
    addCharacter: "Add Character",
    emptyRecords: "Empty Records",
    lblDestino: "Destiny",
    lblExp: "Pxs",

    // 6. Character Form Layout, Creation & Section Headers
    studentRegistration: "Register Character",
    tabIdentification: "Identification",
    tabAspects: "Aspects",
    tabHouseMotto: "House",
    tabAcademicSkills: "Academic Skills",
    tabStress: "Stress",
    titleBasicRegistry: "Details and portrait",
    titleHouseHeraldry: "House and heraldry",
    titleMaxStress: "Max Stress Ranges of the Character",
    titleSkillsExpedient: "Skills",
    titleAspectsPossessions: "Aspects and possessions",
    validationErrorName: "The name is required.",
    validationErrorGeneric: "Please fix the form errors before saving.",
    draftDiscardConfirm: "Discard the changes? They won't be saved.",
    secDatosAlumno: "Character Personal Details",

    // 7. Stress Systems, Counters & Health Labels
    estresFisico: "Physical Stress",
    estresMental: "Mental Stress",
    estresSocial: "Social Stress",
    consecuenciasFisicas: "Physical Consequences",
    consecuenciasMentales: "Mental Consequences",
    consecuenciasSociales: "Social Consequences",
    pxs: "Earned Experience (Pxs)",
    placeholderConsecuenciaFisica: "e.g. Broken arm",
    placeholderConsecuenciaMental: "e.g. Nightmares",
    placeholderConsecuenciaSocial: "e.g. Bad name",
    labelMaximo: "MAXIMUM",
    labelMax: "Max",
    chooseImage: "Choose image",
    imageExpandedAlt: "Enlarged image",
    imageViewerPortrait: "Portrait",
    imageViewerPrev: "Previous",
    imageViewerNext: "Next",
    imageViewerZoomIn: "Zoom in",
    imageViewerZoomOut: "Zoom out",
    imageViewerClose: "Close",
    imageViewerHintPc: "Arrows or ‹ › to change · wheel or double-click to zoom · click to close",
    imageViewerHintTouch: "Swipe to change · pinch to zoom · tap or swipe down to close",
    crestAlt: "Academy crest",
    labelSalud: "HEALTH",
    labelHerido: "HURT",
    labelSereno: "SERENE",
    labelAislado: "SHUNNED",
    labelCordura: "SANITY",
    labelLocura: "SHATTERED",
    labelConsecuenciasFisicasEmpty: "No consequences.",
    labelConsecuenciasMentalesEmpty: "No consequences.",
    labelConsecuenciasSocialesEmpty: "No consequences.",
    countersAndDestiny: "Counters & Destiny",
    decreaseDestiny: "Decrease destiny",
    increaseDestiny: "Increase destiny",
    noStress: "No stress",
    removeConsequence: "Remove consequence",
    severity: "Severity",
    severityLeve: "Mild",
    severityModerada: "Moderate",
    severityGrave: "Severe",
    severityChoose: "Choose",
    severityLeveHint: "Can pass during the session",
    severityModeradaHint: "Passes after the session",
    severityGraveHint: "Lasts unless something is done",

    // 8. Aspects, Belongings, Clubs & Custom Fields
    aspectosPersonales: "Personal Aspects / Traits",
    equipo: "Spellbooks & Inventory",
    clubes: "Clubs & Extracurriculars",
    customFields: "Custom Attributes",
    addCustomField: "Add field",
    fieldName: "Attribute Name",
    fieldValue: "Detail or Value",
    deleteAspect: "Delete aspect",
    emptyAspects: "No aspects.",
    addAspect: "Add aspect",
    deleteComplication: "Delete complication",
    emptyComplications: "No complications.",
    addComplication: "Add complication",
    deleteItem: "Delete item",
    emptyInventory: "No equipment.",
    addItem: "Add item",
    addClub: "Register Club",
    emptyClubs: "No clubs.",
    labelQuantity: "Quantity",
    labelAspectsEmpty: "No aspects.",
    labelAspectosTemporalesEmpty: "No active temporary aspects.",
    labelComplicacionesEmpty: "No complications.",
    aspectoTemporal: "Temporary Aspect",
    placeholderAspectoTemporal: "e.g. Turned into a toad",
    placeholderAddAspect: "New aspect",
    placeholderAddComplication: "New complication",
    placeholderAspectExample: "e.g. Iron will",
    placeholderEquipmentExample: "e.g. Invisibility cloak",
    placeholderClubes: "e.g., School Dueling Club (Gold Tier)",
    placeholderEquipo: "e.g. Hourglass",
    confirmDeleteClub: "Delete this club?",
    confirmDeleteItem: "Delete this item?",

    // 9. Academic Skills & Preset Templates
    removeSkill: "Remove Skill",
    addSkill: "Add Skill",
    placeholderNewSkillCategory: "New skill",
    placeholderNewSkillName: "New skill name...",
    labelCreationRange: "Creation range: 0 to 5",
    addSkillFromList: "Add from the list",
    errSkillExists: 'Skill "{name}" already exists',
    noSkillsInCategory: "No skills.",

    // 10. Spellbooks, Brews & Grimoires
    specialized: "Specialist",
    level: "Grade",
    placeholderConjuroName: "e.g., Ignis Fatuus",
    placeholderPocionName: "e.g. Calming draught",
    labelSpellsEmpty: "NO SPELLS INDEXED",
    labelPotionsEmpty: "NO POTIONS INDEXED",
    confirmDeleteSpell: "Delete this spell?",
    confirmDeletePotion: "Delete this formula?",
    grimoireOfSpells: "Grimoire of Spells",
    registerNewSpell: "New spell",
    register: "Register",
    catalogOfPotions: "Laboratory Potions",
    registerNewPotion: "New potion",
    labelDificultad: "Difficulty",

    // 11. Journal / Chronicles Notes
    emptyNotes: "Empty journal.",
    addNote: "Add note",
    confirmDeleteNote: "Delete this note?",
    remove: "Remove",
    confirmDeleteAspect: "Delete this aspect?",
    confirmDeleteComplication: "Delete this complication?",
    confirmDeleteCustomField: "Delete this field?",
    confirmRemoveConsequence: "Delete this consequence?",
    confirmRemoveSkill: "Remove this skill from the sheet?",
    confirmRemoveSubject: "Remove this subject?",
    confirmRemovePortrait: "Remove the portrait?",
    placeholderNoteTitle: "Title (optional)",
    placeholderNoteContent: "Note text",
    labelNotesChronicleTitle: "Celestial Journal",
    notesLabel: "Notes",
    registerNote: "Register Note",
    entryFrom: "Entry from ",

    // 12. Gallery, Portrait Fitting & Cropping
    uploadAvatar: "Upload portrait",
    uploadGallery: "Add image",
    pasteUrl: "Paste internet link",
    galleryInstructions: "The character's images",
    labelGalleryEmpty: "Empty gallery",
    confirmDeleteGalleryImage: "Delete this image?",
    imageUploadError: "The image could not be used. Try another file.",
    btnChangePhoto: "Change photo",
    lblAvatarFit: "Portrait Fit",
    optAvatarCover: "Crop",
    optAvatarContain: "Whole",
    cropHeader: "Crop portrait",
    cropConfirm: "Confirm Crop",
    cropZoom: "Zoom",

    // 13. Settings, Storage, Purging & Backups
    about: "About",
    aboutDescription: "Character sheets for magic academy games.",
    storageInfo: "Storage",
    schoolSealPrefix: "School Seal — Magistri Scholae 2026",
    languageSelector: "Select Language",
    settingsCurrentLanguage: "Current Language",
    settingsLanguageExplanation: "Configure the wizarding interface preferred language.",
    mockModeBanner: "DEMO — Fictional data; nothing is saved to your sheets.",
    storageLoadError: "Could not load your data. Reload to retry.",
    characterTypeStudent: "Student",
    characterTypeStudentDescription: "Student of Magistri Scholae belonging to a founding house.",
    characterTypeAdultWizard: "Adult Wizard",
    characterTypeAdultWizardDescription: "Adult wizard, teacher, or external magical character.",
    adultWizardRegistration: "Adult Wizard Registration",
    adultWizardProfileSection: "Adult Wizard Profile",
    adultWizardRole: "Role / Title",
    adultWizardInstitution: "Institution",
    adultWizardIsTeacher: "Academy Teacher",
    adultWizardTeachingSubjects: "Teaching Subjects",
    adultWizardFormerHouse: "Former House",
    adultWizardReputation: "Reputation / Status",
    characterTypeAdultWizardShort: "Adult",
    characterTypeSelectTitle: "Choose Magical Path",
    characterTypeSelectDescription: "Choose the sheet type.",
    adultWizardRolePlaceholder: "e.g. Rune researcher",
    adultWizardInstitutionPlaceholder: "E.g. Ministry of Magic",
    adultWizardFormerHousePlaceholder: "E.g. Irati, Urania",
    adultWizardReputationPlaceholder: "e.g. Respected in their guild",
    placeholderAddSubject: "New subject",
    labelNoSubjects: "No subjects recorded",
    removeSubject: "Remove subject",
    addSubject: "Add subject",
    yes: "Yes",
    no: "No",
    noPortrait: "NO PORTRAIT",
    idealRatio: "3:4 Ideal Ratio",
    minOneChar: "Min. 1 char",
    labelProvenance: "Provenance",
    labelColors: "Colors",
    labelElement: "Element",
    labelTotem: "Totem",
    labelMotto: "Motto",
    filterAdultWizards: "Adult Wizards",
    editNote: "Edit note",
    saveNote: "Save changes",
    discardDraftTitle: "Discard Draft",
    discardDraftConfirmBtn: "Discard Changes",
    removeAvatar: "Remove portrait",
    deleteCustomField: "Delete field",
    emptyCustomFields: "No custom fields.",
    familiarEditorCardTitle: "Familiar Editor",
    familiarEditorCardDescription: "Create and manage magical familiars assignable to academy students.",
    familiarEditorTitle: "Familiar Register",
    familiarEditorSubtitle: "Forge the arcane bond: portrait, name, species, and description of the familiar.",
    familiarName: "Familiar Name",
    familiarNamePlaceholder: "e.g. Nyx, Archimedes, Mist...",
    familiarSpecies: "Species / Creature",
    familiarSpeciesPlaceholder: "e.g. Snowy owl",
    familiarDescription: "Description",
    familiarDescriptionPlaceholder: "e.g. Looks and temperament",
    familiarValidationError: "Both the familiar's name and species are required.",
    familiarSavedToast: "Familiar saved.",
    familiarCreateNewBtn: "New Familiar",
    familiarSaveNewBtn: "Save Familiar",
    confirmFamiliar: "Confirm familiar",
    filterFamiliars: "Familiars",
    familiarSpeciesShort: "Species",
    familiarBondLabel: "Bond",
    familiarUnbound: "Unbound",
    noDescriptionDefined: "No description recorded",
    familiarBondSectionTitle: "Magical Bond",
    familiarBondNone: "No bond",
    familiarBondNoneHint: "Not linked to any character.",
    familiarChangeBond: "Change Bond",
    familiarUnbind: "Unbind",
    familiarBondStudent: "Link character",
    familiarBackToList: "Back to Characters",
    familiarViewDetail: "View Familiar Sheet",
    wizardViewDetail: "View Wizard Sheet",
    tabFamiliarProfile: "Profile & Bond",
    tabFamiliarNotes: "Familiar's Journal",
    familiarNotePlaceholder: "e.g. Found a key in the garden",
    familiarNotesEmpty: "No notes.",
    tabFamiliarGallery: "Memory Gallery",
    archetypeFamiliar: "Magical Familiar",
    bondExistingFamiliar: "Link",
    createNewFamiliar: "Create Familiar",
    selectFamiliarToBond: "Choose a character.",
    selectFamiliarPlaceholder: "Choose a familiar.",
  },
};

export interface LocalizedHouseLore {
  procedencia: string;
  colores: string;
  elemento: string;
  totem: string;
  lema: string;
}

export const HOUSE_LORE: Record<Language, Record<string, LocalizedHouseLore>> = {
  es: {
    IRATI: {
      procedencia: "Navarra",
      colores: "Verde y Negro",
      elemento: "Aire",
      totem: "Mochuelo boreal",
      lema: "Creer es ver",
    },
    URANIA: {
      procedencia: "Castilla",
      colores: "Mostaza y Azul",
      elemento: "Tierra",
      totem: "Toro",
      lema: "Ni por esperanza ni por miedo",
    },
    "AL-KHWARIZMI": {
      procedencia: "Al-Ándalus",
      colores: "Violeta y Dorado",
      elemento: "Fuego",
      totem: "Lince ibérico",
      lema: "El conocimiento es la puerta",
    },
    CALANTES: {
      procedencia: "Portugal",
      colores: "Añil y Blanco",
      elemento: "Agua",
      totem: "Pulpo",
      lema: "El horizonte como límite",
    },
    ALEIXIS: {
      procedencia: "Aragón",
      colores: "Plata y Granate",
      elemento: "Metal",
      totem: "Lobo ibérico",
      lema: "Mérito obliga",
    },
  },
  en: {
    IRATI: {
      procedencia: "Navarre",
      colores: "Green and Black",
      elemento: "Air",
      totem: "Boreal Owl",
      lema: "To believe is to see",
    },
    URANIA: {
      procedencia: "Castile",
      colores: "Mustard and Blue",
      elemento: "Earth",
      totem: "Bull",
      lema: "Neither by hope nor by fear",
    },
    "AL-KHWARIZMI": {
      procedencia: "Al-Andalus",
      colores: "Violet and Gold",
      elemento: "Fire",
      totem: "Iberian Lynx",
      lema: "Knowledge is the gateway",
    },
    CALANTES: {
      procedencia: "Portugal",
      colores: "Indigo and White",
      elemento: "Water",
      totem: "Octopus",
      lema: "The horizon as the limit",
    },
    ALEIXIS: {
      procedencia: "Aragon",
      colores: "Silver and Garnet",
      elemento: "Metal",
      totem: "Iberian Wolf",
      lema: "Merit obliges",
    },
  },
};

export const getLocalizedHouseLore = (houseKey: string, lang: Language): LocalizedHouseLore => {
  const key = (houseKey || "IRATI").toUpperCase();
  return HOUSE_LORE[lang][key] || HOUSE_LORE[lang].IRATI;
};

export const translateHouseMotto = (motto: string, lang: Language): string => {
  if (!motto) return "";
  const trimmed = motto.trim().toLowerCase();
  for (const hKey of Object.keys(HOUSE_LORE.es)) {
    const esMotto = HOUSE_LORE.es[hKey].lema;
    const enMotto = HOUSE_LORE.en[hKey].lema;
    if (trimmed === esMotto.toLowerCase() || trimmed === enMotto.toLowerCase()) {
      return HOUSE_LORE[lang][hKey].lema;
    }
  }
  return motto;
};

const SKILL_PAIRS: Array<{ es: string; en: string }> = [
  // Físicas / Physical
  { es: "Atletismo", en: "Athletics" },
  { es: "Físico", en: "Physique" },
  { es: "Deportes", en: "Sports" },
  { es: "Sigilo", en: "Stealth" },
  { es: "Prestidigitación", en: "Sleight of Hand" },
  { es: "Duelo", en: "Dueling" },
  { es: "Supervivencia", en: "Survival" },
  // Mentales / Mental
  { es: "Investigar", en: "Investigate" },
  { es: "Percepción", en: "Perception" },
  { es: "Voluntad", en: "Willpower" },
  { es: "Espiritismo", en: "Spiritualism" },
  { es: "Empatía", en: "Empathy" },
  // Sociales / Social
  { es: "Contactos", en: "Contacts" },
  { es: "Provocar", en: "Provoke" },
  { es: "Carisma", en: "Charisma" },
  { es: "Engaño", en: "Deception" },
  // Asignaturas Troncales / Core Curriculum
  { es: "Transmutación", en: "Transmutation" },
  { es: "Pociones", en: "Potions" },
  { es: "Historia del mundo mágico", en: "History of Magic" },
  { es: "Herbología", en: "Herbology" },
  { es: "Astronomía", en: "Astronomy" },
  { es: "Trivium", en: "Trivium" },
  { es: "Quadrivium", en: "Quadrivium" },
  { es: "Cábala", en: "Kabbalah" },
  { es: "Simpática", en: "Sympathetic Magic" },
  { es: "Hermética", en: "Hermetics" },
  // Asignaturas Optativas / Elective Subjects
  { es: "Seres mágicos", en: "Magical Creatures" },
  { es: "Magia druídica", en: "Druidic Magic" },
  { es: "Arte", en: "Art" },
  { es: "Conocimiento muggle", en: "Muggle Studies" },
  { es: "Oráculo", en: "Oracle & Divination" },
  { es: "Quimerismo", en: "Chimerism" },
  { es: "Musología", en: "Museology" },
  { es: "Numerología", en: "Numerology" },
  { es: "Espejismo", en: "Mirage & Illusion" },
  { es: "Climática", en: "Weather Magic" },
  { es: "Entropía", en: "Entropy" },
  { es: "Cronomancia", en: "Chronomancy" },
  { es: "Sanación", en: "Healing" },
];

export const translateSkillName = (skillName: string, lang: Language): string => {
  if (!skillName) return "";
  const lower = skillName.trim().toLowerCase();
  const match = SKILL_PAIRS.find(
    (p) => p.es.toLowerCase() === lower || p.en.toLowerCase() === lower
  );
  if (match) {
    return match[lang];
  }
  return skillName;
};

export const canonicalizeSkillName = (skillName: string): string => {
  if (!skillName) return "";
  const lower = skillName.trim().toLowerCase();
  const match = SKILL_PAIRS.find(
    (p) => p.es.toLowerCase() === lower || p.en.toLowerCase() === lower
  );
  return match ? match.es : skillName.trim();
};

export const areSameSkill = (a: string, b: string): boolean => {
  return canonicalizeSkillName(a).toLowerCase() === canonicalizeSkillName(b).toLowerCase();
};

// Screen texts kept as their own tables (polish pass, 9 November 2026): every
// player-facing text lives in this file.

/** The GM's «Habilidades de la campaña» screen. */
export const CAMPAIGN_SKILLS_TEXT: Record<Language, {
  title: string; intro: string; initial: string; initialHint: string; newSkill: string; add: string;
  save: string; discard: string; unsaved: string; duplicate: string; blank: string; ageLimit: string;
  saved: string; conflict: string; failed: string; open: string; openHint: string;
}> = {
  es: {
    title: "Habilidades de la campaña",
    intro: "La lista de habilidades de esta campaña, compartida por todas sus partidas. Las marcadas como «Inicial» aparecen en los personajes nuevos; los jugadores añaden las demás con «+ Añadir de la lista». Solo tú puedes cambiar esta lista.",
    initial: "Inicial",
    initialHint: "Los personajes nuevos empiezan con esta habilidad",
    newSkill: "Nueva habilidad en esta categoría…",
    add: "Añadir",
    save: "Guardar cambios",
    discard: "Descartar",
    unsaved: "Hay cambios sin guardar.",
    duplicate: "Hay dos habilidades con el mismo nombre: «{name}».",
    blank: "Cada habilidad necesita un nombre.",
    ageLimit: "hasta {age} años",
    saved: "Lista de habilidades guardada.",
    conflict: "Otra persona cambió la lista de habilidades; se ha vuelto a cargar. Repite el cambio.",
    failed: "No se pudo guardar la lista de habilidades.",
    open: "Abrir la lista",
    openHint: "Qué habilidades tiene esta campaña y con cuáles empiezan los personajes nuevos.",
  },
  en: {
    title: "Campaign skills",
    intro: "This universe's skill list, shared by all its tables. Skills marked «Starting» appear on new characters; players add the rest with «+ Add from the list». Only you can change this list.",
    initial: "Starting",
    initialHint: "New characters start with this skill",
    newSkill: "New skill in this category…",
    add: "Add",
    save: "Save changes",
    discard: "Discard",
    unsaved: "There are unsaved changes.",
    duplicate: "Two skills share the name «{name}».",
    blank: "Every skill needs a name.",
    ageLimit: "up to age {age}",
    saved: "Skill list saved.",
    conflict: "Someone else changed the skill list; it has been reloaded. Please repeat your change.",
    failed: "The skill list could not be saved.",
    open: "Open the list",
    openHint: "Which skills this universe has, and which ones new characters start with.",
  },
};

/** The save-status panel. */
/** The save panel (R3.5 step 1): plain words, never a stored path, a code or JSON; see src/account/saveMessages.ts. */
export const SAVE_STATUS_TEXT = {
  es: {
    offline: "Sin conexión. Tus cambios se guardan aquí y se enviarán al volver la conexión.",
    waiting: "Cambios esperando: {n}.",
    conflict: "Otra persona cambió esto mientras lo editabas. Elige qué valor conservar:",
    mine: "Tu valor",
    theirs: "Su valor",
    keepMine: "Mantener el mío",
    keepTheirs: "Mantener el suyo",
    notSaved: "No se guardó este cambio.",
    fixHint: "Corrígelo y se guardará solo.",
    retryNow: "Reintentar ahora",
    dropped: "Estos cambios se descartaron porque ya no puedes editarlos: {fields}.",
    dismiss: "Entendido",
    empty: "(vacío)",
    yes: "Sí",
    no: "No",
    entries: "{n} entradas",
    anEntry: "una entrada",
    ruleRequired: "{field}: no puede quedar vacío.",
    ruleMaxLength: "{field}: admite como máximo {n} caracteres.",
    ruleMaxItems: "{field}: admite como máximo {n} entradas.",
    ruleRange: "{field}: debe estar entre {min} y {max}.",
    ruleNotAboveMaximum: "{field}: no puede superar su máximo.",
    ruleChoice: "{field}: no es una de las opciones.",
    ruleNotWritable: "{field}: no puedes cambiarlo.",
    ruleRequireOneOf: "{field}: necesita un título o un texto.",
    ruleInvalid: "{field}: el valor no es válido.",
    sheetFull: "La ficha ha llegado a su tamaño máximo. Quita algo, como imágenes o notas, antes de añadir más.",
    noAccess: "Ya no puedes cambiar esta ficha.",
    notFound: "Esta ficha ya no está disponible para ti.",
    entryGone: "Esa entrada ya no existe: alguien la quitó.",
    archived: "Esta ficha está archivada y ya no se puede cambiar.",
    gmOnlySkill: "Solo el Máster puede crear o cambiar habilidades propias.",
    signedOut: "Tu sesión ha terminado. Vuelve a iniciar sesión.",
    rateLimited: "Demasiados cambios seguidos. Se reintentará en unos segundos.",
    connection: "No hay conexión con el servidor. Se reintentará solo.",
    refusedOther: "El servidor no aceptó el cambio.",
  },
  en: {
    offline: "Offline. Your changes are kept here and sent when the connection returns.",
    waiting: "Changes waiting: {n}.",
    conflict: "Someone else changed this while you were editing it. Choose which value to keep:",
    mine: "Yours",
    theirs: "Theirs",
    keepMine: "Keep mine",
    keepTheirs: "Keep theirs",
    notSaved: "This change was not saved.",
    fixHint: "Correct it and it will save by itself.",
    retryNow: "Retry now",
    dropped: "These changes were discarded because you can no longer edit them: {fields}.",
    dismiss: "Got it",
    empty: "(empty)",
    yes: "Yes",
    no: "No",
    entries: "{n} entries",
    anEntry: "an entry",
    ruleRequired: "{field}: cannot be empty.",
    ruleMaxLength: "{field}: at most {n} characters.",
    ruleMaxItems: "{field}: at most {n} entries.",
    ruleRange: "{field}: must be between {min} and {max}.",
    ruleNotAboveMaximum: "{field}: cannot exceed its maximum.",
    ruleChoice: "{field}: not one of the options.",
    ruleNotWritable: "{field}: you cannot change it.",
    ruleRequireOneOf: "{field}: needs a title or a text.",
    ruleInvalid: "{field}: the value is not valid.",
    sheetFull: "The sheet has reached its maximum size. Remove something, such as images or notes, before adding more.",
    noAccess: "You can no longer change this sheet.",
    notFound: "This sheet is no longer available to you.",
    entryGone: "That entry no longer exists: someone removed it.",
    archived: "This sheet is archived and can no longer be changed.",
    gmOnlySkill: "Only the GM can create or change custom skills.",
    signedOut: "Your session has ended. Sign in again.",
    rateLimited: "Too many changes in a row. It will retry in a few seconds.",
    connection: "No connection to the server. It will retry by itself.",
    refusedOther: "The server did not accept the change.",
  },
};

/** Field names for the save panel, in the sheet's own words (most come from TRANSLATIONS). */
const fieldLabels = (t: TranslationDict, own: { spells: string; potions: string; sheetType: string; portrait: string; portraitFit: string; maxOf: string; teacher: string; sheet: string }) => ({
  sheet: own.sheet,
  fields: {
    nombre: t.nombre, characterType: own.sheetType, concepto: t.concepto, jugador: t.jugador, edad: t.edad, curso: t.curso,
    puestoClase: t.puestoClase, casa: t.casa, linaje: t.linaje, economia: t.economia, varitaSintonia: t.varitaSintonia,
    adultWizardProfile: t.adultWizardProfileSection, "adultWizardProfile/role": t.adultWizardRole,
    "adultWizardProfile/institution": t.adultWizardInstitution, "adultWizardProfile/reputation": t.adultWizardReputation,
    "adultWizardProfile/formerHouse": t.adultWizardFormerHouse, "adultWizardProfile/isTeacher": own.teacher,
    "adultWizardProfile/teachingSubjects": t.adultWizardTeachingSubjects,
    aspectosPersonales: t.aspectosPersonales, complicaciones: t.complicaciones, camposPersonalizados: t.customFields,
    puntosDestino: t.puntosDestino, pxs: t.pxs, estresFisico: t.estresFisico, estresMental: t.estresMental, estresSocial: t.estresSocial,
    estresFisicoMax: own.maxOf.replace("{x}", t.estresFisico), estresMentalMax: own.maxOf.replace("{x}", t.estresMental),
    estresSocialMax: own.maxOf.replace("{x}", t.estresSocial), aspectoTemporal: t.aspectoTemporal,
    consecuenciasFisicas: t.consecuenciasFisicas, consecuenciasMentales: t.consecuenciasMentales, consecuenciasSociales: t.consecuenciasSociales,
    habilidades: t.habilidades, conjuros: own.spells, pociones: own.potions, clubesList: t.clubes, equipoList: t.equipo,
    notasList: t.labelNotesChronicleTitle, avatarImage: own.portrait, avatarFit: own.portraitFit, galleryImages: t.galeria,
    especie: t.familiarSpeciesShort, descripcion: t.familiarDescription, imagen: own.portrait, imageFit: own.portraitFit,
  },
  /** Labels that differ by sheet kind. */
  byKind: { character: {}, familiar: { nombre: t.familiarName, notasList: t.tabFamiliarNotes } } as Record<"character" | "familiar", Record<string, string>>,
  itemFields: {} as Record<string, string>,
});

export const FIELD_LABELS = {
  es: { ...fieldLabels(TRANSLATIONS.es, { spells: "Conjuros", potions: "Pociones", sheetType: "Tipo de ficha", portrait: "Retrato", portraitFit: "Ajuste del retrato", maxOf: "Máximo de {x}", teacher: "Profesor", sheet: "La ficha" }),
    itemFields: { nombre: "nombre", valor: "valor", value: "texto", contenido: "texto", titulo: "título", cantidad: "cantidad", descripcion: "descripción", gravedad: "gravedad", categoria: "categoría", catalogo: "habilidad", conocimiento: "conocimiento", specialized: "especialización", fecha: "fecha" } as Record<string, string> },
  en: { ...fieldLabels(TRANSLATIONS.en, { spells: "Spells", potions: "Potions", sheetType: "Sheet type", portrait: "Portrait", portraitFit: "Portrait fit", maxOf: "Maximum {x}", teacher: "Teacher", sheet: "The sheet" }),
    itemFields: { nombre: "name", valor: "value", value: "text", contenido: "text", titulo: "title", cantidad: "quantity", descripcion: "description", gravedad: "severity", categoria: "category", catalogo: "skill", conocimiento: "knowledge", specialized: "specialization", fecha: "date" } as Record<string, string> },
};

/** Plain-language messages for the server's account errors. */
export const SIGN_IN_ERRORS: Record<Language, Record<string, string>> = {
  es: {
    invalid_credentials: "Usuario o contraseña incorrectos.",
    rate_limited: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
    invalid_invitation: "El código de invitación no es válido, ya se usó o ha caducado.",
    invalid_reset_code: "El código de recuperación no es válido, ya se usó o ha caducado.",
    username_unavailable: "Ese nombre de usuario ya está en uso. Elige otro.",
    invalid_password: "La contraseña es demasiado débil o se parece a tu usuario. Usa al menos 12 caracteres variados.",
    invalid_account_state: "Esta cuenta está desactivada. Habla con la administración.",
    network_error: "No hay conexión con el servidor. Comprueba tu conexión y vuelve a intentarlo.",
    password_mismatch: "Las dos contraseñas no coinciden. Escríbelas de nuevo.",
  },
  en: {
    invalid_credentials: "Wrong username or password.",
    rate_limited: "Too many attempts. Wait a few minutes and try again.",
    invalid_invitation: "The invitation code is not valid, was already used or has expired.",
    invalid_reset_code: "The reset code is not valid, was already used or has expired.",
    username_unavailable: "That username is taken. Choose another.",
    invalid_password: "The password is too weak or too close to your username. Use at least 12 varied characters.",
    invalid_account_state: "This account is disabled. Contact the administrator.",
    network_error: "The server cannot be reached. Check your connection and try again.",
    password_mismatch: "The two passwords do not match. Type them again.",
  },
};

/** Account screens (sign-in, invitations, reset) and texts kept for R3.5's personal notes. */
export const remoteText = {
  en: {
    login: "Sign in",
    logout: "Sign out",
    username: "Username",
    password: "Password",
    repeatPassword: "Repeat the password",
    register: "Accept invitation",
    invitation: "Invitation token",
    reset: "Reset password",
    code: "Reset code",
    campaign: "Campaign",
    choose: "Choose a campaign",
    failed: "Request failed",
    registered: "Account created. Sign in to continue.",
    resetDone: "Password updated. Sign in again.",
    noCampaign: "No campaign memberships yet. Ask the administrator for an invitation.",
  },
  es: {
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
    username: "Usuario",
    password: "Contraseña",
    repeatPassword: "Repite la contraseña",
    register: "Aceptar invitación",
    invitation: "Código de invitación",
    reset: "Restablecer contraseña",
    code: "Código de recuperación",
    campaign: "Campaña",
    choose: "Elige una campaña",
    failed: "La solicitud ha fallado",
    registered: "Cuenta creada. Inicia sesión para continuar.",
    resetDone: "Contraseña actualizada. Vuelve a iniciar sesión.",
    noCampaign: "Aún no perteneces a ninguna campaña. Pide una invitación al administrador.",
  },
};

/** Esoteric knowledge levels: the tag shows the level; what it allows is a second line in the menu only. */
export const KNOWLEDGE_TEXT: Record<Language, { label: string; none: string; empty: string } & Record<"basico" | "medio" | "avanzado", string> & Record<"basicoHint" | "medioHint" | "avanzadoHint", string>> = {
  es: { label: "Conocimiento", none: "Sin conocimiento", empty: "Ninguno", basico: "Básico", medio: "Medio", avanzado: "Avanzado",
    basicoHint: "Alteración", medioHint: "Destrucción", avanzadoHint: "Creación" },
  en: { label: "Knowledge", none: "No knowledge", empty: "None", basico: "Basic", medio: "Medium", avanzado: "Advanced",
    basicoHint: "Alteration", medioHint: "Destruction", avanzadoHint: "Creation" },
};

/** The settings screen. */
export const SETTINGS_TEXT: Record<Language, {
  storageNote: string;
  accountTitle: string;
  campaignLabel: string;
  logout: string;
}> = {
  es: {
    storageNote: "Tus fichas se guardan en el servidor de la campaña. Este navegador solo guarda tus preferencias.",
    accountTitle: "Cuenta",
    campaignLabel: "Campaña",
    logout: "Cerrar sesión",
  },
  en: {
    storageNote: "Your sheets are stored on the campaign's server. This browser only keeps your preferences.",
    accountTitle: "Account",
    campaignLabel: "Campaign",
    logout: "Sign out",
  },
};

/** Archiving a character (the GM's replacement for deleting). */
export const CHARACTER_ARCHIVE_TEXT = {
  es: {
    button: "Archivar",
    title: "Archivar personaje",
    text: "¿Seguro que quieres archivar a este personaje? Dejará de aparecer en la campaña; su ficha, bitácora, galería, conjuros, pociones y equipo se conservan.",
    checkbox: "Entiendo que el personaje dejará de estar visible en la campaña.",
    confirm: "Archivar",
  },
  en: {
    button: "Archive",
    title: "Archive character",
    text: "Are you sure you want to archive this character? It will no longer appear in the campaign; its sheet, journal, gallery, spells, potions and belongings are kept.",
    checkbox: "I understand the character will no longer be visible in the campaign.",
    confirm: "Archive",
  },
} as const;

/** Archiving a familiar, and its bond error. */
export const FAMILIAR_ARCHIVE_TEXT = {
  es: {
    button: "Archivar",
    title: "Archivar familiar",
    prompt: "¿Seguro que quieres archivar a este familiar? Dejará de aparecer en la campaña; su ficha, bitácora y galería se conservan.",
    checkbox: "Entiendo que el familiar dejará de estar visible en la campaña.",
    confirm: "Archivar",
    bondError: "No se pudo cambiar el vínculo.",
  },
  en: {
    button: "Archive",
    title: "Archive familiar",
    prompt: "Are you sure you want to archive this familiar? It will no longer appear in the campaign; its sheet, notes and gallery are kept.",
    checkbox: "I understand the familiar will no longer be visible in the campaign.",
    confirm: "Archive",
    bondError: "Could not change the bond.",
  },
};

/** Creating a character failed. */
export const SAVE_FAILED_TEXT = { es: "No se pudo guardar el personaje", en: "Could not save the character" } as const;

/** Private notes, «Mover a la bitácora» and «Mis notas» (R3.5; product-design.md, Notes). */
export const NOTES_TEXT = {
  es: {
    privateTitle: "Notas privadas",
    onlyYou: "Solo tú las ves. Ni el Máster puede leerlas.",
    onlyYouGM: "Solo tú las ves. Los jugadores no pueden leerlas.",
    newNote: "Nueva nota privada",
    empty: "Sin notas privadas sobre esta ficha.",
    titlePlaceholder: "Título (opcional)",
    textPlaceholder: "Solo tú lo verás",
    savedAsYouType: "Se guarda mientras escribes",
    done: "Listo",
    edit: "Editar",
    move: "Mover a la bitácora",
    moveToAJournal: "Mover a una bitácora",
    delete: "Eliminar nota",
    confirmDelete: "¿Eliminar esta nota privada?",
    noteOf: "Nota del {date}",
    noText: "Sin texto",
    saveFailed: "No se pudo guardar la nota. Se reintentará al seguir escribiendo.",
    changedElsewhere: "Esta nota cambió en otro dispositivo; se ha recargado.",
    loadFailed: "No se pudieron cargar tus notas privadas.",
    moveTitle: "Mover a la {journal} de {sheet}",
    readersIntro: "Después de moverla, la leerán:",
    readerGM: "el Máster",
    readerYouGM: "tú, como Máster",
    readerYouPlayer: "tú, como jugador asignado",
    readerAssigned: "{name}, que tiene la ficha asignada",
    readerAssignedUnnamed: "quien tenga la ficha asignada",
    readerShared: "quien tenga la ficha compartida para leer",
    gmReveal: "{name} podrá leerla: es una forma de revelarle algo.",
    gmRevealUnnamed: "Quien tenga la ficha asignada podrá leerla: es una forma de revelarle algo.",
    dateLabel: "Fecha de la entrada",
    useWritten: "Usar cuándo se escribió ({when})",
    disappears: "La nota privada desaparece: queda solo en la bitácora.",
    moveBtn: "Mover",
    moved: "Movida a la {journal} de {sheet}.",
    checking: "Comprobando…",
    moveFailed: "No se pudo mover la nota.",
    whichSheet: "¿A la bitácora de qué ficha?",
    notTied: "Esta nota no está ligada a ninguna ficha.",
    myNotes: "Mis notas",
    myNotesIntro: "Solo tú las ves, también las que no son de ninguna ficha.",
    noSheet: "Sin ficha",
    newNoSheet: "Nueva nota sin ficha",
    noNotes: "No tienes notas privadas.",
    openSheet: "Abrir ficha",
    back: "Volver",
    day: "Día",
    hour: "Hora",
    minute: "Minutos",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
  },
  en: {
    privateTitle: "Private notes",
    onlyYou: "Only you see them. Not even the GM can read them.",
    onlyYouGM: "Only you see them. Players cannot read them.",
    newNote: "New private note",
    empty: "No private notes about this sheet.",
    titlePlaceholder: "Title (optional)",
    textPlaceholder: "Only you will see it",
    savedAsYouType: "Saved as you type",
    done: "Done",
    edit: "Edit",
    move: "Move to the journal",
    moveToAJournal: "Move to a journal",
    delete: "Delete note",
    confirmDelete: "Delete this private note?",
    noteOf: "Note of {date}",
    noText: "No text",
    saveFailed: "The note could not be saved. It will retry as you keep typing.",
    changedElsewhere: "This note changed on another device; it has been reloaded.",
    loadFailed: "Your private notes could not be loaded.",
    moveTitle: "Move to the {journal} of {sheet}",
    readersIntro: "Once moved, it will be read by:",
    readerGM: "the GM",
    readerYouGM: "you, as GM",
    readerYouPlayer: "you, as the assigned player",
    readerAssigned: "{name}, who has the sheet assigned",
    readerAssignedUnnamed: "whoever has the sheet assigned",
    readerShared: "whoever the sheet is shared with for reading",
    gmReveal: "{name} will be able to read it: a way to reveal something.",
    gmRevealUnnamed: "Whoever has the sheet assigned will be able to read it: a way to reveal something.",
    dateLabel: "Date of the entry",
    useWritten: "Use when it was written ({when})",
    disappears: "The private note disappears: it stays only in the journal.",
    moveBtn: "Move",
    moved: "Moved to the {journal} of {sheet}.",
    checking: "Checking…",
    moveFailed: "The note could not be moved.",
    whichSheet: "To which sheet's journal?",
    notTied: "This note is not tied to any sheet.",
    myNotes: "My notes",
    myNotesIntro: "Only you see them, including those about no sheet.",
    noSheet: "No sheet",
    newNoSheet: "New note about no sheet",
    noNotes: "You have no private notes.",
    openSheet: "Open sheet",
    back: "Back",
    day: "Day",
    hour: "Hour",
    minute: "Minutes",
    prevMonth: "Previous month",
    nextMonth: "Next month",
  },
};
