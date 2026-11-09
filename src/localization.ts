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
  mockModeBanner: string;
  storageLoadError: string;
  importBondWarnings: string;
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
  addSkillFromList: string;
  errSkillExists: string;
  noSkillsInCategory: string;

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
  importAction: string;
  downloadAction: string;
  selectAtLeastOneError: string;
  noMatchingStudents: string;
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
  familiarDeletedToast: string;
  familiarGalleryTitle: string;
  familiarGalleryEmpty: string;
  familiarCreateNewBtn: string;
  familiarUpdateBtn: string;
  familiarSaveNewBtn: string;
  confirmFamiliar: string;
  familiarOpenEditorBtn: string;
  familiarConfirmDelete: string;
  filterFamiliars: string;
  familiarSpeciesShort: string;
  familiarBondLabel: string;
  familiarUnbound: string;
  noDescriptionDefined: string;
  familiarDetailTitle: string;
  familiarBondSectionTitle: string;
  familiarBondWithWizard: string;
  familiarBondNone: string;
  familiarChangeBond: string;
  familiarUnbind: string;
  familiarBondStudent: string;
  familiarSelectMasterPlaceholder: string;
  familiarEditInEditor: string;
  familiarQuickEdit: string;
  familiarBackToList: string;
  familiarDeleteTitle: string;
  familiarDeletePrompt: string;
  familiarDeleteConfirmBtn: string;
  familiarSavedInlineToast: string;
  familiarViewDetail: string;
  wizardViewDetail: string;
  tabFamiliarProfile: string;
  tabFamiliarNotes: string;
  tabFamiliarGallery: string;
  archetypeStudent: string;
  archetypeAdultWizard: string;
  archetypeFamiliar: string;
  noFamiliarBonded: string;
  bondExistingFamiliar: string;
  createNewFamiliar: string;
  selectFamiliarToBond: string;
  selectFamiliarPlaceholder: string;
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  es: {
    // 1. General UI Elements & Common Labels
    appName: "Magistri Scholae",
    tagline: "Editor de fichas de Personaje",
    languageName: "Español",
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
    loadingMessage: "Abriendo grimorio de la escuela...",
    errorStoringStudent: "Error al guardar el personaje en la base de datos.",
    resetConfirmPhrase: "ELIMINAR TODO",
    btnFinish: "Finalizar Edición",
    confirmDelete: "Eliminar Personaje permanentemente",
    confirmDeleteText: "¿Estás seguro de que deseas eliminar permanentemente a este personaje? Esta acción es irreversible, destruirá de forma completa su bitácora de crónicas, galería de retratos, conjuros, pociones y equipamiento.",
    confirmDeleteCheckbox: "Entiendo que esta acción es definitiva y no podré recuperar de ningún modo la ficha de este personaje.",
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
    nombre: "Nombre del Personaje",
    jugador: "Jugador",
    edad: "Edad",
    casa: "Casa Fundadora",
    curso: "Curso Académico",
    puestoClase: "Puesto en la Clase",
    concepto: "Concepto",
    lema: "Lema de la Casa",
    escudoText: "Escudo y Emblema",
    complicaciones: "Complicaciones",
    linaje: "Linaje Familiar",
    puntosDestino: "Puntos de Destino",
    economia: "Economía",
    varitaSintonia: "Varita / Foco mágico",
    noConceptDefined: "Sin concepto",
    labelVaritaEmpty: "Sin varita vinculada.",

    // 4. Input Field Placeholders
    placeholderNombre: "p. ej. Leonora Vance",
    requiredKeepsSaved: "No puede quedar vacío; se mantiene el anterior.",
    limitEntries: "entradas",
    limitImages: "imágenes",
    limitReached: "límite alcanzado",
    pickerSearch: "Buscar",
    pickerNoMatch: "Nada coincide con «{q}».",
    pickerDone: "Hecho",
    pickerClose: "Cerrar",
    placeholderJugador: "p. ej. Miguel Ángel",
    placeholderPuestoClase: "p. ej. Prefecta, Monitor",
    placeholderConcepto: "p. ej. Alquimista rebelde",
    placeholderLinaje: "p. ej. Sangre Pura, Mítico",
    placeholderEconomia: "p. ej. Normal, Precaria, Rica",
    placeholderComplicaciones: "p. ej. Miedo al fuego",
    placeholderVaritaSintonia: "p. ej. Sauce y pluma de fénix",
    placeholderConceptoEdit: "Concepto del personaje",

    // 5. Dashboard / List View Elements
    filterAllHouses: "Todas las Casas",
    noCharacters: "No se encontraron personajes. ¡Crea el primero!",
    addCharacter: "Nuevo Personaje",
    filterByHouse: "Filtrar por Casa",
    emptyRecords: "Bóveda Vacía",
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
    titleAspectsPossessions: "Aspectos y posesiones",
    validationErrorName: "El nombre es obligatorio.",
    validationErrorGeneric: "Por favor, corrige los errores antes de continuar.",
    draftDiscardConfirm: "¿Descartar los cambios? No se guardarán.",
    schoolShield: "ESCUELA:",
    secDatosAlumno: "Datos Personales",
    secLinajeDestino: "Linaje, Destino y Economía",
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
    placeholderConsecuenciaFisica: "p. ej. Brazo roto",
    placeholderConsecuenciaMental: "p. ej. Pesadillas",
    placeholderConsecuenciaSocial: "p. ej. Mala fama",
    labelActual: "ACTUAL",
    labelMaximo: "MÁXIMO",
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
    addAspecto: "Añadir Aspecto",
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
    addClub: "Registrar Club",
    emptyClubs: "Sin clubes.",
    labelQuantity: "Cantidad",
    labelAspectsEmpty: "Sin aspectos.",
    labelAspectosTemporalesEmpty: "Sin aspectos temporales.",
    labelComplicacionesEmpty: "Sin complicaciones.",
    aspectoTemporal: "Aspecto Temporal",
    placeholderAspectoTemporal: "p. ej. Convertido en sapo",
    placeholderAddAspect: "Nuevo aspecto",
    placeholderAddComplication: "Nueva complicación",
    placeholderAspectExample: "p. ej. Voluntad de hierro",
    placeholderEquipmentExample: "p. ej. Capa de invisibilidad",
    placeholderClubes: "p. ej. Club de Duelo escolar",
    placeholderEquipo: "p. ej. Reloj de arena",
    confirmDeleteClub: "¿Eliminar este club?",
    confirmDeleteItem: "¿Eliminar este objeto?",

    // 9. Academic Skills & Preset Templates
    catFisicas: "Habilidades Físicas",
    catMentales: "Habilidades Mentales",
    catSociales: "Habilidades Sociales",
    catTroncales: "Asignaturas Troncales",
    catOptativas: "Asignaturas Optativas",
    removeSkill: "Quitar Habilidad",
    addSkill: "Añadir Habilidad",
    placeholderNewSkillCategory: "Nueva habilidad",
    placeholderNewSkillName: "Nueva habilidad...",
    labelCreationRange: "Rango de creación: 0 a 5",
    addSkillFromList: "Añadir de la lista",
    errSkillExists: 'La habilidad "{name}" ya existe',
    noSkillsInCategory: "Sin habilidades.",

    // 10. Spellbooks, Brews & Grimoires
    conjuroName: "Nombre del Conjuro",
    pocionName: "Fórmula de la Poción",
    spellsAndPotions: "Hechizos y Pociones",
    specialized: "Especialista",
    level: "Grado",
    addSpell: "Registrar Hechizo",
    addPotion: "Registrar Poción",
    placeholderConjuroName: "p. ej. Revelio",
    placeholderPocionName: "p. ej. Filtro de calma",
    labelSpellsEmpty: "GRIMORIO VACÍO",
    labelPotionsEmpty: "ALAMBIQUE LIMPIO",
    confirmDeleteSpell: "¿Eliminar este conjuro?",
    confirmDeletePotion: "¿Eliminar esta poción?",
    grimoireOfSpells: "Grimorio de Conjuros",
    registerNewSpell: "Nuevo hechizo",
    register: "Registrar",
    catalogOfPotions: "Catálogo de Pociones",
    registerNewPotion: "Nueva poción",
    labelGrado: "Grado",
    labelDificultad: "Dificultad",

    // 11. Journal / Chronicles Notes
    emptyNotes: "Bitácora vacía.",
    addNote: "Añadir nota",
    confirmDeleteNote: "¿Eliminar esta nota?",
    placeholderNoteTitle: "Título (opcional)",
    placeholderNoteContent: "Texto de la nota",
    labelNotesChronicleTitle: "Bitácora Celestial",
    placeholderNotasChronicle: "Escribe aquí las crónicas del personaje, registros de clase, pactos extraescolares o secretos que vaya descubriendo de la academia...",
    notesLabel: "Notas",
    registerNote: "Registrar Entrada",
    entryFrom: "Entrada del ",
    consolidatedJournal: "Bitácora Consolidada",

    // 12. Gallery, Portrait Fitting & Cropping
    uploadAvatar: "Subir retrato",
    uploadGallery: "Añadir imagen",
    pasteUrl: "Pegar URL remota",
    invalidUrl: "URL inválida",
    galleryInstructions: "Imágenes del personaje",
    labelGalleryEmpty: "Galería vacía",
    confirmDeleteGalleryImage: "¿Eliminar esta imagen?",
    subirArchivoLocalMax: "Subir Archivo Local (Tamaño Máx: 2MB)",
    imageTooLarge: "La imagen es demasiado pesada y no se pudo reducir lo suficiente. Selecciona una menor de 5MB.",
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
    aboutDescription: "Fichas de personaje para partidas de academia mágica.",
    installHelp: "Instalación PWA",
    installHelpText: "Esta aplicación se ejecuta localmente y sin conexión. En tu dispositivo móvil o de escritorio, selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio' en el menú de tu navegador para llevar la experiencia mágica a pantalla completa.",
    storageInfo: "Almacenamiento",
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
    importMergeRequestText: "Se ha cargado una copia de seguridad. ¿Deseas reemplazar todos tus personajes actuales con el archivo importado, o prefieres añadir los nuevos personajes a tu lista actual sin perder nada?",
    settingsTitleDatabaseTools: "Copia de Seguridad",
    settingsDDBBExplanation: "Descarga una copia física de todos tus personajes, incluyendo biografías, puntuaciones e imágenes persistentes.",
    settingsExecutePurge: "EJECUTAR PURGA",
    settingsConfirmWipeDDBBDescription: "Esta acción borrará de forma definitiva TODAS las fichas de personajes y la biblioteca de imágenes de tu base de datos de este navegador. Para proceder, escribe el código de confirmación exactamente en el campo de abajo:",
    backupDownloadedMsg: "Copia de seguridad descargada.",
    backupErrorExportMsg: "Error al exportar los datos.",
    backupErrorOverwriteMsg: "Error al sobreescribir.",
    backupErrorMergeMsg: "Error al combinar datos.",
    backupErrorWipeMsg: "Fallo al borrar la base de datos.",
    backupTotalStudentsInFile: "Personajes en backup",
    backupExportedOn: "Fecha de copia",
    labelOfflineAutoSave: "ACTIVO AUTOGUARDADO OFFLINE",
    pwaOfflineStatusSuffix: "Activo",
    pwaStatusLabel: "Estado: Sin conexión",
    exportSelect: "Copia parcial",
    selectStudents: "Seleccionar Personajes",
    selectAll: "Seleccionar Todos",
    deselectAll: "Deseleccionar Todos",
    exportStudent: "Exportar Personaje",
    mockModeBanner: "DEMO — Datos ficticios; nada se guarda en tus fichas.",
    storageLoadError: "No se pudieron cargar los datos. Recarga para volver a intentarlo.",
    importBondWarnings: "Importación completada. Se han desvinculado {n} referencias a fichas ausentes del archivo.",
    studentListEmptyBackup: "No hay personajes ni familiares en este modo para exportar.",
    exportSelectTitle: "Exportación Selectiva",
    exportSelectDescription: "Selecciona qué fichas de personajes deseas empaquetar en el archivo de copia de seguridad JSON.",
    searchBackupStudents: "Buscar personaje (por nombre, tipo o casa)...",
    exportSelectedCount: "Fichas a exportar: {n}",
    exportFullBackup: "Copia Completa",
    characterTypeStudent: "Alumno",
    characterTypeStudentDescription: "Alumno de Magistri Scholae perteneciente a una casa fundadora.",
    characterTypeAdultWizard: "Mago adulto",
    characterTypeAdultWizardDescription: "Mago adulto, profesor o personaje mágico externo.",
    adultWizardRegistration: "Registro de Mago Adulto",
    adultWizardProfileSection: "Perfil de Mago Adulto",
    adultWizardRole: "Rol / Título",
    adultWizardInstitution: "Institución",
    adultWizardIsTeacher: "Profesor de la Academia",
    adultWizardTeachingSubjects: "Asignaturas que imparte",
    adultWizardFormerHouse: "Antigua casa",
    adultWizardReputation: "Reputación / Estatus",
    characterTypeAdultWizardShort: "Adulto",
    characterTypeSelectTitle: "Elegir Sendero Mágico",
    characterTypeSelectDescription: "Elige el tipo de ficha.",
    adultWizardRolePlaceholder: "p. ej. Investigador de runas",
    adultWizardInstitutionPlaceholder: "Ej: Ministerio de Magia",
    adultWizardFormerHousePlaceholder: "Ej: Irati, Urania",
    adultWizardReputationPlaceholder: "p. ej. Respetado en su gremio",
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
    editNote: "Editar nota",
    saveNote: "Guardar cambios",
    discardDraftTitle: "Descartar Borrador",
    discardDraftConfirmBtn: "Descartar Cambios",
    removeAvatar: "Quitar retrato",
    importAction: "Importar",
    downloadAction: "Descargar",
    selectAtLeastOneError: "Por favor, selecciona al menos un personaje para exportar.",
    noMatchingStudents: "No se encontraron personajes para esta búsqueda.",
    deleteCustomField: "Eliminar campo",
    emptyCustomFields: "Sin campos personalizados.",
    familiarEditorCardTitle: "Familiar",
    familiarEditorCardDescription: "Familiares mágicos asignables a los alumnos de la academia.",
    familiarEditorTitle: "Registro de Familiares",
    familiarEditorSubtitle: "Retrato, nombre, especie y descripción del familiar.",
    familiarName: "Nombre del Familiar",
    familiarNamePlaceholder: "p. ej. Nyx, Archimedes, Bruma...",
    familiarSpecies: "Especie / Criatura",
    familiarSpeciesPlaceholder: "p. ej. Lechuza nival",
    familiarDescription: "Descripción",
    familiarDescriptionPlaceholder: "p. ej. Apariencia y carácter",
    familiarValidationError: "El nombre y la especie del familiar son obligatorios.",
    familiarSavedToast: "Familiar guardado.",
    familiarDeletedToast: "Familiar eliminado del registro.",
    familiarGalleryTitle: "Familiares Registrados",
    familiarGalleryEmpty: "Aún no hay familiares creados en el registro.",
    familiarCreateNewBtn: "Nuevo Familiar",
    familiarUpdateBtn: "Actualizar Familiar",
    familiarSaveNewBtn: "Guardar Familiar",
    confirmFamiliar: "Confirmar familiar",
    familiarOpenEditorBtn: "Abrir Editor de Familiares",
    familiarConfirmDelete: "¿Eliminar permanentemente esta ficha de familiar?",
    filterFamiliars: "Familiares",
    familiarSpeciesShort: "Especie",
    familiarBondLabel: "Vínculo",
    familiarUnbound: "Sin asignar",
    noDescriptionDefined: "Sin descripción registrada",
    familiarDetailTitle: "Ficha de Familiar Mágico",
    familiarBondSectionTitle: "Vínculo Mágico",
    familiarBondWithWizard: "Mago Asignado",
    familiarBondNone: "Sin vínculo",
    familiarChangeBond: "Cambiar Vínculo",
    familiarUnbind: "Desvincular",
    familiarBondStudent: "Vincular personaje",
    familiarSelectMasterPlaceholder: "Seleccionar mago...",
    familiarEditInEditor: "Editor Completo",
    familiarQuickEdit: "Edición Rápida",
    familiarBackToList: "Volver a Personajes",
    familiarDeleteTitle: "Liberar / Eliminar Familiar",
    familiarDeletePrompt: "¿Estás seguro de que deseas eliminar permanentemente la ficha de este familiar? Se perderán sus notas y galería.",
    familiarDeleteConfirmBtn: "Sí, Eliminar Familiar",
    familiarSavedInlineToast: "Familiar actualizado correctamente",
    familiarViewDetail: "Ver Ficha de Familiar",
    wizardViewDetail: "Ver Ficha del Mago",
    tabFamiliarProfile: "Perfil y Vínculo",
    tabFamiliarNotes: "Diario del Familiar",
    tabFamiliarGallery: "Galería de Recuerdos",
    archetypeStudent: "Alumno de la Academia",
    archetypeAdultWizard: "Mago Adulto / Profesor",
    archetypeFamiliar: "Familiar Mágico",
    noFamiliarBonded: "Sin familiar vinculado",
    bondExistingFamiliar: "Vincular",
    createNewFamiliar: "Crear Familiar",
    selectFamiliarToBond: "Elige un personaje.",
    selectFamiliarPlaceholder: "Elige un familiar.",
  },
  en: {
    // 1. General UI Elements & Common Labels
    appName: "Magistri Scholae",
    tagline: "Offline Character Sheet Manager for Magic Academies",
    languageName: "English",
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
    resetConfirmPhrase: "DELETE ALL",
    btnFinish: "Finish Editing",
    confirmDelete: "Permanently Delete Character",
    confirmDeleteText: "Are you sure you want to permanently delete this character? This action is completely irreversible and will permanently delete all of their chronicled journals, photo galleries, spells, custom potions, and belongings.",
    confirmDeleteCheckbox: "I understand that this action is permanent and I will not be able to recover this character's sheet under any circumstance.",
    confirmDeleteButton: "Delete Permanently",
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
    escudoText: "Emblem & Insignia",
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
    placeholderConceptoEdit: "Character concept",

    // 5. Dashboard / List View Elements
    filterAllHouses: "All Houses",
    noCharacters: "No characters found. Create the first one!",
    addCharacter: "Add Character",
    filterByHouse: "House Filter",
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
    schoolShield: "ACADEMY:",
    secDatosAlumno: "Character Personal Details",
    secLinajeDestino: "Heritage, Destiny & Economy",
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
    placeholderConsecuenciaFisica: "e.g. Broken arm",
    placeholderConsecuenciaMental: "e.g. Nightmares",
    placeholderConsecuenciaSocial: "e.g. Bad name",
    labelActual: "CURRENT",
    labelMaximo: "MAXIMUM",
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
    addAspecto: "Add Aspect",
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
    catFisicas: "Physical Skills",
    catMentales: "Mental Skills",
    catSociales: "Social Skills",
    catTroncales: "Core Curriculum",
    catOptativas: "Elective Subjects",
    removeSkill: "Remove Skill",
    addSkill: "Add Skill",
    placeholderNewSkillCategory: "New skill",
    placeholderNewSkillName: "New skill name...",
    labelCreationRange: "Creation range: 0 to 5",
    addSkillFromList: "Add from the list",
    errSkillExists: 'Skill "{name}" already exists',
    noSkillsInCategory: "No skills.",

    // 10. Spellbooks, Brews & Grimoires
    conjuroName: "Spell Name",
    pocionName: "Potion Formula",
    spellsAndPotions: "Spellbooks & Brews",
    specialized: "Specialist",
    level: "Grade",
    addSpell: "Scribe Spell",
    addPotion: "Elabor Potion",
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
    labelGrado: "Grade",
    labelDificultad: "Difficulty",

    // 11. Journal / Chronicles Notes
    emptyNotes: "Empty journal.",
    addNote: "Add note",
    confirmDeleteNote: "Delete this note?",
    placeholderNoteTitle: "Title (optional)",
    placeholderNoteContent: "Note text",
    labelNotesChronicleTitle: "Celestial Journal",
    placeholderNotasChronicle: "Write here the chronicles, class logs, extracurricular pacts or secrets discovered in the academy...",
    notesLabel: "Notes",
    registerNote: "Register Note",
    entryFrom: "Entry from ",
    consolidatedJournal: "Consolidated Journal",

    // 12. Gallery, Portrait Fitting & Cropping
    uploadAvatar: "Upload portrait",
    uploadGallery: "Add image",
    pasteUrl: "Paste internet link",
    invalidUrl: "Invalid URL",
    galleryInstructions: "The character's images",
    labelGalleryEmpty: "Empty gallery",
    confirmDeleteGalleryImage: "Delete this image?",
    subirArchivoLocalMax: "Upload File (Max Size: 2MB)",
    imageTooLarge: "Image is too large and compression could not reduce it enough. Please select a dynamic image under 5MB.",
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
    installHelp: "PWA Installation",
    installHelpText: "This app runs fully locally and offline. On desktop or mobile devices, select 'Install app' or 'Add to home screen' from your browser menu to open it in full-screen immersion.",
    storageInfo: "Storage",
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
    importAdd: "Merge with current characters",
    importMergeRequestTitle: "Backup Import Selection",
    importMergeRequestText: "A backup file has been read. Do you want to replace all current characters with the imported file, or merge the imported characters without losing current data?",
    settingsTitleDatabaseTools: "Backup & Safe Export",
    settingsDDBBExplanation: "Download local records as highly portable JSON backups containing all character traits.",
    settingsExecutePurge: "EXECUTE PURGE",
    settingsConfirmWipeDDBBDescription: "This action will permanently delete ALL local characters and stored images. Type 'DELETE ALL' inside the field to proceed:",
    backupDownloadedMsg: "Backup downloaded successfully.",
    backupErrorExportMsg: "Error exporting records.",
    backupErrorOverwriteMsg: "Overwrite failed.",
    backupErrorMergeMsg: "Merge failed.",
    backupErrorWipeMsg: "Failed to wipe database.",
    backupTotalStudentsInFile: "Characters in file",
    backupExportedOn: "Exported on",
    labelOfflineAutoSave: "OFFLINE AUTO-SAVE ENABLED",
    pwaOfflineStatusSuffix: "Cached",
    pwaStatusLabel: "PWA Status: Offline",
    exportSelect: "Export Selected",
    selectStudents: "Select Characters",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    exportStudent: "Export Character",
    mockModeBanner: "DEMO — Fictional data; nothing is saved to your sheets.",
    storageLoadError: "Could not load your data. Reload to retry.",
    importBondWarnings: "Import complete. Detached {n} references to records missing from the file.",
    studentListEmptyBackup: "No characters or familiars in this mode to export.",
    exportSelectTitle: "Selective Export",
    exportSelectDescription: "Select which character sheets you want to package into the JSON backup file.",
    searchBackupStudents: "Search character (by name, type or house)...",
    exportSelectedCount: "Cards to export: {n}",
    exportFullBackup: "Full Backup (All)",
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
    importAction: "Import",
    downloadAction: "Download",
    selectAtLeastOneError: "Please select at least one character to export.",
    noMatchingStudents: "No matching characters found.",
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
    familiarDeletedToast: "Familiar removed from the registry.",
    familiarGalleryTitle: "Registered Familiars",
    familiarGalleryEmpty: "No familiars have been created in the registry yet.",
    familiarCreateNewBtn: "New Familiar",
    familiarUpdateBtn: "Update Familiar",
    familiarSaveNewBtn: "Save Familiar",
    confirmFamiliar: "Confirm familiar",
    familiarOpenEditorBtn: "Open Familiar Editor",
    familiarConfirmDelete: "Permanently delete this familiar sheet?",
    filterFamiliars: "Familiars",
    familiarSpeciesShort: "Species",
    familiarBondLabel: "Bond",
    familiarUnbound: "Unbound",
    noDescriptionDefined: "No description recorded",
    familiarDetailTitle: "Magical Familiar Sheet",
    familiarBondSectionTitle: "Magical Bond",
    familiarBondWithWizard: "Bonded Wizard",
    familiarBondNone: "No bond",
    familiarChangeBond: "Change Bond",
    familiarUnbind: "Unbind",
    familiarBondStudent: "Link character",
    familiarSelectMasterPlaceholder: "Select wizard...",
    familiarEditInEditor: "Full Editor",
    familiarQuickEdit: "Quick Edit",
    familiarBackToList: "Back to Characters",
    familiarDeleteTitle: "Release / Delete Familiar",
    familiarDeletePrompt: "Are you sure you want to permanently delete this familiar sheet? Its chronicles and gallery will be deleted.",
    familiarDeleteConfirmBtn: "Yes, Delete Familiar",
    familiarSavedInlineToast: "Familiar updated successfully",
    familiarViewDetail: "View Familiar Sheet",
    wizardViewDetail: "View Wizard Sheet",
    tabFamiliarProfile: "Profile & Bond",
    tabFamiliarNotes: "Familiar Chronicles",
    tabFamiliarGallery: "Memory Gallery",
    archetypeStudent: "Academy Student",
    archetypeAdultWizard: "Adult Wizard / Professor",
    archetypeFamiliar: "Magical Familiar",
    noFamiliarBonded: "No familiar bonded",
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


