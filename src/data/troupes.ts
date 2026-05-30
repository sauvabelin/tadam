export interface TroupeInfo {
  id: string
  label: string
}

// Must stay in sync with PostcardController::VALID_ROLES (api/src/PostcardController.php),
// which is the authoritative runtime gate. Editing this list without editing
// that one will let the UI offer a role the server rejects (or vice versa).
export const ROLES = [
  'Louveteau', 'Louvette',
  'Éclaireur', 'Éclaireuse',
  'Pionnier', 'Cordée',
  'Routier', 'Routière',
] as const

export type Role = typeof ROLES[number]

export const TROUPES: TroupeInfo[] = [
  // --- Meutes (Louveteaux) ---
  { id: 'mont-dor', label: 'Mont-d\'Or' },
  { id: 'clairiere', label: 'Clairière' },
  // --- Meutes (Louvettes) ---
  { id: 'chenaulaz', label: 'Chenaulaz' },
  { id: 'caberu', label: 'Caberu' },
  // --- Troupes (Éclaireurs) ---
  { id: 'zanfleuron', label: 'Zanfleuron' },
  { id: 'manloud', label: 'Manloud' },
  { id: 'la-neuvaz', label: 'La Neuvaz' },
  { id: 'chandelard', label: 'Chandelard' },
  { id: 'berisal', label: 'Bérisal' },
  { id: 'montfort', label: 'Montfort' },
  { id: 'lovegno', label: 'Lovegno' },
  // --- Troupes (Éclaireuses) ---
  { id: 'solalex', label: 'Solalex' },
  { id: 'grammont', label: 'Grammont' },
  { id: 'armina', label: 'Armina' },
  { id: 'santis', label: 'Säntis' },
  // --- Someo (troupe adaptée) ---
  { id: 'someo', label: 'Someo' },
  // --- Pionniers ---
  { id: 'rovereaz', label: 'Rovéréaz' },
  { id: 'orzival', label: 'Orzival' },
  { id: 'tsalion', label: 'Tsalion' },
  // --- Cordées (Pionnières) ---
  { id: 'sesal', label: 'Sésal' },
  { id: 'tamaro', label: 'Tamaro' },
  // --- Routiers ---
  { id: 'clan', label: 'Le Clan' },
  { id: 'gamaiun', label: 'Clan Gamaiun' },
]
