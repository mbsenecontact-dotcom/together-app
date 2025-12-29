# VERSIONING

Ce projet suit un versionnement basé sur les phases de développement.

## Branches principales

- `main` : version stable, production.
- `develop` : pré-production, regroupe les fonctionnalités validées.

## Branches de phases

Chaque phase fonctionnelle possède sa propre branche :

- `phase-1-auth`
- `phase-2-progress`
- `phase-3-groups`
- `phase-4-ui`

## Règles

- Tout développement se fait dans une branche de phase.
- À la fin d’une phase :
  - merge → `develop`
  - puis merge → `main` (ou release)
- Chaque merge vers `main` doit être tagué.

## Numérotation des versions

- Phase 1 → v1.0.0
- Phase 2 → v2.0.0
- Phase 3 → v3.0.0
- Phase 4 → v4.0.0

Les patchs correctifs utilisent :
- v1.0.1, v1.0.2…
