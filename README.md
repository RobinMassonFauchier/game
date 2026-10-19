# AETHER CLASH — FPS PvP Tactique (sans armes à feu)

Jeu web 3D first-person — combat médiéval-fantastique avec lames d'énergie, boucliers et magie arcanique. Mécanique de fusion d'âmes à la mort.

## Stack
- Three.js (moteur 3D, via import map ESM)
- Vite (dev server + build)
- Vanilla JS modulaire (`src/js/`)

## Lancer le jeu
```bash
npm install
npm run dev
```
Puis ouvrir l'URL locale affichée par Vite.

## Build production
```bash
npm run build
npm run preview
```

## Contrôles
- **ZQSD** : déplacement (AZERTY)
- **Souris** : caméra
- **Clic gauche (rapide)** : attaque de base
- **Maintenir clic gauche** : attaque chargée
- **A / E** (sur le clavier) : capacités de classe (cooldown)
- **Espace** : saut
- **Maj** : sprint

## Classes (Beta)
- **Guerrier ★** — épée d'énergie à deux mains, équilibré
- **Tank ★** — grand bouclier + masse, défense lourde
- **Assassin ★** — dagues arcaniques, mobilité

Fusion d'âmes : récupérer une âme cristallisée sur le sol débloque une classe supérieure (★★ Sentinelle, Berserker, Chasseur).

## Roadmap
- [x] Étape 1 — Moteur FPS (ZQSD, saut, souris), arène, zone de capture, réceptacle d'âme
- [x] Étape 2 — Combat (attaque rapide + chargée), vue des mains/armes, bots
- [x] Étape 3 — Drop d'âme à la mort, matrice de fusion
- [x] Étape 4 — HUD sombre/ambre (minimap, scores, journal des âmes)
