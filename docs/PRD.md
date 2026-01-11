# Product Requirements Document: Buildify

## Product Vision

**Problem Statement**
Les artisans du BTP perdent un temps précieux sur l'administratif. Créer un devis prend 15-30 minutes sur des logiciels complexes, souvent le soir après une journée de chantier. Les solutions existantes (Synobat, Henrri, Notim) sont fonctionnelles mais pas optimisées pour la rapidité ni adaptées à l'usage mobile sur le terrain.

**Solution**
Buildify permet aux artisans de créer devis et factures en moins de 2 minutes via un agent IA conversationnel avec dictée vocale. L'artisan dicte naturellement ("Devis pour M. Dupont, remplacement chauffe-eau 800€") et le document se construit en temps réel. Interface ultra simple, mobile-first, zéro complexité.

**Success Criteria**
- 500 utilisateurs actifs dans les 6 premiers mois
- Moyenne de 40 documents par utilisateur/mois (20 devis + 20 factures)
- Temps moyen de création d'un devis < 2 minutes

---

## Target Users

### Primary Persona: Jean, Plombier Indépendant
- **Role**: Artisan solo ou avec 1-2 employés
- **Âge**: 35-55 ans
- **Pain Points**:
  - Passe ses soirées à faire de l'administratif au lieu d'être avec sa famille
  - Les logiciels actuels sont trop complexes pour son usage
  - Oublie de faire ses devis car c'est trop long
  - Perd des clients car les devis arrivent trop tard
- **Motivations**: Gagner du temps, être réactif face aux clients, simplicité d'usage
- **Goals**: Envoyer un devis au client dans les 5 minutes suivant la visite

### Secondary Persona: Marie, Gérante d'une entreprise de 5-10 personnes
- **Role**: Dirige une petite entreprise BTP (électricité, maçonnerie...)
- **Pain Points**:
  - Jongle entre terrain et administratif
  - Besoin de retrouver rapidement un ancien devis
  - Suivi des documents envoyés/payés difficile
- **Motivations**: Organisation, visibilité sur l'activité, professionnalisme

---

## Core Features (MVP)

### Must-Have Features

#### 1. Agent IA Conversationnel (Page Édition)
**Description**: Interface de chat avec l'IA permettant de créer et modifier des devis/factures par conversation. L'utilisateur peut taper ou dicter vocalement ses instructions. Le document se met à jour en temps réel à côté du chat.

**User Value**: Création de devis en langage naturel, sans navigation complexe. L'artisan dit ce qu'il veut, l'IA structure le document.

**Interactions supportées**:
- "Crée un devis pour M. Dupont, 12 rue des Lilas, Paris"
- "Ajoute une ligne : remplacement chauffe-eau 800€"
- "Applique une remise de 10%"
- "Transforme ce devis en facture"
- "Change la date de validité à 30 jours"

**Success Metric**: 80% des devis créés via l'agent IA (vs édition manuelle)

#### 2. Gestion des Documents (Page Documents)
**Description**: Liste de tous les devis et factures avec recherche rapide, filtres par statut, et actions rapides (export PDF, partage, duplication, suppression).

**User Value**: Retrouver n'importe quel document en quelques secondes. Vision claire de l'état des documents.

**Fonctionnalités**:
- Liste avec tri par date, client, montant
- Recherche par client, numéro, mots-clés
- Statuts : Brouillon, Envoyé, Accepté, Refusé, Payé
- Export PDF instantané
- Conversion devis → facture en 1 clic
- Duplication de document

**Success Metric**: Temps de recherche d'un document < 10 secondes

#### 3. CRM Simple (Page Clients)
**Description**: Base de données clients minimaliste. Création automatique lors d'un nouveau devis ou ajout manuel. Historique des documents par client.

**User Value**: Ne jamais ressaisir les infos d'un client récurrent. Vue complète de l'historique avec chaque client.

**Fonctionnalités**:
- Fiche client : nom, adresse, téléphone, email
- Création automatique depuis l'agent IA
- Liste des devis/factures associés
- Recherche rapide par nom

**Success Metric**: 70% des devis créés avec un client existant (après 1 mois d'usage)

#### 4. Paramètres Compte (Page Paramètres)
**Description**: Configuration des informations par défaut de l'artisan, appliquées automatiquement à chaque nouveau document.

**User Value**: Ne jamais ressaisir les mêmes informations. Tous les documents sont pré-remplis avec les bonnes valeurs.

**Paramètres configurables**:
- Informations entreprise : nom, SIRET, adresse, logo
- Taux de TVA par défaut (10%, 20%, auto-entrepreneur sans TVA)
- Conditions de paiement par défaut (30 jours, à réception, etc.)
- Mentions légales personnalisées
- Durée de validité des devis par défaut

**Success Metric**: 100% des utilisateurs configurent leurs paramètres à l'inscription

#### 5. Export et Partage PDF
**Description**: Génération instantanée de PDF conformes aux obligations légales françaises (mentions obligatoires, numérotation, TVA).

**User Value**: Documents professionnels prêts à envoyer au client en 1 clic.

**Conformité légale**:
- Mentions obligatoires devis (validité, date, détail prestations)
- Mentions obligatoires factures (numéro séquentiel, TVA, délai paiement)
- Format PDF/A pour archivage

**Success Metric**: 100% des documents conformes aux exigences légales

---

### Should-Have Features (Post-MVP)

- **Relances automatiques** : Notification quand un devis n'a pas été accepté après X jours
- **Signature électronique** : Acceptation de devis en ligne par le client
- **Multi-utilisateurs** : Plusieurs employés sur un même compte
- **Modèles personnalisés** : Templates de lignes fréquentes (ex: "Déplacement 50€")
- **Tableau de bord** : Stats CA, devis en attente, taux de conversion
- **Import contacts** : Depuis téléphone ou fichier CSV
- **Mode hors-ligne** : Création de devis sans connexion, sync ultérieure

---

## User Flows

### Flow Principal : Créer un devis sur chantier

1. L'artisan ouvre l'app sur son téléphone
2. Il accède à la page Édition (agent IA)
3. Il dicte : "Nouveau devis pour Monsieur Martin, 45 avenue des Roses à Lyon"
4. L'IA crée le document et associe/crée le client
5. Il dicte : "Installation tableau électrique 1200€, mise aux normes prises 400€"
6. L'IA ajoute les lignes au devis
7. Il dit : "C'est bon, génère le PDF"
8. Il partage le PDF par SMS/email au client
9. Le devis est sauvegardé automatiquement avec statut "Envoyé"

**Temps total visé : < 2 minutes**

### Flow Secondaire : Convertir un devis accepté en facture

1. L'artisan ouvre la page Documents
2. Il recherche le devis par nom client
3. Il clique sur "Convertir en facture"
4. La facture est créée avec toutes les infos du devis
5. Il ajuste si nécessaire via l'agent IA
6. Il exporte et envoie le PDF

### Flow Tertiaire : Retrouver l'historique d'un client

1. L'artisan ouvre la page Clients
2. Il recherche le client par nom
3. Il voit la fiche client avec tous les documents associés
4. Il peut ouvrir, dupliquer ou créer un nouveau document

---

## Out of Scope (v1)

Explicitement NON inclus dans le MVP :

- **Comptabilité** : Pas de bilan, pas de rapprochement bancaire
- **Gestion de stock** : Pas d'inventaire ni de suivi matériaux
- **Planning** : Pas de calendrier ni de gestion RDV
- **Relances automatiques** : Pas de notifications automatiques (v2)
- **Multi-utilisateurs** : Un compte = un utilisateur
- **Paiement en ligne** : Pas de paiement intégré
- **Signature électronique** : Pas dans v1
- **Mode hors-ligne** : Connexion requise
- **Application native** : PWA uniquement, pas d'app store

---

## Technical Constraints

**Stack technique**:
- Frontend : Next.js (React)
- Backend : Next.js API Routes
- Base de données : PostgreSQL
- ORM : Prisma
- Authentification : Better Auth
- IA : API OpenAI (GPT-4) ou Anthropic (Claude)
- PDF : React-PDF ou équivalent
- Hébergement : Vercel + Supabase/Neon (PostgreSQL)

**Contraintes**:
- Mobile-first : Design responsive priorité mobile
- Performance : Temps de réponse IA < 3 secondes
- Conformité RGPD : Données hébergées en UE
- Conformité légale : Mentions obligatoires devis/factures françaises

---

## Business Model

**Modèle** : Abonnement mensuel avec essai gratuit

| Plan | Prix | Documents/mois |
|------|------|----------------|
| Essai gratuit | 0€ | 14 jours, accès complet |
| Standard | 29€/mois | Jusqu'à 40 documents |
| Premium | 49€/mois | > 60 documents |

**Coûts IA estimés** (GPT-4) :
- ~5 requêtes IA par document, ~400 tokens/requête → 2 000 tokens/document
- Coût IA par document : ~0,11€
- Coût IA par utilisateur (40 docs) : ~4,4€/mois
- **Marge brute : ~85-90%**

**Pas de freemium** : L'essai gratuit permet de tester, puis conversion en payant.

---

## Success Metrics

**Primary Metrics**:
- Nombre d'utilisateurs actifs mensuels (MAU) : Objectif 500 à 6 mois
- Documents créés par utilisateur/mois : Objectif moyenne 40 (20 devis + 20 factures)

**Secondary Metrics**:
- Temps moyen de création d'un devis : Objectif < 2 min
- Taux de conversion essai → payant : Objectif > 15%
- Taux de rétention M1 : Objectif > 60%
- NPS (satisfaction) : Objectif > 40

---

## Open Questions

- **Conformité fiscale** : Certification NF525 requise pour les factures ? (obligatoire pour assujettis TVA depuis 2018)
- **Modèle IA** : GPT-4 retenu pour la qualité, mais tester Claude comme alternative

---

## MVP Scope Summary

| Composant | Inclus MVP | Post-MVP |
|-----------|------------|----------|
| Agent IA conversationnel | ✅ | |
| Dictée vocale | ✅ | |
| Création devis | ✅ | |
| Création factures | ✅ | |
| Conversion devis → facture | ✅ | |
| Export PDF | ✅ | |
| Liste documents + recherche | ✅ | |
| Statuts documents | ✅ | |
| CRM simple | ✅ | |
| Paramètres compte (TVA, conditions, infos) | ✅ | |
| Relances automatiques | | ✅ |
| Signature électronique | | ✅ |
| Multi-utilisateurs | | ✅ |
| Tableau de bord stats | | ✅ |
| Mode hors-ligne | | ✅ |
