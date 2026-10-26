/** @typedef {{ id: string, name: string, kind: 'spirit'|'mixer'|'garnish', color: string, accent: string, label: string, short: string }} Ingredient */

/** @type {Record<string, Ingredient>} */
export const INGREDIENTS = {
  vodka: { id: 'vodka', name: 'Vodka', kind: 'spirit', color: '#dce9ff', accent: '#8ec8ff', label: 'VODKA', short: 'Vodka' },
  gin: { id: 'gin', name: 'Gin', kind: 'spirit', color: '#c8f5d4', accent: '#5ee08a', label: 'GIN', short: 'Gin' },
  rum: { id: 'rum', name: 'Rum', kind: 'spirit', color: '#ffb070', accent: '#ff7a2e', label: 'RUM', short: 'Rum' },
  tequila: { id: 'tequila', name: 'Tequila', kind: 'spirit', color: '#ffe680', accent: '#f5c400', label: 'TEQUILA', short: 'Teq' },
  whiskey: { id: 'whiskey', name: 'Whiskey', kind: 'spirit', color: '#e09a4a', accent: '#c46a18', label: 'WHISKEY', short: 'Whis' },
  triple_sec: { id: 'triple_sec', name: 'Triple Sec', kind: 'spirit', color: '#ffd18a', accent: '#ff9f1c', label: 'TRIPLE', short: 'Triple' },
  coffee_liqueur: { id: 'coffee_liqueur', name: 'Coffee Liqueur', kind: 'spirit', color: '#6b3a1e', accent: '#c4783a', label: 'COFFEE', short: 'Coffee' },

  tonic: { id: 'tonic', name: 'Tonic', kind: 'mixer', color: '#9af7ff', accent: '#2de0ff', label: 'TONIC', short: 'Tonic' },
  cola: { id: 'cola', name: 'Cola', kind: 'mixer', color: '#5b3318', accent: '#ff7a3a', label: 'COLA', short: 'Cola' },
  soda: { id: 'soda', name: 'Soda', kind: 'mixer', color: '#b9d7ff', accent: '#6ea8ff', label: 'SODA', short: 'Soda' },
  oj: { id: 'oj', name: 'Orange Juice', kind: 'mixer', color: '#ffb347', accent: '#ff8a00', label: 'OJ', short: 'OJ' },
  pineapple: { id: 'pineapple', name: 'Pineapple', kind: 'mixer', color: '#ffe566', accent: '#f2c200', label: 'PINEAPPLE', short: 'Pine' },
  cranberry: { id: 'cranberry', name: 'Cranberry', kind: 'mixer', color: '#ff4d6d', accent: '#ff2d55', label: 'CRANBERRY', short: 'Cran' },
  cream: { id: 'cream', name: 'Cream', kind: 'mixer', color: '#fff4e8', accent: '#ffd6ea', label: 'CREAM', short: 'Cream' },
  grenadine: { id: 'grenadine', name: 'Grenadine', kind: 'mixer', color: '#ff2a55', accent: '#ff6b9d', label: 'GRENADINE', short: 'Gren' },

  lime: { id: 'lime', name: 'Lime', kind: 'garnish', color: '#b6ff4a', accent: '#7cdb00', label: 'LIME', short: 'Lime' },
  lemon: { id: 'lemon', name: 'Lemon', kind: 'garnish', color: '#fff36b', accent: '#ffe100', label: 'LEMON', short: 'Lemon' },
  orange: { id: 'orange', name: 'Orange', kind: 'garnish', color: '#ff8a3d', accent: '#ff5e00', label: 'ORANGE', short: 'Orange' },
  cherry: { id: 'cherry', name: 'Cherry', kind: 'garnish', color: '#ff3b5c', accent: '#ff1744', label: 'CHERRY', short: 'Cherry' },
  mint: { id: 'mint', name: 'Mint', kind: 'garnish', color: '#5dff9f', accent: '#00e676', label: 'MINT', short: 'Mint' },
  salt: { id: 'salt', name: 'Salt', kind: 'garnish', color: '#e8f4ff', accent: '#b3d4ff', label: 'SALT', short: 'Salt' },
};

export const SPIRITS = ['vodka', 'gin', 'rum', 'tequila', 'whiskey', 'triple_sec', 'coffee_liqueur'];
export const MIXERS = ['tonic', 'cola', 'soda', 'oj', 'pineapple', 'cranberry', 'cream', 'grenadine'];
export const GARNISHES = ['lime', 'lemon', 'orange', 'cherry', 'mint', 'salt'];

/** @type {{ id: string, name: string, ingredients: string[], glass: 'highball'|'rocks'|'martini'|'coupe', base: number }[]} */
export const RECIPES = [
  { id: 'gin_tonic', name: 'Gin & Tonic', ingredients: ['gin', 'tonic', 'lime'], glass: 'highball', base: 120 },
  { id: 'rum_cola', name: 'Rum & Cola', ingredients: ['rum', 'cola', 'lime'], glass: 'highball', base: 120 },
  { id: 'margarita', name: 'Margarita', ingredients: ['tequila', 'triple_sec', 'lime', 'salt'], glass: 'coupe', base: 180 },
  { id: 'mojito', name: 'Mojito', ingredients: ['rum', 'soda', 'lime', 'mint'], glass: 'highball', base: 170 },
  { id: 'cosmo', name: 'Cosmo', ingredients: ['vodka', 'triple_sec', 'cranberry', 'lime'], glass: 'martini', base: 180 },
  { id: 'white_russian', name: 'White Russian', ingredients: ['vodka', 'coffee_liqueur', 'cream'], glass: 'rocks', base: 160 },
  { id: 'tequila_sunrise', name: 'Tequila Sunrise', ingredients: ['tequila', 'oj', 'grenadine'], glass: 'highball', base: 150 },
  { id: 'whiskey_sour', name: 'Whiskey Sour', ingredients: ['whiskey', 'lemon', 'cherry'], glass: 'rocks', base: 160 },
  { id: 'screwdriver', name: 'Screwdriver', ingredients: ['vodka', 'oj'], glass: 'highball', base: 100 },
  { id: 'cape_codder', name: 'Cape Codder', ingredients: ['vodka', 'cranberry', 'lime'], glass: 'highball', base: 130 },
  { id: 'pina_colada', name: 'Piña Colada', ingredients: ['rum', 'pineapple', 'cream'], glass: 'coupe', base: 170 },
  { id: 'sea_breeze', name: 'Sea Breeze', ingredients: ['vodka', 'cranberry', 'pineapple'], glass: 'highball', base: 150 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, i) => id === right[i]);
}

export function mixColor(ids) {
  if (!ids.length) return 'rgba(255,255,255,0.08)';
  let r = 0, g = 0, b = 0;
  for (const id of ids) {
    const hex = (INGREDIENTS[id]?.color || '#888888').replace('#', '');
    r += parseInt(hex.slice(0, 2), 16);
    g += parseInt(hex.slice(2, 4), 16);
    b += parseInt(hex.slice(4, 6), 16);
  }
  const n = ids.length;
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
}
