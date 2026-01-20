# Buildify - Contexte pour Claude

## Description
Buildify est une application SaaS de **gestion de devis et factures** pour artisans et PME français. Interface moderne avec assistant IA intégré pour créer des documents par dictée vocale.

## Stack Technique
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Paiements**: Stripe (abonnements)
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **AI**: OpenAI GPT-4 (chat IA pour génération documents)
- **PDF**: @react-pdf/renderer + jsPDF

## Structure du Projet
```
app/
├── (app)/                 # Routes protégées (utilisateur connecté)
│   ├── dashboard/         # Tableau de bord avec statistiques
│   ├── documents/         # Liste des devis/factures
│   ├── clients/           # Gestion des clients
│   ├── billing/           # Abonnement Stripe
│   ├── settings/          # Paramètres utilisateur/entreprise
│   └── contact/           # Formulaire contact
├── (auth)/                # Authentification
│   ├── login/
│   └── reset-password/
├── (editor)/              # Éditeur de documents
│   └── edition/           # Interface édition avec chat IA
├── api/                   # API Routes
│   ├── chat/              # Chat IA temps réel
│   ├── documents/         # CRUD devis/factures
│   ├── clients/           # Gestion clients
│   ├── stripe/            # Webhooks et checkout
│   └── subscription/      # Info abonnement
├── onboarding/            # Parcours inscription
└── page.tsx               # Landing page publique

components/
├── edition/               # Composants éditeur documents
│   ├── chat.tsx           # Interface chat IA
│   ├── quote-template.tsx # Template devis
│   ├── invoice-template.tsx
│   ├── quote-pdf-template.tsx
│   └── invoice-pdf-template.tsx
├── layout/sidebar.tsx     # Navigation
└── ui/                    # Composants shadcn/ui

lib/
├── supabase/              # Client et API Supabase
├── stripe/                # Configuration Stripe
├── ai/                    # Prompts et outils IA
└── types/document.ts      # Types documents
```

## Structure Documents (IMPORTANT)
Les devis/factures utilisent une structure hiérarchique stricte:
```
Document
└── Section (ex: "1. Plomberie")
    └── Subsection (ex: "1.1 Installation")
        └── Line (ex: "1.1.1 Tuyau cuivre - 10m - 25€/m")
```

## Types Principaux
- `QuoteData` / `InvoiceData`: Documents complets
- `Section` → `Subsection` → `LineItem`: Structure hiérarchique
- `DocumentCompany`: Infos entreprise
- `DocumentClient`: Infos client

## Tarification Stripe
- **Standard**: 29,90€/mois (24,90€ annuel) - 50 docs/mois
- **Pro**: 49,90€/mois (41,90€ annuel) - 100 docs/mois

## Base de Données Supabase
Tables principales: `profiles`, `companies`, `clients`, `quotes`, `invoices`, `subscriptions`

## Assets (Supabase Storage)
- Logo: `buildify-assets/Logo/Logo02.svg`
- Agent IA: `buildify-assets/Logo/Agent IA.png`

## Commandes
```bash
pnpm dev      # Développement
pnpm build    # Build production
pnpm lint     # Linting
```

## Documentation Complète
Voir `/docs/` pour:
- `ARCHITECTURE.md` - Architecture technique détaillée
- `PRD.md` - Product Requirements Document
- `ideas.md` - Idées futures
