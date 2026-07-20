# Plan détaillé — Jeu d’action-infiltration 2D pour navigateur

Version : 0.1  
Statut : spécification de préproduction, aucune implémentation commencée  
Nom de travail : **Project Shadowline** (provisoire)

---

## 1. Objet de ce document

Ce document doit permettre à un développeur ou à un modèle d’IA moins puissant d’implémenter le projet progressivement, sans devoir redéfinir le produit ou l’architecture à chaque étape.

Il décrit :

- la vision du jeu ;
- le périmètre exact de la première version jouable ;
- les règles des principaux systèmes de gameplay ;
- l’architecture technique cible ;
- la structure des niveaux et des données ;
- l’ordre d’implémentation ;
- les critères d’acceptation de chaque lot ;
- la stratégie de test et les limites à respecter.

Ce document ne contient pas d’implémentation. Les exemples de noms de modules, événements et données sont des contrats de conception, pas du code prêt à copier.

### Règle de conduite pour l’implémentation

Le projet doit avancer **ticket par ticket**. Pour chaque ticket :

1. lire le ticket et ses dépendances ;
2. inspecter l’état réel du dépôt ;
3. annoncer les fichiers qui seront touchés ;
4. implémenter uniquement le périmètre demandé ;
5. ajouter ou adapter les tests concernés ;
6. exécuter le typage, le lint, les tests et le build ;
7. documenter les écarts ou blocages ;
8. attendre la validation avant le ticket suivant.

Un modèle ne doit jamais profiter d’un ticket pour réécrire l’architecture, ajouter une dépendance ou développer une fonctionnalité ultérieure sans autorisation explicite.

---

## 2. Hypothèses structurantes

Ces hypothèses servent de base tant qu’elles ne sont pas explicitement modifiées.

| Sujet | Décision initiale |
| --- | --- |
| Plateforme | Navigateur desktop |
| Mode de jeu | Solo |
| Caméra | Vue latérale 2D avec profondeur visuelle et parallaxe |
| Distribution | Jeu accessible par URL, sans installation obligatoire |
| Contrôles | Clavier/souris et manette |
| Orientation | Action-infiltration systémique |
| Durée d’une mission | 20 à 40 minutes à terme |
| Premier livrable | Vertical slice de 15 à 20 minutes |
| Direction artistique | Série animée d’espionnage rétro 80–90, tech-noir plus coloré |
| Structure spatiale | Bâtiments en coupe mêlant intérieur, façade, rue, toit et sous-sol |
| Violence | Approches non létales privilégiées ; létal possible plus tard |
| Mobile | Hors périmètre initial |
| Multijoueur | Hors périmètre initial |

### Avertissement sur le multijoueur

Si le jeu doit finalement proposer du coopératif ou du compétitif en temps réel, cette décision doit être prise **avant l’implémentation avancée de la simulation**. Le réseau ne pourra pas être ajouté proprement à la fin sans modifier la gestion du temps, de l’autorité, de l’IA, de la physique et des sauvegardes.

Le terme « en ligne » signifie donc ici : **jouable en ligne depuis un navigateur**, et non multijoueur.

---

## 3. Vision produit

### 3.1 Proposition centrale

Un jeu d’action-infiltration en 2D où le joueur traverse des environnements rétrofuturistes fortement interactifs. Il observe les patrouilles, exploite les ombres et le bruit, manipule les installations, se déplace avec fluidité et improvise lorsque son plan échoue.

Formule courte :

> Un dessin animé d’espionnage rétro des années 80–90 transformé en immersive sim 2D.

### 3.2 Inspirations fonctionnelles

Les références servent à identifier des qualités, jamais à reproduire leurs personnages, interfaces, décors ou éléments protégés.

| Référence | Qualité recherchée |
| --- | --- |
| Splinter Cell | Ombre, bruit, observation, vulnérabilité du joueur |
| Metal Gear Solid | Visée, neutralisation, gadgets, escalade progressive des alertes |
| Prince of Persia | Fluidité, verticalité, lisibilité du level design, plaisir du mouvement |
| Spider-Man animé 80–90 | Architecture urbaine dessinée, dynamisme, couleurs nocturnes |
| Inspecteur Gadget | Rétrofuturisme, technologie analogique, gadgets lisibles et légèrement décalés |

### 3.3 Fantaisie offerte au joueur

Le joueur doit avoir l’impression d’être :

- agile mais vulnérable ;
- intelligent plutôt que surarmé ;
- capable de comprendre et détourner un lieu ;
- récompensé pour l’observation et l’improvisation ;
- responsable des conséquences de ses actions.

### 3.4 Boucle principale

1. **Observer** les lieux, les gardes, la lumière et les appareils.
2. **Choisir** une route et préparer une diversion.
3. **S’infiltrer** en utilisant mouvement, ombre et couverture.
4. **Manipuler** le décor ou les systèmes de sécurité.
5. **Éviter ou neutraliser** les menaces.
6. **Improviser** en cas de suspicion ou d’alerte.
7. **Atteindre l’objectif**, puis s’exfiltrer.
8. **Recevoir un bilan** décrivant le style de jeu, sans imposer une seule bonne méthode.

### 3.5 Piliers de conception

#### Infiltration lisible

Le joueur doit comprendre pourquoi il est visible, entendu ou recherché. Une détection ne doit jamais sembler aléatoire.

#### Environnement systémique

Les objets ne doivent pas être de simples animations contextuelles. Une porte fermée modifie la vision et le son ; une lumière éteinte modifie l’exposition ; une alarme influence les gardes ; une machine produit du bruit exploitable.

#### Mouvement agréable

Le déplacement doit être plaisant dans une pièce vide. L’agilité n’annule pas la vulnérabilité : courir et sauter rendent le joueur plus rapide, mais aussi plus visible et bruyant.

#### Échec récupérable

La détection ouvre une nouvelle phase de jeu au lieu de provoquer immédiatement un écran d’échec. Le joueur peut fuir, se cacher, tromper les gardes et revenir au calme.

#### Choix tactiques

Chaque grande zone doit proposer au moins une approche discrète, une approche environnementale et une approche plus directe.

---

## 4. Objectifs et hors périmètre

### 4.1 Objectifs de la vertical slice

La vertical slice doit prouver les points suivants :

- le mouvement est précis et agréable ;
- lumière, bruit et IA forment une boucle cohérente ;
- le joueur comprend les réactions ennemies ;
- plusieurs systèmes peuvent interagir ;
- le mélange intérieur/extérieur fonctionne en vue latérale ;
- la direction artistique possède une identité propre ;
- une mission courte peut être rejouée de plusieurs façons ;
- les performances restent stables dans un navigateur moderne.

### 4.2 Hors périmètre de la vertical slice

Ne pas développer :

- de monde ouvert ;
- de génération procédurale ;
- de campagne complète ;
- de multijoueur ;
- de version mobile ;
- de boutique ou paiement ;
- de crafting ;
- d’arbre de compétences ;
- de système de dialogue complexe ;
- de dizaines d’armes et gadgets ;
- de boss ;
- de véhicules pilotables ;
- de météo dynamique complète ;
- de destruction généralisée ;
- de backend tant qu’un besoin produit réel ne le justifie pas.

### 4.3 Fonctionnalités reportées après validation

- gardes spécialisés ;
- armes létales ;
- combat rapproché avancé ;
- inventaire étendu ;
- blessures localisées ;
- score mondial ;
- comptes utilisateurs et sauvegarde cloud ;
- niveaux supplémentaires ;
- narration ramifiée ;
- coopération en ligne.

---

## 5. Vertical slice : mission de référence

### 5.1 Pitch de la mission

Le joueur doit pénétrer dans une usine-laboratoire rétrofuturiste au cœur d’une ville nocturne, récupérer une bobine de données expérimentale, puis rejoindre un train aérien avant son départ.

Le bâtiment est présenté en coupe. La progression alterne entre ruelle, façade, bureaux, atelier, laboratoire souterrain et toits.

### 5.2 Durée et contenu

- Première partie : 15 à 20 minutes.
- Rejeu connaissant le niveau : 7 à 12 minutes.
- 4 zones principales.
- 3 à 5 gardes actifs simultanément.
- 1 caméra de sécurité.
- 1 alarme locale.
- 1 circuit électrique manipulable.
- 1 arme non létale à munitions limitées.
- 1 objet de diversion réutilisable ou plusieurs objets jetables.
- 2 checkpoints.
- 1 objectif principal.
- 1 objectif secondaire facultatif.
- 1 écran de bilan.

### 5.3 Découpage spatial

#### Zone A — Ruelle et toits

Fonction : tutoriel implicite du mouvement et de l’observation.

Éléments :

- ruelle pluvieuse ;
- enseignes lumineuses ;
- escaliers de secours ;
- corniches et gouttières ;
- fenêtre entrouverte ;
- quai de livraison ;
- premier garde isolé.

Routes :

- toit et fenêtre : agile et discrète ;
- quai de livraison : directe mais surveillée ;
- maintenance électrique extérieure : permet d’éteindre une partie du bâtiment.

#### Zone B — Bureaux art déco

Fonction : introduire portes, lumière, distraction et cachettes.

Éléments :

- hall en double hauteur ;
- bureaux vitrés ;
- téléphone analogique ;
- stores et interrupteurs ;
- casiers ou placards ;
- caméra couvrant un couloir.

Routes :

- passerelle haute ;
- bureaux et zones d’ombre ;
- conduit technique derrière les murs.

#### Zone C — Atelier industriel

Fonction : développer le bruit et les interactions combinées.

Éléments :

- machines cycliques ;
- passerelles métalliques ;
- monte-charge ;
- chaînes suspendues ;
- générateur ;
- surfaces produisant différents niveaux de bruit.

Le joueur peut masquer ses pas avec une machine, déclencher volontairement un cycle bruyant ou couper l’alimentation pour créer de l’obscurité.

#### Zone D — Laboratoire et extraction

Fonction : combiner tous les systèmes.

Éléments :

- laboratoire souterrain ;
- coffre ou terminal contenant l’objectif ;
- alarme locale ;
- deux routes de sortie ;
- remontée par ascenseur de service ou conduit ;
- course finale contrôlée vers le train aérien.

L’extraction ne doit pas devenir une séquence de combat obligatoire. Une alerte peut rendre la sortie plus difficile, mais le joueur conserve une option d’évasion.

### 5.4 Styles de réussite reconnus

Le bilan peut attribuer plusieurs qualificatifs indépendants :

- **Fantôme** : aucune détection complète ;
- **Ombre** : aucun garde neutralisé ;
- **Saboteur** : plusieurs systèmes du décor exploités ;
- **Improvisateur** : alertes déclenchées puis maîtrisées ;
- **Précis** : peu d’actions inutiles, tirs non létaux maîtrisés.

Ces qualificatifs doivent informer le joueur, pas déterminer une note punitive unique.

---

## 6. Direction artistique et sonore

### 6.1 Identité visuelle

La direction artistique combine :

- dessin animé d’aventure et d’espionnage des années 80–90 ;
- ville rétrofuturiste imaginée depuis cette époque ;
- ambiance nocturne lisible ;
- technologies analogiques surdimensionnées ;
- architecture art déco, industrielle et urbaine ;
- profondeur obtenue par parallaxe et silhouettes.

Elle doit rester originale. Ne pas reproduire un costume, un visage, un véhicule, un gadget, une typographie ou un décor identifiable provenant d’une œuvre existante.

### 6.2 Palette fonctionnelle

| Usage | Famille colorée |
| --- | --- |
| Nuit et zones sûres | Bleu profond, indigo, violet désaturé |
| Ombres jouables | Bleu-noir, contours froids |
| Technologie neutre | Vert cathodique, cyan pâle |
| Interactions importantes | Jaune chaud ou ivoire, avec parcimonie |
| Suspicion | Ambre |
| Alerte et danger | Rouge orangé |
| Extérieurs urbains | Reflets cyan, magenta et jaune dans la pluie |

La couleur seule ne doit jamais porter une information indispensable. Icône, animation, son et forme doivent compléter le signal.

### 6.3 Traitement graphique

- Contours marqués mais variables selon la profondeur.
- Personnages lisibles en silhouette.
- Animation du personnage pouvant rappeler une animation dessinée à 12 ou 15 images par seconde, tandis que la simulation et la caméra restent fluides à 60 Hz.
- Décors en couches : arrière-plan, architecture jouable, accessoires, premier plan.
- Ombres visuelles cohérentes avec les zones de gameplay sans devoir être physiquement exactes.
- Effets limités et lisibles : pluie, vapeur, poussière, néons, arcs électriques.
- Premier plan sombre servant ponctuellement de cache visuelle, sans masquer les informations importantes.

### 6.4 Mélange intérieur/extérieur

Les bâtiments sont conçus comme des maisons de poupée ou des décors de théâtre en coupe :

- façade visible puis partiellement ouverte lorsque la caméra s’approche ;
- fenêtres utilisables ;
- balcons et enseignes accessibles ;
- escaliers de secours ;
- conduits reliant plusieurs étages ;
- transitions continues vers le toit, la rue et le sous-sol ;
- arrière-plan urbain animé pour donner une impression de ville vivante.

### 6.5 Audio

Le son est à la fois esthétique et fonctionnel.

Catégories :

- pas selon la surface ;
- frottement des vêtements ;
- portes et mécanismes ;
- machines industrielles ;
- gadgets ;
- réactions vocales des gardes ;
- ambiance urbaine ;
- musique adaptative.

La musique possède trois intensités : calme, tension, alerte. Les transitions doivent être progressives. Les sons utilisés par l’IA doivent rester identifiables dans le mix.

---

## 7. Contrôles et règles d’entrée

Tous les contrôles passent par des **actions abstraites**. Les systèmes de gameplay ne doivent jamais dépendre directement d’une touche physique.

### 7.1 Actions principales

| Action | Clavier/souris proposé | Manette proposée |
| --- | --- | --- |
| Déplacement horizontal | A/D ou gauche/droite | Stick gauche |
| Monter/descendre | W/S ou haut/bas | Stick gauche vertical |
| Orientation de visée | Position de la souris | Stick droit |
| Saut/traversée | Espace | A / bouton bas |
| Accroupissement/descente | Ctrl ou C | B / bouton droit |
| Course | Maj maintenu | LB / bumper gauche |
| Interaction/neutralisation | E | X / bouton gauche |
| Visée | Clic droit maintenu | LT / gâchette gauche |
| Tir/utilisation du gadget | Clic gauche | RT / gâchette droite |
| Sélection de gadget | Q ou molette | RB / bumper droit |
| Rechargement | R | Y / bouton haut |
| Objectifs | Tab | Bouton vue |
| Pause | Échap | Bouton menu |

Ce mapping constitue la valeur par défaut à implémenter. Il pourra être ajusté après un test de confort, sans modifier les actions abstraites utilisées par le gameplay.

### 7.2 Principes d’entrée

- Remappage prévu dès la conception, même si l’écran complet arrive plus tard.
- Aucun système ne doit lire directement `KeyboardEvent.code` ou un bouton de manette hors du module d’entrée.
- Les actions possèdent les états `pressed`, `held` et `released`.
- Prévoir un buffer d’entrée court pour le saut et les actions contextuelles.
- Prévoir un léger « coyote time » pour rendre les sauts plus agréables.
- Lorsque l’interface bloque le jeu, les commandes de gameplay ne doivent pas traverser le menu.
- La souris vise dans les coordonnées du monde, jamais uniquement dans celles de l’écran.

---

## 8. Système de déplacement

### 8.1 Choix technique

Utiliser un **contrôleur cinématique maîtrisé**, et non une simulation physique réaliste du personnage. L’objectif est la précision et la prévisibilité.

La vertical slice n’utilise pas Rapier. Les collisions statiques, capteurs, plateformes et mouvements scriptés suffisent. Une bibliothèque physique avancée ne sera ajoutée que si un cas concret ne peut pas être résolu proprement.

### 8.2 États de locomotion

Éviter une machine à états unique combinant toutes les possibilités. Séparer :

#### Locomotion

- `idle`
- `walk`
- `run`
- `crouchIdle`
- `crouchWalk`
- `jump`
- `fall`
- `land`
- `roll`
- `hang`
- `climb`
- `ladder`
- `vault`
- `disabled`

#### Action superposée

- `none`
- `aim`
- `interact`
- `takedown`
- `useGadget`
- `dragBody`
- `hurt`

### 8.3 Contraintes entre états

| Situation | Autorisé | Interdit |
| --- | --- | --- |
| Accroupi | marcher, interagir, viser | courir, saut long |
| Suspendu | se déplacer latéralement, grimper, lâcher | tirer lors de la première version |
| En l’air | corriger légèrement la trajectoire | interagir avec un terminal |
| En visée | marcher lentement, s’accroupir | courir, rouler, franchir |
| En neutralisation | terminer ou être interrompu | autre interaction simultanée |
| En traction d’un corps | marcher lentement, lâcher | sauter, courir, viser |

### 8.4 Aides de contrôle

- Coyote time cible : environ 80 à 120 ms, valeur ajustable.
- Buffer de saut : environ 100 ms.
- Accélération et décélération configurables.
- Tolérance d’accrochage aux corniches pour éviter les ratés frustrants.
- Correction légère de position pendant les franchissements contextuels.
- Contrôle aérien limité mais présent.

Toutes ces valeurs doivent être regroupées dans une configuration de tuning et ne pas être dispersées dans les classes.

### 8.5 Bruit généré par le déplacement

| Action | Intensité relative initiale |
| --- | ---: |
| Immobile | 0 |
| Marche accroupie | 0,25 |
| Marche | 0,55 |
| Course | 1,00 |
| Réception légère | 0,65 |
| Réception lourde | 1,20 |
| Roulade | 0,75 |
| Franchissement | 0,50 |

L’intensité finale est multipliée par le matériau du sol.

---

## 9. Système de lumière et visibilité

### 9.1 Principe fondamental

La lumière visible à l’écran et la valeur utilisée par le gameplay doivent rester cohérentes, mais séparées techniquement.

Le système de gameplay repose sur des volumes ou sources de lumière déterministes placés dans le niveau. Les shaders et effets visuels illustrent ensuite cette information. Cette séparation évite qu’un effet graphique complexe produise une détection imprévisible.

### 9.2 Exposition du joueur

L’exposition est une valeur normalisée entre 0 et 1.

Évaluation initiale :

1. lire l’éclairage ambiant de la zone ;
2. calculer la contribution des lumières actives touchant les points de contrôle du joueur ;
3. vérifier les occlusions simples ;
4. appliquer les modificateurs de posture et de mouvement ;
5. ajouter éventuellement un contraste de silhouette ;
6. borner le résultat entre 0 et 1.

Points de contrôle recommandés : pieds, torse, tête. Pour la première version, le torse peut suffire si les trois points rendent le système instable.

### 9.3 Modificateurs de départ

| Facteur | Modificateur proposé |
| --- | ---: |
| Accroupi | × 0,75 |
| Debout immobile | × 0,80 |
| Marche | × 1,00 |
| Course | × 1,25 |
| Visée immobile | × 0,90 |
| Silhouette devant un fond lumineux | + 0,10 à 0,20 |

Ces valeurs sont des points de départ et doivent être réglables.

### 9.4 Perception visuelle d’un garde

La vitesse de détection dépend de :

- l’exposition du joueur ;
- la distance ;
- la position dans le cône de vision ;
- la vitesse de mouvement ;
- la présence d’un obstacle ;
- l’état actuel du garde.

Formule conceptuelle :

`perception = exposition × distanceFactor × angleFactor × motionFactor`

Valeurs initiales :

- `distanceFactor` diminue progressivement entre la distance de vision parfaite et la distance maximale ;
- `angleFactor` vaut environ 1 au centre du regard et descend vers 0,4 en bordure ;
- `motionFactor` vaut environ 0,7 immobile, 1 en marche et 1,35 en course ;
- hors ligne de vue, la perception immédiate vaut 0 ;
- à très courte distance, un minimum de perception empêche de devenir invisible devant un garde.

Le garde accumule une jauge individuelle de détection :

- 0 à 0,34 : rien de confirmé ;
- 0,35 : réaction de suspicion ;
- 0,70 : déplacement ou focalisation vers la cible ;
- 1,00 : détection confirmée et mémorisation de la position.

La jauge diminue progressivement lorsque le joueur disparaît, sans effacer immédiatement la mémoire du garde.

### 9.5 Retour joueur

- Indicateur discret d’exposition dans le HUD.
- Animation ou contour du personnage légèrement différent en pleine ombre.
- Icône de suspicion au-dessus du garde.
- Direction du regard lisible par la pose.
- Son distinct lors du passage entre suspicion et détection.
- Option d’accessibilité renforçant le contraste des zones sûres.

---

## 10. Système de bruit

### 10.1 Modèle d’événement sonore

Toute action audible produit un événement contenant au minimum :

- identifiant ;
- position dans le monde ;
- catégorie ;
- intensité de base ;
- rayon maximal ;
- source ;
- instant d’émission ;
- indicateur permettant ou non aux gardes de l’identifier.

Catégories initiales :

- pas ;
- réception ;
- porte ;
- objet lancé ;
- machine ;
- gadget ;
- tir ;
- alarme ;
- voix.

### 10.2 Surfaces

| Surface | Multiplicateur initial |
| --- | ---: |
| Tapis | 0,55 |
| Béton | 0,90 |
| Bois | 1,00 |
| Métal | 1,35 |
| Verre ou débris | 1,60 |
| Eau peu profonde | 1,25 |

### 10.3 Propagation simplifiée

Pour la vertical slice :

1. calculer le rayon après modificateurs ;
2. tester la distance entre l’événement et chaque garde pertinent ;
3. appliquer une pénalité si une porte fermée ou un mur sépare la source ;
4. ignorer les gardes hors du rayon effectif ;
5. transmettre aux autres un stimulus avec position et confiance.

Ne pas simuler acoustiquement tout le bâtiment. Une propagation par graphe de pièces pourra être ajoutée seulement si la version simplifiée ne suffit pas.

### 10.4 Réaction des gardes

- Bruit faible : regarder vers la source.
- Bruit ambigu répété : augmenter la suspicion.
- Bruit notable : se déplacer vers la source.
- Tir ou alarme : passer directement en alerte locale.
- Bruit identifié comme une machine normale : aucune réaction, sauf contexte inhabituel.

Le garde doit mémoriser la position entendue, pas connaître la position réelle du joueur.

### 10.5 Outils de debug obligatoires

- cercle du rayon initial ;
- rayon modifié après surface et obstacle ;
- ligne vers chaque garde ayant reçu le stimulus ;
- catégorie et intensité affichées ;
- historique court des événements.

---

## 11. Intelligence artificielle des gardes

### 11.1 Architecture conceptuelle

Chaque garde possède :

1. des **capteurs** visuels et auditifs ;
2. une **mémoire** locale ;
3. une **machine à états hiérarchique** ;
4. un contrôleur de déplacement ;
5. des animations et signaux de feedback.

Ne pas commencer avec un behavior tree généraliste. Une machine à états explicite est plus facile à tester et suffisante pour la vertical slice.

### 11.2 États

| État | Comportement | Sorties principales |
| --- | --- | --- |
| `patrol` | Suit sa route, pauses et regards | stimulus → `suspicious` ou `investigate` |
| `suspicious` | S’arrête, regarde, verbalise | confirmation → `investigate`; expiration → `patrol` |
| `investigate` | Se rend à la source entendue ou aperçue | joueur vu → `alert`; arrivée → `search` |
| `search` | Inspecte des points proches de la dernière position connue | joueur vu → `alert`; délai → `return` |
| `alert` | Poursuit, se met à couvert simplement, appelle de l’aide | joueur perdu → `search` |
| `return` | Revient à sa route | arrivée → `patrol`; stimulus → état adapté |
| `unconscious` | Ne perçoit et ne se déplace plus | réveil futur éventuel, hors vertical slice |

### 11.3 Mémoire minimale

- état courant ;
- niveau de suspicion ;
- dernière position connue du joueur ;
- instant du dernier contact visuel ;
- dernière position entendue ;
- nature du dernier stimulus ;
- point de patrouille courant ;
- connaissance éventuelle d’une alarme locale ;
- état neutralisé ou actif.

### 11.4 Navigation

Utiliser un **graphe de navigation 2D placé par le level designer**, pas un navmesh généraliste.

Types de nœuds :

- sol ;
- point d’attente ;
- escalier ;
- échelle autorisée aux gardes ;
- porte ;
- point de recherche ;
- poste d’alarme.

Les gardes n’utilisent pas tous les mouvements du joueur. Dans la vertical slice, ils peuvent marcher, courir, ouvrir certaines portes et emprunter les escaliers. Ils ne sautent pas entre les toits.

Le calcul d’itinéraire peut utiliser A* sur ce petit graphe.

### 11.5 Communication et alerte

- Une détection est locale par défaut.
- Un garde peut crier ou utiliser une radio dans un rayon défini.
- Une alarme informe tous les gardes de la zone, pas nécessairement du bâtiment entier.
- Les gardes alertés reçoivent la dernière position connue, jamais la position courante invisible du joueur.
- Après perte du joueur, ils fouillent puis reviennent progressivement à une vigilance élevée avant le calme complet.

### 11.6 Règles d’équité

- Aucun garde ne voit à travers un obstacle opaque.
- Aucun garde ne partage instantanément une information sans moyen explicite.
- Les changements d’état importants déclenchent une animation, une icône ou une réplique.
- La dernière position connue peut être visualisée en debug.
- Les rotations instantanées à 180 degrés sont interdites hors événement justifié.
- Un garde ne doit pas détecter le joueur pendant une transition cinématique non contrôlée.

---

## 12. Interactions avec le décor

### 12.1 Principe

Les objets interactifs exposent des capacités et conditions, plutôt que de créer une logique spéciale dans le joueur pour chaque type d’objet.

Chaque interaction décrit :

- l’action disponible ;
- la distance maximale ;
- l’orientation requise ;
- les états du joueur compatibles ;
- la durée ;
- le bruit produit ;
- l’effet sur le monde ;
- l’animation ou le feedback ;
- la possibilité d’interruption.

### 12.2 Interactions de la vertical slice

| Objet | Actions | Effet systémique |
| --- | --- | --- |
| Porte | ouvrir, fermer, éventuellement verrouiller | collision, vision, bruit, navigation |
| Interrupteur | activer/désactiver | lumière liée |
| Boîtier électrique | couper/rétablir | groupe de lumières ou machine |
| Téléphone | déclencher un appel | bruit attirant un garde |
| Objet léger | prendre/lancer | bruit à l’impact |
| Placard/cachette | entrer/sortir | visibilité fortement réduite |
| Terminal caméra | désactiver/réactiver | caméra liée |
| Machine | démarrer/arrêter | bruit de masque et lumière éventuelle |
| Corps inconscient | saisir, déplacer, lâcher | découverte potentielle par les gardes |
| Conteneur | cacher un corps | retire le corps de la perception normale |
| Objectif | récupérer | met à jour la mission et la sortie |

### 12.3 Résolution de la cible contextuelle

Lorsqu’une interaction est demandée :

1. collecter les cibles dans le rayon ;
2. supprimer les cibles dont les conditions ne sont pas remplies ;
3. classer selon priorité, distance et orientation ;
4. sélectionner la meilleure ;
5. afficher son libellé ;
6. permettre de changer de cible si plusieurs objets sont très proches.

Ordre de priorité initial :

1. action critique de sécurité ou neutralisation ;
2. objectif de mission ;
3. interaction de déplacement ;
4. dispositif ;
5. objet transportable ;
6. interaction purement informative.

### 12.4 Chaînes systémiques à démontrer

La vertical slice doit permettre au moins ces combinaisons :

- couper le courant → éteindre une zone → modifier l’itinéraire ou la perception d’un garde ;
- lancer un objet → attirer un garde → passer derrière lui ;
- activer une machine → masquer des pas métalliques ;
- fermer une porte → réduire la ligne de vue et atténuer un bruit ;
- neutraliser un garde → déplacer son corps → éviter sa découverte.

---

## 13. Visée, gadgets et neutralisation

### 13.1 Visée

- Visée libre à la souris dans le plan 2D.
- Au joystick, réticule orienté par le stick droit.
- Passage en visée réduisant la vitesse.
- Ligne ou laser discret indiquant la direction, si cohérent avec l’équipement.
- Réticule changeant lorsque la trajectoire est bloquée ou qu’une cible valide est atteinte.
- Aucun tir automatique assisté pendant la première version.

### 13.2 Arme non létale initiale

Une arme à fléchettes tranquillisantes suffit pour la vertical slice.

Règles proposées :

- 3 munitions au départ ;
- tir discret mais pas totalement silencieux ;
- impact à la tête : neutralisation rapide ;
- impact au torse : neutralisation après un court délai, pendant lequel le garde peut réagir ;
- tir manqué : impact sonore pouvant attirer l’attention ;
- aucune récupération automatique des munitions.

Le système de projectile peut être simulé par un raycast ou un projectile très rapide. Choisir l’option la plus prévisible et testable.

### 13.3 Neutralisation rapprochée

Conditions :

- joueur derrière le garde ;
- distance courte ;
- garde inconscient de la présence immédiate du joueur ;
- joueur au sol et dans un état compatible ;
- aucune obstruction.

Résultat :

- animation courte ;
- bruit faible ;
- garde inconscient ;
- action interruptible si un autre danger intervient avant le point de validation ;
- possibilité de déplacer ensuite le corps.

### 13.4 Combat ouvert

Le combat ouvert complet est hors périmètre. En alerte, le joueur doit surtout :

- fuir ;
- fermer des portes ;
- changer d’étage ;
- créer une diversion ;
- utiliser sa munition non létale ;
- se cacher jusqu’à la phase de recherche.

Cette limite protège le cœur infiltration et évite de devoir développer prématurément armes, dégâts, couvertures et ennemis de combat.

---

## 14. Caméras, alarmes et dispositifs

### 14.1 Caméra de sécurité

- Balayage selon un arc visible.
- Cône de perception similaire à celui d’un garde, sans audition.
- Détection progressive.
- Peut être désactivée depuis un terminal ou via le courant.
- En détection complète, déclenche l’alarme de sa zone.
- État lisible par lumière, mouvement et son.

### 14.2 Alarme

États :

- `idle`
- `warning`
- `active`
- `disabled`

Effets possibles lorsqu’elle est active :

- garde supplémentaire non requis dans la vertical slice ;
- changement des routes de patrouille ;
- fermeture de certaines portes ;
- éclairage rouge ;
- musique d’alerte ;
- activation d’un point de sortie alternatif.

Pour la vertical slice, limiter les effets à ceux réellement utiles : avertir les gardes de la zone, changer l’éclairage et modifier une ou deux portes.

### 14.3 Réseau électrique

Les dispositifs appartiennent à des groupes nommés. Un interrupteur ou boîtier peut changer l’état d’un groupe :

- lumières ;
- caméra ;
- machine ;
- porte motorisée.

Éviter une simulation électrique générale. Il suffit d’un système déclaratif de liens entre dispositifs.

---

## 15. Objectifs, checkpoints et sauvegarde

### 15.1 Objectifs

Types nécessaires :

- atteindre une zone ;
- interagir avec un objet ;
- récupérer une ressource ;
- s’exfiltrer ;
- objectif secondaire facultatif.

Un objectif possède :

- identifiant stable ;
- titre ;
- description ;
- état `locked`, `active`, `completed` ou `failed` ;
- préconditions ;
- événement de complétion ;
- objectif suivant éventuel.

### 15.2 Checkpoints

Deux checkpoints :

1. entrée dans les bureaux ;
2. entrée dans le laboratoire.

Une restauration recharge le niveau depuis son état de base puis applique un petit ensemble de mutations sauvegardées.

Données minimales :

- version du format ;
- mission et checkpoint ;
- objectifs terminés ;
- inventaire et munitions ;
- dispositifs persistants modifiés ;
- gardes neutralisés avant le checkpoint si nécessaire ;
- statistiques de mission ;
- paramètres utilisateur séparés.

Ne pas sérialiser directement des objets Phaser ou toute la scène.

### 15.3 Stockage initial

- Paramètres simples : stockage local du navigateur.
- Sauvegarde/checkpoint : stockage local structuré, avec version de schéma.
- Aucun compte ou backend pour la vertical slice.
- Prévoir une fonction de migration ou un effacement contrôlé lorsque la version de sauvegarde change.

---

## 16. Architecture technique

### 16.1 Stack

- React pour l’application et l’interface.
- TypeScript en mode strict, sans `any` explicite.
- Vite pour le développement et le build.
- Phaser pour le rendu 2D, les scènes, la caméra, les entrées bas niveau et l’audio.
- Vitest pour les tests unitaires.
- Playwright pour les tests navigateur critiques.
- Tiled avec export JSON pour les niveaux.
- ESLint et formatage automatique.

Au bootstrap, utiliser les versions stables disponibles, les verrouiller dans le lockfile et éviter les mises à jour opportunistes pendant la vertical slice.

### 16.2 Responsabilités

#### React

- écran de chargement ;
- menu principal ;
- paramètres ;
- HUD ;
- inventaire léger ;
- écran de pause ;
- écran de bilan ;
- erreurs de chargement.

#### Phaser

- canvas ;
- boucle de rendu ;
- scènes ;
- caméra ;
- sprites et animations ;
- particules ;
- audio spatial simple ;
- lecture des entrées bas niveau ;
- adaptation entre simulation et objets rendus.

#### Domaine TypeScript indépendant

- règles de perception ;
- bruit ;
- états d’IA ;
- interactions ;
- objectifs ;
- statistiques ;
- sauvegarde sérialisable ;
- événements de gameplay.

Le domaine ne doit pas importer React, Phaser ou le DOM.

### 16.3 Structure proposée

```text
src/
├── app/
│   ├── App
│   ├── routing
│   └── providers
├── ui/
│   ├── screens
│   ├── hud
│   ├── settings
│   └── shared
├── game/
│   ├── bootstrap
│   ├── bridge
│   ├── scenes
│   ├── runtime
│   ├── rendering
│   ├── input
│   ├── audio
│   └── debug
├── domain/
│   ├── player
│   ├── perception
│   ├── noise
│   ├── ai
│   ├── interactions
│   ├── devices
│   ├── mission
│   └── save
├── content/
│   ├── levels
│   ├── balance
│   ├── animations
│   └── localization
├── assets/
└── test/
```

Les noms peuvent être adaptés à la convention réelle du projet, mais les frontières de responsabilité doivent être conservées.

### 16.4 Pont React–jeu

Créer une interface unique entre React et le runtime du jeu.

React envoie des commandes de faible fréquence :

- démarrer une mission ;
- mettre en pause ;
- reprendre ;
- modifier un paramètre ;
- recharger un checkpoint ;
- quitter vers le menu.

Le jeu publie un snapshot UI limité :

- mission courante ;
- objectif ;
- exposition ;
- gadget sélectionné ;
- munitions ;
- état d’alerte global ;
- état pause/chargement ;
- statistiques nécessaires au bilan.

Le pont peut exposer conceptuellement :

- `dispatch(command)` ;
- `subscribe(listener)` ;
- `getSnapshot()` ;
- `destroy()`.

React ne doit jamais observer directement les positions de chaque entité ni être actualisé à chaque frame.

### 16.5 Temps et boucle de simulation

- Simulation à pas fixe, cible 60 Hz.
- Rendu découplé autant que possible.
- Limiter le nombre de pas de rattrapage après un onglet suspendu.
- Mettre correctement en pause la simulation lorsque le menu le demande.
- Utiliser un temps de jeu contrôlé, pas `Date.now()` directement dans les règles du domaine.
- Les timers d’IA et d’interaction dépendent du temps simulé.

### 16.6 Événements typés

Familles d’événements recommandées :

- `player.moved`
- `player.exposureChanged`
- `noise.emitted`
- `guard.stateChanged`
- `guard.playerDetected`
- `interaction.started`
- `interaction.completed`
- `device.stateChanged`
- `alarm.stateChanged`
- `objective.stateChanged`
- `checkpoint.reached`
- `mission.completed`

Chaque événement doit avoir un payload défini, sérialisable lorsque nécessaire. Ne pas utiliser un bus d’événements global sans propriétaire ni nettoyage des abonnements.

---

## 17. Données et éditeur de niveau

### 17.1 Tiled

Le niveau est construit dans Tiled et exporté en JSON.

Convention de couches :

1. `BackgroundFar`
2. `BackgroundNear`
3. `GameplayGeometry`
4. `Platforms`
5. `Occluders`
6. `Navigation`
7. `PatrolRoutes`
8. `LightVolumes`
9. `Interactables`
10. `Devices`
11. `Enemies`
12. `Objectives`
13. `Checkpoints`
14. `Foreground`

### 17.2 Propriétés importantes

Exemples de propriétés d’objet :

- `entityId` : identifiant stable et unique ;
- `entityType` : type d’entité ;
- `groupId` : groupe de dispositif ;
- `routeId` : route de patrouille ;
- `surfaceType` : matériau sonore ;
- `lightIntensity` : valeur 0 à 1 ;
- `initialState` : état de départ ;
- `interactionType` : action proposée ;
- `objectiveId` : objectif lié ;
- `checkpointId` : checkpoint lié.

### 17.3 Validation au chargement

Le chargement doit échouer proprement avec un message exploitable si :

- un identifiant est dupliqué ;
- un groupe référencé n’existe pas ;
- une route de patrouille est vide ;
- un type de surface est inconnu ;
- un objectif dépend d’un identifiant absent ;
- un checkpoint n’a pas d’identifiant ;
- une propriété obligatoire manque.

Ne pas laisser une donnée de niveau invalide produire une erreur obscure plusieurs minutes plus tard.

---

## 18. Interface et feedback

### 18.1 HUD minimal

- indicateur d’exposition ;
- gadget ou arme sélectionné ;
- munitions ;
- objectif courant ;
- niveau d’alerte de la zone ;
- interaction contextuelle ;
- réticule lorsque la visée est active.

Le HUD doit disparaître ou s’alléger lorsqu’une information n’est pas utile.

### 18.2 Feedback ennemi

- icône neutre ou absente en patrouille ;
- point d’interrogation ou forme équivalente en suspicion ;
- indication directionnelle vers le stimulus ;
- signal fort à la détection complète ;
- couleur et son différents pour recherche et alerte.

### 18.3 Menus nécessaires

- chargement ;
- menu principal ;
- nouvelle partie/continuer ;
- paramètres ;
- pause ;
- confirmation de retour au menu ;
- écran de bilan ;
- message d’erreur récupérable.

### 18.4 Accessibilité minimale

- remappage clavier ;
- volume séparé musique/effets/voix ;
- sous-titres pour les répliques utiles ;
- taille d’interface ajustable ;
- option de réduction des secousses et flashs ;
- alternative visuelle aux sons importants ;
- alternative à la couleur seule ;
- possibilité de ralentir légèrement la vitesse de détection dans une option d’assistance ;
- pause réelle en solo.

---

## 19. Outils de debug obligatoires

Les outils de debug font partie de la production, pas du polish final.

Un overlay activable doit pouvoir afficher séparément :

- FPS et temps de frame ;
- collisions ;
- capteurs du joueur ;
- points d’accrochage ;
- volumes de lumière ;
- score d’exposition ;
- cônes de vision ;
- jauges de détection ;
- rayons de bruit ;
- stimuli reçus ;
- état et mémoire des gardes ;
- graphe de navigation ;
- cibles interactives et priorité ;
- groupes de dispositifs ;
- objectifs et checkpoints.

Prévoir également :

- un journal filtrable des événements de gameplay ;
- une salle de test isolée appelée **Stealth Lab** ;
- la possibilité de replacer rapidement le joueur ;
- des commandes de debug pour figer l’IA, rendre le joueur invisible ou forcer un état d’alerte ;
- une configuration centrale des valeurs de tuning.

Ces fonctions doivent être exclues ou désactivées dans le build public selon une configuration explicite.

---

## 20. Performance et compatibilité

### 20.1 Cibles

- 60 images par seconde sur un ordinateur portable milieu de gamme.
- Firefox, Chrome, Edge et Safari desktop récents.
- Format principal 16:9, avec adaptation correcte aux écrans plus larges ou plus étroits.
- Temps de chargement initial raisonnable avec écran de progression.
- Reprise propre après perte de focus ou suspension d’onglet.

### 20.2 Budget de la vertical slice

- 5 gardes actifs simultanément maximum.
- 20 sources ou volumes lumineux dynamiques maximum dans la zone active.
- 100 interactables chargés maximum, avec seulement les proches évalués fréquemment.
- Particules limitées et mises en pool lorsque pertinent.
- Audio préchargé par mission, pas pour toute une campagne inexistante.
- Assets organisés en paquets par zone.

### 20.3 Règles de performance

- Aucun `setState` React par frame.
- Aucun calcul de chemin complet par garde à chaque frame.
- Aucun test de perception contre toutes les entités sans filtre spatial.
- Éviter les allocations massives dans la boucle de simulation.
- Désactiver ou ralentir les systèmes éloignés de la caméra lorsque cela n’altère pas le gameplay.
- Profiler avant d’ajouter une optimisation complexe.

---

## 21. Stratégie de test

### 21.1 Tests unitaires du domaine

Prioritaires :

- calcul des modificateurs d’exposition ;
- progression et décroissance de la détection ;
- rayon sonore après mouvement et matériau ;
- effet d’un obstacle sur le bruit ;
- transitions de chaque état d’IA ;
- mémoire de la dernière position connue ;
- sélection de l’interaction contextuelle ;
- propagation d’un état de dispositif ;
- progression des objectifs ;
- sérialisation et migration de sauvegarde.

### 21.2 Tests d’intégration

Scénarios :

1. le joueur court sur du métal, le garde entend et enquête au bon endroit ;
2. le joueur éteint une lumière, son exposition diminue ;
3. le garde aperçoit partiellement le joueur, devient suspicieux puis revient à sa patrouille ;
4. le garde détecte le joueur, le perd, fouille la dernière position puis retourne à sa route ;
5. une porte fermée bloque la vision et atténue le bruit ;
6. la caméra déclenche l’alarme ;
7. le terminal désactive la caméra ;
8. le checkpoint restaure objectif, munitions et dispositifs ;
9. une neutralisation permet de déplacer et cacher le corps ;
10. terminer l’objectif active l’extraction et affiche le bilan.

### 21.3 Tests navigateur

- démarrage depuis le menu ;
- chargement de la Stealth Lab ;
- pause et reprise ;
- sauvegarde puis rechargement ;
- changement de paramètres ;
- passage plein écran si supporté ;
- fin de mission et retour au menu ;
- absence d’erreur console bloquante.

### 21.4 Playtests humains

Le testeur reçoit uniquement les contrôles de base, sans explication des solutions.

Observer :

- comprend-il quand il est caché ?
- comprend-il l’origine d’une suspicion ?
- remarque-t-il les routes alternatives ?
- utilise-t-il spontanément le décor ?
- récupère-t-il après une alerte ?
- le déplacement est-il plaisant ?
- quelles interactions tente-t-il qui n’existent pas ?
- quelles informations du HUD sont ignorées ?

Après le test, poser des questions factuelles avant de demander un avis général.

---

## 22. Découpage d’implémentation

Chaque ticket doit rester petit, vérifiable et réversible. Ne pas paralléliser des tickets partageant les mêmes fichiers structurants sans coordination.

### Lot 0 — Décisions et dépôt

#### PRE-001 — Valider les décisions produit

Livrables :

- décisions de la section 2 confirmées ou corrigées ;
- nom de travail ;
- niveau de violence ;
- référence précise de la période visuelle ;
- priorité clavier/souris ou manette.

Critère : aucune ambiguïté structurante restante avant le bootstrap.

#### PRE-002 — Créer le mini GDD vivant

Livrables : vision, piliers, boucle, contrôles, vertical slice, hors périmètre.

Critère : document présent dans le dépôt et versionné.

### Lot 1 — Fondation technique

#### FND-001 — Bootstrap React, TypeScript et Vite

- TypeScript strict.
- Lint, format, tests et build.
- Aucun `any` explicite.
- Scripts standardisés.

Critère : application vide construite et testée.

#### FND-002 — Intégrer un canvas Phaser minimal

- Cycle création/destruction propre.
- Redimensionnement.
- Pas de double instance en développement.

Critère : scène vide visible, démontage sans fuite manifeste.

#### FND-003 — Créer le pont React–jeu

- Commandes ;
- abonnement ;
- snapshot UI ;
- destruction.

Critère : React peut lancer, mettre en pause et arrêter une scène sans connaître Phaser.

#### FND-004 — Mettre en place la configuration et les événements typés

Critère : un événement de test circule du domaine au runtime puis vers le HUD sans dépendance inversée.

#### FND-005 — Mettre en place la CI locale

Commandes obligatoires : typage, lint, tests, build.

Critère : une erreur de type ou un test cassé fait échouer la vérification.

### Lot 2 — Monde de test et caméra

#### WRL-001 — Charger une carte Tiled minimale

Critère : géométrie et point d’apparition lus depuis JSON.

#### WRL-002 — Valider les données de niveau

Critère : identifiant dupliqué ou propriété manquante produit une erreur lisible.

#### WRL-003 — Créer la Stealth Lab

Inclure sol, plateforme, corniche, porte, interrupteur, lumière, surface métallique et point de patrouille.

#### CAM-001 — Caméra latérale

- suivi amorti ;
- limites du niveau ;
- anticipation légère dans le sens du regard ;
- pas de nausée lors des changements rapides.

Critère : déplacement de test agréable au clavier et à la manette.

#### CAM-002 — Parallaxe et coupe intérieur/extérieur

Critère : au moins trois plans visuels et une façade pouvant devenir transparente sans masquer le gameplay.

### Lot 3 — Entrées et déplacement

#### INP-001 — Actions abstraites clavier

Critère : aucune logique de déplacement ne lit directement les touches.

#### INP-002 — Actions abstraites manette

Critère : le même contrat d’action pilote clavier et manette.

#### MOV-001 — Marche, course, accélération et arrêt

Critère : valeurs centralisées et contrôles stables à différentes fréquences d’image.

#### MOV-002 — Accroupissement

Critère : changement de posture, collision et vitesse cohérents.

#### MOV-003 — Saut et chute

Inclure coyote time, buffer et contrôle aérien limité.

#### MOV-004 — Réception et bruit de chute

Critère : réception légère/lourde selon vitesse verticale.

#### MOV-005 — Corniche et suspension

Critère : détection fiable, accrochage tolérant, montée et lâcher.

#### MOV-006 — Franchissement et roulade

Critère : transitions contrôlées et absence de traversée des murs.

#### MOV-007 — Échelles ou conduits

Critère : entrée/sortie claire et blocage des actions incompatibles.

#### MOV-008 — Animations et machine à états

Critère : aucune animation incompatible avec l’état logique ; transitions observables en debug.

### Lot 4 — Interactions

#### INT-001 — Détection et classement des interactables

Critère : cible stable, priorité testée, nettoyage lorsque la cible disparaît.

#### INT-002 — Prompt contextuel dans le HUD

Critère : le prompt change sans actualiser React à chaque frame.

#### INT-003 — Portes

Critère : collision, visibilité, bruit et navigation mis à jour.

#### INT-004 — Interrupteurs et groupes de dispositifs

Critère : un interrupteur commande plusieurs objets par identifiants déclaratifs.

#### INT-005 — Objets à prendre et lancer

Critère : trajectoire prévisible, impact sonore, réutilisation ou destruction explicite.

#### INT-006 — Cachette

Critère : entrée/sortie, blocage des actions, feedback visuel et perception modifiée.

### Lot 5 — Bruit

#### SND-001 — Événements sonores typés

Critère : position, rayon, catégorie et source disponibles sans dépendance au rendu.

#### SND-002 — Matériaux de sol

Critère : la même action produit des rayons différents sur tapis et métal.

#### SND-003 — Occlusion sonore simple

Critère : une porte fermée atténue correctement un bruit.

#### SND-004 — Visualisation debug

Critère : rayon, intensité et gardes destinataires visibles.

### Lot 6 — Lumière et perception

#### LGT-001 — Volumes de lumière gameplay

Critère : intensité calculable et modifiable par dispositif.

#### LGT-002 — Exposition du joueur

Critère : score déterministe, testé, sensible à posture et mouvement.

#### LGT-003 — Représentation visuelle

Critère : changement de lumière visible cohérent avec le score de gameplay.

#### LGT-004 — Cône et occlusion visuelle

Critère : obstacle opaque bloque la perception.

#### LGT-005 — Jauge de détection

Critère : progression et décroissance conformes aux seuils définis.

#### LGT-006 — Feedback et debug

Critère : exposition, cône, raycasts et jauge visibles séparément.

### Lot 7 — Intelligence artificielle

#### AI-001 — Garde et route de patrouille

Critère : boucle de patrouille stable avec pauses et orientation.

#### AI-002 — Capteur auditif et suspicion

Critère : le garde regarde ou enquête vers la position entendue.

#### AI-003 — Capteur visuel et détection

Critère : exposition, distance et mouvement influencent le délai.

#### AI-004 — Investigation et recherche

Critère : le garde ne suit pas magiquement la position courante cachée.

#### AI-005 — Alerte et perte du joueur

Critère : poursuite, dernière position connue, recherche puis retour.

#### AI-006 — Graphe de navigation

Critère : le garde atteint une destination dans un autre segment accessible sans traverser la géométrie.

#### AI-007 — Communication locale

Critère : un garde informe seulement les alliés accessibles par cri, radio ou alarme.

#### AI-008 — Feedback ennemi

Critère : un testeur peut distinguer patrouille, suspicion, recherche et alerte sans overlay debug.

### Lot 8 — Visée et neutralisation

#### AIM-001 — Visée souris et manette

Critère : réticule stable en coordonnées monde et vitesse réduite.

#### AIM-002 — Trajectoire et obstruction

Critère : mur, cible et portée produisent un résultat prévisible.

#### AIM-003 — Fléchette tranquillisante

Critère : munitions, impact tête/torse, délai et bruit d’impact testés.

#### TAK-001 — Neutralisation arrière

Critère : conditions explicites et absence de déclenchement de face.

#### TAK-002 — Corps inconscient

Critère : perception, collision et découverte cohérentes.

#### TAK-003 — Déplacer et cacher un corps

Critère : vitesse réduite, actions bloquées et disparition contrôlée dans un conteneur.

### Lot 9 — Sécurité et systèmes du niveau

#### SEC-001 — Caméra de sécurité

Critère : balayage, perception, désactivation et feedback.

#### SEC-002 — Alarme locale

Critère : propagation limitée à la zone et effets déclaratifs.

#### SEC-003 — Terminal et réseau électrique

Critère : état sauvegardable et interactions combinables.

### Lot 10 — Mission et sauvegarde

#### MSN-001 — Machine d’objectifs

Critère : activation, complétion et dépendances testées.

#### MSN-002 — Objectif principal et secondaire

Critère : progression visible et extraction verrouillée correctement.

#### SAV-001 — Format de sauvegarde versionné

Critère : données sérialisables sans objet runtime.

#### SAV-002 — Checkpoints

Critère : restauration reproductible à partir du niveau de base et des mutations.

#### MSN-003 — Fin de mission et statistiques

Critère : styles de réussite calculés avec des règles documentées.

### Lot 11 — Production de la vertical slice

#### LVL-001 — Greybox complet

Critère : mission terminable par au moins deux routes sans art final.

#### LVL-002 — Passe d’infiltration

Critère : chaque zone possède observation, décision, exécution et récupération possible.

#### LVL-003 — Passe d’interactions

Critère : aucune interaction importante n’est purement décorative ou sans feedback.

#### ART-001 — Style guide

Critère : palette, contours, échelle, profondeur, lumière et interfaces documentés.

#### ART-002 — Décors intérieur/extérieur

Critère : lecture correcte des plans et façades sans confusion de collision.

#### ART-003 — Personnage et garde représentatifs

Critère : silhouettes et états lisibles sans HUD.

#### AUD-001 — Audio fonctionnel

Critère : pas, stimuli et états d’alerte identifiables.

#### AUD-002 — Musique adaptative

Critère : transitions calme/tension/alerte sans coupure brutale.

### Lot 12 — Interface, accessibilité et finition

#### UI-001 — Menus principaux

#### UI-002 — HUD final de la slice

#### UI-003 — Paramètres et remappage

#### ACC-001 — Options d’accessibilité minimales

#### PERF-001 — Profilage et budget de frame

#### QA-001 — Parcours Playwright critique

#### QA-002 — Session de playtest sans explication

#### QA-003 — Correction des problèmes bloquants

Critère de sortie du lot : build public stable, mission terminable et aucun défaut critique connu.

---

## 23. Ordre des dépendances

Ordre recommandé :

1. fondation ;
2. monde de test ;
3. entrée et déplacement ;
4. interaction ;
5. bruit ;
6. lumière ;
7. IA ;
8. visée et neutralisation ;
9. sécurité ;
10. mission et sauvegarde ;
11. niveau complet ;
12. art, audio, interface et finition.

Le greybox du niveau peut commencer après le mouvement et les interactions de base, mais il ne doit pas être finalisé avant la stabilisation de lumière, bruit et IA.

L’art final ne commence pas avant la validation du greybox, sauf pour une petite cible visuelle servant à tester la direction artistique.

---

## 24. Critères de réussite de la vertical slice

La vertical slice est validée uniquement si :

- elle démarre depuis un menu dans un navigateur ;
- elle est jouable au clavier/souris et à la manette ;
- le personnage se déplace avec précision ;
- le joueur peut utiliser ombre et bruit intentionnellement ;
- les gardes suivent les états documentés ;
- une erreur d’infiltration peut être récupérée ;
- au moins deux routes distinctes permettent la réussite ;
- une approche sans neutralisation est possible ;
- une approche sans détection complète est possible ;
- les portes, lumières, machines et dispositifs interagissent réellement avec les systèmes ;
- le checkpoint restaure un état cohérent ;
- la mission possède une fin et un bilan ;
- la DA rétro animée est reconnaissable sans copie directe ;
- les transitions intérieur/extérieur sont lisibles ;
- les informations importantes existent en visuel et en audio ;
- la cible de performance est respectée ;
- aucun défaut bloquant ou perte de sauvegarde connue ne subsiste.

### Questions de validation qualitative

- Le mouvement est-il amusant sans ennemi ?
- L’ombre change-t-elle réellement les décisions ?
- Le bruit permet-il de créer des plans ?
- L’IA semble-t-elle curieuse plutôt qu’omnisciente ?
- Les interactions produisent-elles des conséquences combinables ?
- L’alerte crée-t-elle une tension intéressante plutôt qu’un échec automatique ?
- La DA donne-t-elle envie d’explorer le bâtiment ?
- Le joueur raconte-t-il une petite histoire différente à chaque tentative ?

Si plusieurs réponses sont négatives, ne pas lancer la production d’une campagne.

---

## 25. Risques et réponses prévues

| Risque | Conséquence | Réponse |
| --- | --- | --- |
| React utilisé pour la boucle temps réel | performances et état instable | React limité à l’application et au HUD événementiel |
| Accumulation de systèmes trop tôt | vertical slice interminable | périmètre strict et tickets courts |
| IA perçue comme injuste | perte de confiance | capteurs déterministes, feedback et debug |
| Lumière graphique différente du gameplay | détections incompréhensibles | volumes gameplay séparés mais visuellement alignés |
| Plateforme molle ou imprécise | cœur du jeu désagréable | contrôleur cinématique et phase dédiée au mouvement |
| Navigation ennemie trop complexe | bugs et temps perdu | graphe de navigation édité manuellement |
| Interactions spécifiques dispersées | code impossible à faire évoluer | capacités déclaratives et resolver central |
| Scope combat trop large | détourne l’infiltration | une arme non létale, pas de combat complet |
| Coût de l’art | production bloquée | greybox, kit modulaire, cible visuelle limitée |
| Copie trop visible des références | identité faible et risque juridique | langage visuel original et inspirations fonctionnelles |
| Multijoueur décidé tard | refonte majeure | décision explicite avant simulation avancée |
| Modèle IA modifiant trop de fichiers | régressions difficiles à isoler | un ticket, un périmètre, validation avant suite |

---

## 26. Estimation indicative

Pour un développeur solo ayant une forte expérience web mais découvrant une partie du game development :

| Étape | Temps plein indicatif | Temps partiel indicatif |
| --- | ---: | ---: |
| Préproduction | 1 à 2 semaines | 2 à 4 semaines |
| Fondation et mouvement | 3 à 5 semaines | 6 à 10 semaines |
| Infiltration systémique | 5 à 8 semaines | 10 à 16 semaines |
| Mission greybox | 3 à 5 semaines | 6 à 10 semaines |
| Art, audio et interface | 5 à 8 semaines | 10 à 18 semaines |
| Tests et finition | 3 à 5 semaines | 6 à 10 semaines |
| Total vertical slice | environ 4 à 7 mois | environ 8 à 14 mois |

Ces chiffres ne sont pas des engagements. L’animation, l’audio et la création de décors représentent probablement plus de risque que le socle React.

Un jeu commercial complet en solo devra ensuite rester très limité en contenu ou être produit avec d’autres personnes. Il ne faut pas extrapoler une campagne avant d’avoir mesuré le coût réel de la première mission.

---

## 27. Prompt type pour confier un ticket à un modèle plus faible

```text
Tu travailles sur Project Shadowline.

Implémente uniquement le ticket [IDENTIFIANT ET NOM].

Avant toute modification :
1. lis le plan du projet et les instructions du dépôt ;
2. inspecte les fichiers concernés ;
3. résume en quelques lignes ta compréhension du ticket ;
4. indique précisément les fichiers que tu comptes modifier.

Contraintes :
- TypeScript strict ;
- aucun `any` explicite ;
- aucune nouvelle dépendance sans justification et validation ;
- ne développe aucun ticket suivant ;
- ne modifie pas les frontières React / Phaser / domaine ;
- préserve les changements existants sans rapport ;
- ajoute ou adapte les tests du comportement modifié ;
- privilégie une solution simple et déterministe.

Critères d’acceptation du ticket :
[COPIER ICI LES CRITÈRES DU TICKET]

À la fin :
- exécute le typage, le lint, les tests et le build ;
- donne les commandes et leurs résultats ;
- liste les fichiers modifiés ;
- signale honnêtement toute limite restante ;
- arrête-toi et attends ma validation.
```

### Prompt de correction

```text
Le ticket [IDENTIFIANT] ne respecte pas le critère suivant : [CRITÈRE].

Diagnostique la cause avant de modifier le code. Corrige uniquement cette cause et les tests directement concernés. Ne refactore pas les modules voisins et ne commence pas le ticket suivant. Exécute ensuite les vérifications complètes et présente les preuves du résultat.
```

---

## 28. Checklist de revue de chaque ticket

- [ ] Le ticket demandé est le seul comportement ajouté ou modifié.
- [ ] Les dépendances du ticket étaient terminées.
- [ ] Les frontières entre React, Phaser et domaine sont respectées.
- [ ] Aucun `any` explicite n’a été introduit.
- [ ] Aucun abonnement, timer ou objet runtime ne fuit après destruction.
- [ ] Les valeurs de tuning ne sont pas dispersées.
- [ ] Le comportement possède un feedback utilisateur lorsque nécessaire.
- [ ] Les outils de debug sont adaptés si le système le nécessite.
- [ ] Les tests pertinents existent et passent.
- [ ] Le typage passe.
- [ ] Le lint passe.
- [ ] Le build passe.
- [ ] Les changements sans rapport ont été préservés.
- [ ] Les limites restantes sont documentées.

---

## 29. Décisions à confirmer avant PRE-001

Les choix suivants sont recommandés mais restent à valider :

1. **Référence Spider-Man** : série animée 1981, série 1994 ou mélange plus libre de l’animation urbaine 80–90.
2. **Tonalité** : espionnage sérieux avec humour visuel léger, ou aventure franchement familiale.
3. **Personnage** : agent professionnel, cambrioleur, justicier urbain ou citoyen équipé artisanalement.
4. **Violence** : uniquement non létale dans tout le jeu, ou possibilité létale ultérieure.
5. **Graphisme** : animation 2D dessinée haute définition, sprites stylisés ou rendu proche d’une bande dessinée animée.
6. **Clavier/manette** : périphérique prioritaire pour le réglage initial.
7. **Public cible** : joueurs d’infiltration expérimentés, public large ou compromis avec aides réglables.

Ces décisions influencent le ton et le coût de production, mais ne nécessitent encore aucune ligne de code.

---

## 30. Ressources techniques officielles

- Phaser — installation et modèles de projet : <https://docs.phaser.io/phaser/getting-started/installation>
- Phaser — version stable : <https://phaser.io/download/stable>
- Rapier 2D — option physique ultérieure, non retenue pour la vertical slice : <https://rapier.rs/docs/user_guides/javascript/getting_started_js/>
- Colyseus — option uniquement si le multijoueur devient une exigence : <https://docs.colyseus.io/>

---

## Conclusion opérationnelle

Le premier objectif n’est pas de produire beaucoup de contenu. Il est de démontrer, dans la Stealth Lab puis dans une mission courte, que quatre systèmes fonctionnent ensemble :

1. déplacement fluide ;
2. lumière compréhensible ;
3. bruit exploitable ;
4. IA locale, prévisible et récupérable.

Une fois ce noyau validé, les gadgets, décors rétro, passages intérieur/extérieur et objectifs peuvent l’enrichir. Si ce noyau n’est pas amusant, aucun volume de contenu ou de finition artistique ne résoudra le problème.
