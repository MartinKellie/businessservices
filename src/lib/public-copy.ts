/**
 * Public chrome copy. Spanish is the product language; English exists only as a
 * development review aid (handoff §1). Directory data is never translated here.
 */

export const DEV_UI_LOCALE = process.env.NODE_ENV !== 'production';

export type DevUiLocale = 'es' | 'en';

export const ENQUIRY_TYPES = [
  'add_business',
  'update_listing',
  'advertising',
  'general',
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

const es = {
  siteName: 'Directorio de Cúcuta',
  navMain: 'Principal',
  about: 'Acerca',
  advertise: 'Anúnciate',
  contact: 'Contacto',
  privacy: 'Privacidad',
  terms: 'Términos',
  cookies: 'Cookies',
  whatLooking: '¿Qué estás buscando?',
  searchPlaceholder: 'Dispensador de agua, panadería, taller…',
  area: 'Zona',
  nearMe: 'Cerca de mí',
  locating: 'Obteniendo ubicación…',
  locatingShort: 'Ubicando…',
  search: 'Buscar',
  geoHint: 'Elige tu barrio, usa tu ubicación, o escribe una dirección. Sin cuenta.',
  geoDeniedHome: 'No se pudo usar tu ubicación. Se usará {area}. Escribe una dirección si quieres.',
  addressLabel: 'Dirección o barrio',
  addressPlaceholder: 'Centro, Av. 0, Los Patios…',
  addressUse: 'Usar',
  addressEmpty: 'No encontramos esa dirección.',
  addressShort: 'Escribe al menos 3 letras.',
  addressPick: 'Elige una:',
  geocoding: 'Buscando dirección…',
  geoUnavailable: 'No se pudo buscar la dirección. Inténtalo de nuevo.',
  selectedAreaFallback: 'la zona seleccionada',
  usual: 'Lo de siempre',
  emptyCategories: 'Nada escrito en el menú todavía. Busca arriba o vuelve más tarde.',
  businessOne: 'negocio',
  businessMany: 'negocios',
  allAreas: 'Todas las zonas',
  allCategories: 'Todas las categorías',
  openNow: 'Abierto ahora',
  category: 'Categoría',
  nearYou: 'Cerca de ti',
  resultOne: 'resultado',
  resultMany: 'resultados',
  geoDeniedSearch: 'No se pudo usar tu ubicación. Mostrando {area}. Escribe una dirección si quieres.',
  map: 'Mapa',
  list: 'Lista',
  both: 'Ambos',
  panes: 'Paneles',
  split: 'Ajustar divisor',
  emptyBoard: 'Nada en el tablero',
  emptyBoardHint:
    'Prueba con otras palabras, otra zona, o quita un filtro. El buscador entiende nombres, oficios y cómo se dice por aquí.',
  closeSheet: 'Cerrar ficha',
  searching: 'Buscando…',
  loadResults: 'No se pudieron cargar los resultados.',
  previous: 'Anterior',
  next: 'Siguiente',
  loadingMap: 'Cargando mapa…',
  mapLabel: 'Mapa de resultados',
  mapFallback: 'Mapa de referencia',
  open: 'Abierto',
  closed: 'Cerrado',
  serviceArea: 'Zona de servicio',
  call: 'Llamar',
  statusTemporarilyClosed: 'Temporalmente cerrado',
  statusRelocated: 'Movido',
  statusPermanentlyClosed: 'Cerrado definitivamente',
  loadingDetail: 'Cargando ficha…',
  detailMissing: 'No se encontró el negocio.',
  detailLoadError: 'No se pudieron cargar los detalles.',
  relocatedNow: 'ahora',
  dayFallback: 'Día {n}',
  email: 'Correo',
  website: 'Sitio',
  lastUpdated: 'Última actualización',
  days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  themeSystem: 'Sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  themeAria: 'Tema: {label}. Cambiar tema',
  localeAria: 'Idioma de la interfaz: {label}',
  backHome: 'Volver al inicio',
  aboutTitle: 'Acerca de',
  aboutLead:
    'Un tablero de negocios y servicios de Cúcuta y zonas cercanas. Sin cuenta. Buscas, ves si está abierto cuando hay horario, y escribes o llamas directo.',
  aboutSections: [
    {
      title: 'Qué es',
      body: 'Este directorio reúne negocios locales — Cúcuta, Los Patios, Villa del Rosario y otros barrios — para que encuentres lo que necesitas cerca de ti. Está pensado para quien llega con una necesidad concreta: un dispensador de agua, un taller, una panadería.',
    },
    {
      title: 'Para quién',
      body: 'Para quien vive o trabaja por aquí y necesita un oficio o un producto cercano. También para negocios con poca o ninguna presencia en internet, que igual atienden al barrio.',
    },
    {
      title: 'Cómo se usa',
      body: 'No hay registro. Escribes lo que buscas, eliges una zona, Cerca de mí o una dirección, y abres la ficha en los resultados. WhatsApp y el teléfono están a un toque. El mapa y la lista viven en la misma pantalla.',
    },
    {
      title: 'Quién lo mantiene',
      body: 'MK1GROUP cuida el catálogo. El directorio es de Cúcuta; el Powered by MK1GROUP queda discreto, en el pie.',
    },
  ],
  aboutSearch: 'Buscar en el directorio',
  advertiseTitle: 'Anúnciate con nosotros',
  advertiseLead:
    'Cualquier negocio de la zona puede pedir aparecer. MK1GROUP publica las fichas a mano. Las opciones mejoradas también se gestionan así, por ahora.',
  advertiseSections: [
    {
      title: 'Pedir una ficha',
      body: 'Escríbenos con el nombre del negocio y cómo contactarte. No hay alta automática: alguien del equipo mira lo que llega antes de que salga en el tablero.',
    },
    {
      title: 'Opciones mejoradas',
      body: 'Hay opciones mejoradas si te interesa más visibilidad u otros arreglos. En esta etapa MK1GROUP las acuerda a mano; no hay un catálogo de precios en el sitio.',
    },
    {
      title: 'Cómo escribirnos',
      body: 'El camino público es el formulario de contacto. Elige Añadir mi negocio o Consulta de publicidad. Sin cuenta.',
    },
  ],
  advertiseAdd: 'Añadir mi negocio',
  advertisePromo: 'Consulta de publicidad',
  contactTitle: 'Contacto',
  contactIntro:
    'Escríbenos. Sin cuenta. Si adjuntas una foto o logo, el equipo la revisa antes de usarla; no se publica sola.',
  enquiryType: 'Tipo de consulta',
  enquiryAdd: 'Añadir mi negocio',
  enquiryUpdate: 'Actualizar mi ficha',
  enquiryAdvertising: 'Consulta de publicidad',
  enquiryGeneral: 'Consulta general',
  fieldName: 'Nombre',
  fieldEmail: 'Correo',
  fieldPhone: 'Teléfono',
  fieldMessage: 'Mensaje',
  fieldBusiness: 'Negocio o referencia',
  fieldFile: 'Logo o foto',
  optional: 'opcional',
  fileHint: 'JPG, PNG o WebP. Máximo {size}. La imagen no se publica sola.',
  fileChoose: 'Adjuntar imagen',
  fileRemove: 'Quitar',
  fileTooLarge: 'La imagen supera el tamaño máximo ({size}).',
  fileBadType: 'Usa JPG, PNG o WebP.',
  consentLabel: 'He leído y acepto la',
  submitEnquiry: 'Enviar consulta',
  sendingEnquiry: 'Enviando…',
  successTitle: 'Consulta enviada',
  successBody: 'Recibimos tu mensaje. El equipo de MK1GROUP lo revisará.',
  sendAnother: 'Enviar otra consulta',
  errorRate: 'Demasiadas solicitudes. Inténtalo más tarde.',
  errorGeneric: 'No se pudo enviar. Inténtalo de nuevo.',
  consentRequired: 'Marca la casilla de privacidad para enviar.',
  privacyTitle: 'Política de Privacidad',
  termsTitle: 'Términos y Aviso Legal',
  legalPending:
    'Este texto describe cómo funciona el directorio público hoy. Un texto legal formal puede sustituirlo más adelante.',
  privacySections: [
    {
      title: 'Datos del formulario de contacto',
      body: 'Si nos escribes, recibimos tu nombre, correo, mensaje y, si los das, teléfono, referencia del negocio y una imagen. Sirven para atender la consulta. La imagen no se publica sola: el equipo la revisa. Guardamos que aceptaste esta política y la fecha.',
    },
    {
      title: 'Panel de administración',
      body: 'El sitio público no tiene cuentas. El personal de MK1GROUP entra al panel con Google, solo si está en la lista permitida. Eso no es un registro para visitantes.',
    },
    {
      title: 'Ubicación del dispositivo',
      body: 'Cerca de mí pide tu ubicación solo si la concedes. Si escribes una dirección o un barrio, la enviamos para convertirla en un punto en el mapa. Esa búsqueda usa las coordenadas y un radio fijo. No crea un perfil ni una cuenta.',
    },
    {
      title: 'Preferencias en este navegador',
      body: 'El directorio recuerda en este dispositivo tu zona, el tema, cómo ves el mapa y si aceptaste estas preferencias. No hay cuenta detrás.',
    },
    {
      title: 'Cookies',
      body: 'Solo lo necesario para eso. Puedes revisar las preferencias cuando quieras desde el pie o el botón de esta página.',
    },
  ],
  termsSections: [
    {
      title: 'Uso sin cuenta',
      body: 'Puedes buscar y contactar negocios sin registrarte. Al usar el directorio aceptas este aviso.',
    },
    {
      title: 'Exactitud de las fichas',
      body: 'MK1GROUP mantiene el catálogo, pero horarios, teléfonos y direcciones pueden cambiar. Confirma con el negocio antes de desplazarte.',
    },
    {
      title: 'WhatsApp, teléfono y sitios',
      body: 'Esos enlaces y números son de cada negocio o de un servicio de terceros. Al pulsarlos sales de este directorio.',
    },
    {
      title: 'Responsabilidad',
      body: 'Este sitio es un directorio de información local. No es un contrato con los negocios listados ni una garantía de que un servicio esté disponible.',
    },
  ],
  cookieManage: 'Preferencias de cookies',
  cookieBanner:
    'Guardamos en este dispositivo tu zona, tema y cómo ves el mapa. No hay cuentas en el sitio público.',
  cookieAccept: 'Aceptar',
  cookiePrefs: 'Preferencias',
  cookiePanelTitle: 'Preferencias de cookies',
  cookieNecessary: 'Necesarias',
  cookieNecessaryHint:
    'Tema, zona, vista del mapa y estas preferencias. Siempre activas para que el directorio recuerde cómo lo dejaste.',
  cookieSave: 'Guardar',
  cookieClose: 'Cerrar',
  poweredBy: 'Powered by MK1GROUP',
  maintenanceTitle: 'En mantenimiento',
  maintenanceMessage:
    'El directorio está temporalmente en mantenimiento. Vuelve a intentarlo en unos minutos.',
};

export type PublicCopy = typeof es;

const en: PublicCopy = {
  siteName: 'Cúcuta Directory',
  navMain: 'Main',
  about: 'About',
  advertise: 'Advertise',
  contact: 'Contact',
  privacy: 'Privacy',
  terms: 'Terms',
  cookies: 'Cookies',
  whatLooking: 'What are you looking for?',
  searchPlaceholder: 'Water cooler, bakery, garage…',
  area: 'Area',
  nearMe: 'Near me',
  locating: 'Getting location…',
  locatingShort: 'Locating…',
  search: 'Search',
  geoHint: 'Pick your neighbourhood, use your location, or type an address. No account.',
  geoDeniedHome: 'Could not use your location. Using {area}. Type an address if you prefer.',
  addressLabel: 'Address or neighbourhood',
  addressPlaceholder: 'Centre, Av. 0, Los Patios…',
  addressUse: 'Use',
  addressEmpty: 'We could not find that address.',
  addressShort: 'Type at least 3 letters.',
  addressPick: 'Pick one:',
  geocoding: 'Looking up address…',
  geoUnavailable: 'Could not look up the address. Please try again.',
  selectedAreaFallback: 'the selected area',
  usual: 'The usual',
  emptyCategories: 'Nothing on the menu yet. Search above or come back later.',
  businessOne: 'business',
  businessMany: 'businesses',
  allAreas: 'All areas',
  allCategories: 'All categories',
  openNow: 'Open now',
  category: 'Category',
  nearYou: 'Near you',
  resultOne: 'result',
  resultMany: 'results',
  geoDeniedSearch: 'Could not use your location. Showing {area}. Type an address if you prefer.',
  map: 'Map',
  list: 'List',
  both: 'Both',
  panes: 'Panes',
  split: 'Resize divider',
  emptyBoard: 'Nothing on the board',
  emptyBoardHint:
    'Try other words, another area, or clear a filter. The search understands names, trades, and how people say it locally.',
  closeSheet: 'Close listing',
  searching: 'Searching…',
  loadResults: 'Could not load the results.',
  previous: 'Previous',
  next: 'Next',
  loadingMap: 'Loading map…',
  mapLabel: 'Results map',
  mapFallback: 'Reference map',
  open: 'Open',
  closed: 'Closed',
  serviceArea: 'Service area',
  call: 'Call',
  statusTemporarilyClosed: 'Temporarily closed',
  statusRelocated: 'Moved',
  statusPermanentlyClosed: 'Permanently closed',
  loadingDetail: 'Loading listing…',
  detailMissing: 'Business not found.',
  detailLoadError: 'Could not load the details.',
  relocatedNow: 'now',
  dayFallback: 'Day {n}',
  email: 'Email',
  website: 'Site',
  lastUpdated: 'Last updated',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeAria: 'Theme: {label}. Change theme',
  localeAria: 'Interface language: {label}',
  backHome: 'Back to the home page',
  aboutTitle: 'About',
  aboutLead:
    'A board of businesses and services in Cúcuta and nearby areas. No account. You search, see if it is open when hours are known, and write or call directly.',
  aboutSections: [
    {
      title: 'What it is',
      body: 'This directory gathers local businesses — Cúcuta, Los Patios, Villa del Rosario and other neighbourhoods — so you can find what you need close by. It is for someone who arrives with a concrete need: a water cooler, a garage, a bakery.',
    },
    {
      title: 'Who it is for',
      body: 'For anyone who lives or works around here and needs a nearby trade or product. Also for businesses with little or no online presence that still serve the neighbourhood.',
    },
    {
      title: 'How to use it',
      body: 'There is no sign-up. You type what you need, pick an area, Near me or an address, and open the listing in the results. WhatsApp and phone are one tap. Map and list live on the same screen.',
    },
    {
      title: 'Who maintains it',
      body: 'MK1GROUP looks after the catalogue. The directory is Cúcuta’s; Powered by MK1GROUP stays discreet, in the footer.',
    },
  ],
  aboutSearch: 'Search the directory',
  advertiseTitle: 'Advertise with us',
  advertiseLead:
    'Any local business can ask to appear. MK1GROUP publishes listings by hand. Enhanced options are handled the same way for now.',
  advertiseSections: [
    {
      title: 'Ask for a listing',
      body: 'Write to us with the business name and how to reach you. There is no automatic sign-up: someone on the team looks at what arrives before it goes on the board.',
    },
    {
      title: 'Enhanced options',
      body: 'Enhanced options exist if you want more visibility or other arrangements. At this stage MK1GROUP agrees them by hand; there is no price list on the site.',
    },
    {
      title: 'How to write to us',
      body: 'The public route is the contact form. Choose Add my business or Advertising enquiry. No account.',
    },
  ],
  advertiseAdd: 'Add my business',
  advertisePromo: 'Advertising enquiry',
  contactTitle: 'Contact',
  contactIntro:
    'Write to us. No account. If you attach a photo or logo, the team reviews it before use; it is never published on its own.',
  enquiryType: 'Enquiry type',
  enquiryAdd: 'Add my business',
  enquiryUpdate: 'Update my listing',
  enquiryAdvertising: 'Advertising enquiry',
  enquiryGeneral: 'General enquiry',
  fieldName: 'Name',
  fieldEmail: 'Email',
  fieldPhone: 'Phone',
  fieldMessage: 'Message',
  fieldBusiness: 'Business or reference',
  fieldFile: 'Logo or photo',
  optional: 'optional',
  fileHint: 'JPG, PNG or WebP. Maximum {size}. The image is not published on its own.',
  fileChoose: 'Attach image',
  fileRemove: 'Remove',
  fileTooLarge: 'The image is larger than the maximum ({size}).',
  fileBadType: 'Use JPG, PNG or WebP.',
  consentLabel: 'I have read and accept the',
  submitEnquiry: 'Send enquiry',
  sendingEnquiry: 'Sending…',
  successTitle: 'Enquiry sent',
  successBody: 'We have received your message. The MK1GROUP team will review it.',
  sendAnother: 'Send another enquiry',
  errorRate: 'Too many requests. Please try again later.',
  errorGeneric: 'Could not send. Please try again.',
  consentRequired: 'Tick the privacy box to send.',
  privacyTitle: 'Privacy Policy',
  termsTitle: 'Terms and Disclaimer',
  legalPending:
    'This text describes how the public directory works today. Formal legal wording may replace it later.',
  privacySections: [
    {
      title: 'Contact-form data',
      body: 'If you write to us we receive your name, email, message and, if you give them, phone, business reference and an image. They are used to handle the enquiry. The image is never published on its own: the team reviews it. We store that you accepted this policy and the date.',
    },
    {
      title: 'Admin dashboard',
      body: 'The public site has no accounts. MK1GROUP staff sign in to the dashboard with Google, only if they are on the allow-list. That is not a sign-up for visitors.',
    },
    {
      title: 'Device location',
      body: 'Near me asks for your location only if you grant it. If you type an address or neighbourhood, we send it to turn it into a map point. That search uses the coordinates and a fixed radius. It does not create a profile or an account.',
    },
    {
      title: 'Preferences in this browser',
      body: 'The directory remembers on this device your area, theme, how you view the map, and whether you accepted these preferences. There is no account behind it.',
    },
    {
      title: 'Cookies',
      body: 'Only what is needed for that. You can review preferences at any time from the footer or the button on this page.',
    },
  ],
  termsSections: [
    {
      title: 'Use without an account',
      body: 'You can search and contact businesses without signing up. By using the directory you accept this notice.',
    },
    {
      title: 'Accuracy of listings',
      body: 'MK1GROUP maintains the catalogue, but hours, phone numbers and addresses can change. Confirm with the business before you travel.',
    },
    {
      title: 'WhatsApp, phone and sites',
      body: 'Those links and numbers belong to each business or to a third-party service. Following them takes you out of this directory.',
    },
    {
      title: 'Liability',
      body: 'This site is a local information directory. It is not a contract with listed businesses, nor a guarantee that a service is available.',
    },
  ],
  cookieManage: 'Cookie preferences',
  cookieBanner:
    'This device stores your area, theme and how you view the map. There are no accounts on the public site.',
  cookieAccept: 'Accept',
  cookiePrefs: 'Preferences',
  cookiePanelTitle: 'Cookie preferences',
  cookieNecessary: 'Necessary',
  cookieNecessaryHint:
    'Theme, area, map view and these preferences. Always on, so the directory remembers how you left it.',
  cookieSave: 'Save',
  cookieClose: 'Close',
  poweredBy: 'Powered by MK1GROUP',
  maintenanceTitle: 'Under maintenance',
  maintenanceMessage: 'The directory is temporarily under maintenance. Please try again in a few minutes.',
};

export const PUBLIC_COPY: Record<DevUiLocale, PublicCopy> = { es, en };

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function statusCopy(copy: PublicCopy, status: string): string | null {
  if (status === 'temporarily_closed') return copy.statusTemporarilyClosed;
  if (status === 'relocated') return copy.statusRelocated;
  if (status === 'permanently_closed') return copy.statusPermanentlyClosed;
  return null;
}

export function enquiryTypeLabel(copy: PublicCopy, type: EnquiryType): string {
  if (type === 'add_business') return copy.enquiryAdd;
  if (type === 'update_listing') return copy.enquiryUpdate;
  if (type === 'advertising') return copy.enquiryAdvertising;
  return copy.enquiryGeneral;
}

export function isEnquiryType(value: string | undefined | null): value is EnquiryType {
  return ENQUIRY_TYPES.includes(value as EnquiryType);
}
