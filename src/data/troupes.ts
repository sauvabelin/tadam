export interface PatrouilleInfo {
  id: string
  label: string
}

export interface TroupeInfo {
  id: string
  label: string
  patrouilles: PatrouilleInfo[]
}

export const ROLES = [
  'Louveteau', 'Louvette',
  'Éclaireur', 'Éclaireuse',
  'Pionnier', 'Cordée',
  'Routier', 'Routière',
]

export const TROUPES: TroupeInfo[] = [
  // --- Meutes (Louveteaux) ---
  {
    id: 'mont-dor',
    label: 'Mont-d\'Or',

    patrouilles: [],
  },
  {
    id: 'clairiere',
    label: 'Clairière',

    patrouilles: [],
  },
  // --- Meutes (Louvettes) ---
  {
    id: 'chenaulaz',
    label: 'Chenaulaz',

    patrouilles: [],
  },
  {
    id: 'caberu',
    label: 'Caberu',

    patrouilles: [],
  },
  // --- Troupes (Éclaireurs) ---
  {
    id: 'zanfleuron',
    label: 'Zanfleuron',

    patrouilles: [
      { id: 'bouquetins', label: 'Bouquetins' },
      { id: 'castors', label: 'Castors' },
      { id: 'lynx', label: 'Lynx' },
    ],
  },
  {
    id: 'manloud',
    label: 'Manloud',

    patrouilles: [
      { id: 'hermines', label: 'Hermines' },
      { id: 'taureaux', label: 'Taureaux' },
    ],
  },
  {
    id: 'la-neuvaz',
    label: 'La Neuvaz',

    patrouilles: [
      { id: 'cigognes', label: 'Cigognes' },
      { id: 'herons', label: 'Hérons' },
      { id: 'loutres', label: 'Loutres' },
    ],
  },
  {
    id: 'chandelard',
    label: 'Chandelard',

    patrouilles: [
      { id: 'rennes', label: 'Rennes' },
      { id: 'marmottes', label: 'Marmottes' },
      { id: 'cygnes', label: 'Cygnes' },
    ],
  },
  {
    id: 'berisal',
    label: 'Bérisal',

    patrouilles: [
      { id: 'pantheres', label: 'Panthères' },
      { id: 'cerfs', label: 'Cerfs' },
      { id: 'faucons', label: 'Faucons' },
    ],
  },
  {
    id: 'montfort',
    label: 'Montfort',

    patrouilles: [
      { id: 'le-galion', label: 'Le Galion' },
      { id: 'jean-bart', label: 'Jean-Bart' },
      { id: 'la-fregate', label: 'La Frégate' },
      { id: 'surcouf', label: 'Surcouf' },
    ],
  },
  {
    id: 'lovegno',
    label: 'Lovegno',

    patrouilles: [
      { id: 'phenix', label: 'Phénix' },
      { id: 'cobras', label: 'Cobras' },
      { id: 'tigres', label: 'Tigres' },
    ],
  },
  // --- Troupes (Éclaireuses) ---
  {
    id: 'solalex',
    label: 'Solalex',

    patrouilles: [
      { id: 'hirondelles', label: 'Hirondelles' },
      { id: 'ratons-laveurs', label: 'Ratons-Laveurs' },
      { id: 'goelands', label: 'Goélands' },
      { id: 'gazelles', label: 'Gazelles' },
    ],
  },
  {
    id: 'grammont',
    label: 'Grammont',

    patrouilles: [
      { id: 'licornes', label: 'Licornes' },
      { id: 'kangourous', label: 'Kangourous' },
      { id: 'chevreuils', label: 'Chevreuils' },
    ],
  },
  {
    id: 'armina',
    label: 'Armina',

    patrouilles: [
      { id: 'impalas', label: 'Impalas' },
      { id: 'mangoustes', label: 'Mangoustes' },
      { id: 'coyotes', label: 'Coyotes' },
      { id: 'cameleons', label: 'Caméléons' },
    ],
  },
  {
    id: 'santis',
    label: 'Säntis',

    patrouilles: [
      { id: 'oryx', label: 'Oryx' },
      { id: 'irbis', label: 'Irbis' },
      { id: 'condors', label: 'Condors' },
    ],
  },
  // --- Someo (troupe adaptée) ---
  {
    id: 'someo',
    label: 'Someo',

    patrouilles: [],
  },
  // --- Pionniers ---
  {
    id: 'rovereaz',
    label: 'Rovéréaz',

    patrouilles: [],
  },
  {
    id: 'orzival',
    label: 'Orzival',

    patrouilles: [],
  },
  {
    id: 'tsalion',
    label: 'Tsalion',

    patrouilles: [],
  },
  // --- Cordées (Pionnières) ---
  {
    id: 'sesal',
    label: 'Sésal',

    patrouilles: [],
  },
  {
    id: 'tamaro',
    label: 'Tamaro',

    patrouilles: [],
  },
  // --- Routiers ---
  {
    id: 'clan',
    label: 'Le Clan',

    patrouilles: [],
  },
  {
    id: 'gamaiun',
    label: 'Clan Gamaiun',

    patrouilles: [],
  },
]
