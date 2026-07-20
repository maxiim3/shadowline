# Shadowline

Prototype jouable d’un jeu d’action-infiltration 2D rétrofuturiste. La V1 ouvre directement sur la **Stealth Lab** : il n’y a ni landing page ni menu marketing.

## Jouer

```bash
npm install
npm run dev
```

Ouvrir ensuite l’URL affichée par Vite.

## Contrôles V1

- `A` / `D` : se déplacer
- `Espace` : sauter
- `Maj` : courir (plus bruyant)
- `S` : s’accroupir et réduire son exposition
- `E` : interagir avec le générateur, la porte ou le terminal
- clic souris : lancer une diversion sonore
- `R` : recommencer après une mission terminée ou compromise

## Boucle jouable

1. Traverser la Stealth Lab sans faire monter la détection.
2. Couper le courant ou exploiter les zones sombres.
3. Ouvrir la porte de service.
4. Récupérer les données au terminal.
5. Rejoindre l’extraction à droite.

## Vérifications

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Suite prévue

La spécification complète se trouve dans [plan-jeu-infiltration-2d-react.md](./plan-jeu-infiltration-2d-react.md). La prochaine itération remplacera les formes de prototype par une première passe graphique et améliorera l’IA, la navigation verticale et les interactions contextuelles.
