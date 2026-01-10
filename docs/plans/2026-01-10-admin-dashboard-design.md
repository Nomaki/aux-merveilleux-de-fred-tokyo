# Admin Dashboard - Design Document

## Overview

Dashboard d'administration protégé par mot de passe permettant de consulter les commandes via une vue calendrier.

## Fonctionnalités

### Authentification
- URL cachée `/admin` sans lien visible dans l'app publique
- Mot de passe unique stocké en variable d'environnement `ADMIN_PASSWORD`
- Token de session stocké en localStorage (expire après 24h)
- Validation côté serveur uniquement
- Rate limiting basique (5 tentatives/minute/IP)

### Vue calendrier mensuelle (`/admin/dashboard`)
- Navigation mois précédent/suivant
- Grille calendrier lundi-dimanche
- Badge avec nombre de commandes par jour
- Code couleur : vert (toutes payées), orange (paiements en attente)
- Clic sur un jour → vue détaillée

### Vue journalière (`/admin/day/:date`)
- Header avec date formatée + bouton retour
- Bouton "Télécharger PDF du jour"
- Liste des commandes triées par heure de retrait
- Chaque carte affiche :
  - Heure de retrait, code réservation, statut paiement
  - Nom, téléphone, email
  - Type de gâteau, taille, prix
  - Bougies, décorations, message personnalisé

## Architecture technique

### Nouveaux fichiers frontend
- `src/pages/admin/AdminLogin.tsx` - Formulaire de connexion
- `src/pages/admin/AdminDashboard.tsx` - Vue calendrier mensuelle
- `src/pages/admin/AdminDayView.tsx` - Vue détaillée journalière
- `src/hooks/useAdminAuth.ts` - Hook d'authentification

### Nouveaux endpoints API
- `api/admin-login.js` - POST, valide le mot de passe, retourne un token
- `api/admin-orders.js` - GET, récupère les commandes (params: month ou date)
- `api/admin-day-pdf.js` - GET, génère le PDF d'une journée

### Modifications existantes
- `src/App.tsx` - Ajouter routes `/admin/*`
- Variables d'environnement Vercel - Ajouter `ADMIN_PASSWORD`

### Flux d'authentification
1. Accès `/admin` → formulaire login
2. Saisie mot de passe → POST `/api/admin-login`
3. Si valide → token stocké localStorage, redirect `/admin/dashboard`
4. Hook `useAdminAuth` vérifie token sur pages protégées
5. Token invalide → redirect login

## Composants Mantine utilisés
- `Calendar` (@mantine/dates) - Grille calendrier
- `Card`, `Badge`, `Button` - Affichage commandes
- `PasswordInput` - Formulaire login
- `Stack`, `Group`, `Paper` - Layout

## Hors périmètre (YAGNI)
- Gestion multi-utilisateurs
- Modification/annulation de commandes
- Notifications push
- Export CSV/Excel
