export const AMBER = 0xd98f2b;
export const GOLD = 0xf5b544;
export const ALLY_COLOR = 0x4f8fb8;
export const ENEMY_COLOR = 0xc8472a;

export const CLASSES = {
  WARRIOR: {
    name: "GUERRIER", tier: 1, hp: 120, speed: 5.4, weapon: "sword",
    dmg: 22, chargeDmg: 45, range: 2.6, chargeTime: 0.9, lunge: 4,
    abilities: [
      { key: "C", icon: "slash", cd: 5,   label: "LAME FILAIRE" },
      { key: "E", icon: "burst", cd: 10,  label: "ONDE ARCANIQUE" },
    ],
  },
  TANK: {
    name: "TANK", tier: 1, hp: 180, speed: 4.4, weapon: "mace",
    dmg: 26, chargeDmg: 55, range: 2.3, chargeTime: 1.2, lunge: 2.5, armor: 0.65,
    abilities: [
      { key: "C", icon: "shield", cd: 9,  label: "BARRIÈRE" },
      { key: "E", icon: "burst", cd: 12, label: "SECOUSSE" },
    ],
  },
  ASSASSIN: {
    name: "ASSASSIN", tier: 1, hp: 80, speed: 6.8, weapon: "daggers",
    dmg: 15, chargeDmg: 32, range: 2.1, chargeTime: 0.6, lunge: 6,
    abilities: [
      { key: "C", icon: "dash", cd: 4,   label: "PAS OMBRE" },
      { key: "E", icon: "burst", cd: 8,  label: "ÉVENTRAIL" },
    ],
  },
  SENTINELLE: { name: "SENTINELLE", tier: 2, hp: 200, speed: 5.0, weapon: "sword", dmg: 28, chargeDmg: 60, range: 2.6, chargeTime: 0.9, lunge: 3, armor: 0.6,
    abilities: [ { key: "C", icon: "shield", cd: 8, label: "BARRIÈRE" }, { key: "E", icon: "burst", cd: 11, label: "SECOUSSE" } ] },
  BERSERKER: { name: "BERSERKER", tier: 2, hp: 140, speed: 6.0, weapon: "sword", dmg: 32, chargeDmg: 70, range: 2.8, chargeTime: 0.8, lunge: 5,
    abilities: [ { key: "C", icon: "slash", cd: 4, label: "LAME FILAIRE" }, { key: "E", icon: "dash", cd: 6, label: "CHARGE SAUVAGE" } ] },
  CHASSEUR: { name: "CHASSEUR", tier: 2, hp: 100, speed: 7.2, weapon: "daggers", dmg: 20, chargeDmg: 40, range: 2.2, chargeTime: 0.5, lunge: 7,
    abilities: [ { key: "C", icon: "dash", cd: 3, label: "PAS OMBRE" }, { key: "E", icon: "burst", cd: 7, label: "MARQUE FATALE" } ] },
};

// Matrice de fusion : âme de la victime + classe du récupérateur => classe fusionnée
export const FUSION_MATRIX = {
  "WARRIOR+TANK": "SENTINELLE",
  "TANK+WARRIOR": "SENTINELLE",
  "WARRIOR+ASSASSIN": "CHASSEUR",
  "ASSASSIN+WARRIOR": "CHASSEUR",
  "TANK+ASSASSIN": "BERSERKER",
  "ASSASSIN+TANK": "BERSERKER",
};

export function fusionClass(baseClass, soulClass) {
  return FUSION_MATRIX[`${baseClass}+${soulClass}`] || null;
}

export const ARENA = { size: 46, wall: 5 };
export const MATCH_TIME = 300;
export const CAPTURE_RADIUS = 5.5;
export const SOUL_PICKUP_RADIUS = 1.6;
export const RESPAWN_DELAY = 4000;
