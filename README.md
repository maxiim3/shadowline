# Shadowline

Prototype jouable d’un jeu d’action-infiltration 2D rétrofuturiste. La V1 ouvre directement sur **Nightshift**, un immeuble en coupe à caméra fixe : il n’y a ni landing page ni menu marketing.

## Jouer

```bash
npm install
npm run dev
```

Ouvrir ensuite l’URL affichée par Vite.

## Contrôles V1

- `A` / `D` : se déplacer
- `S` : s’accroupir, ramper, ou descendre une échelle
- `W` : se relever ou monter une échelle / un escalier
- `Espace` : sauter
- `R` : interagir, ramasser, neutraliser
- `T` : sortir / ranger l’arme
- clic droit : viser et tirer quand l’arme est sortie
- clic gauche : lancer une diversion sonore

## Boucle jouable

1. Partir du point A au rez-de-chaussée et atteindre le point B sur le toit.
2. Lire l’immeuble entier : escalier intérieur, échelles, escalier extérieur, ventilation et porte sécurisée sont autant de routes.
3. Éviter, distraire ou neutraliser les gardes ; se cacher dans les zones sombres ; couper les caméras si nécessaire.
4. Récupérer la carte d’accès, utiliser la ventilation, ou contourner par l’extérieur.
5. Rejoindre la balise d’extraction.

## Vérifications

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Suite prévue

La spécification complète se trouve dans [plan-jeu-infiltration-2d-react.md](./plan-jeu-infiltration-2d-react.md). La prochaine itération développera les animations, les patterns de patrouille, le son, les objets contextuels et une seconde mission.
