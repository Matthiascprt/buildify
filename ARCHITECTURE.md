Buildify – Technical Architecture

Stack principale
Framework : Next.js 15 (App Router)
Database : Supabase
Paiements : Stripe
UI : shadcn/ui + Tailwind
AI : Vercel AI SDK + GPT-5
Voice : Whisper API
PDF : react-pdf

⸻

Prisma Schema (essentiel)
	•	User : infos société (nom, SIRET, adresse, TVA, conditions de paiement), relations clients et documents
	•	Client : contact, email, téléphone, adresse, documents associés
	•	Document : type (devis ou facture), statut (brouillon, envoyé, accepté, refusé, payé), lignes, totaux, notes, conversion devis → facture
	•	DocumentLine : description, quantité, prix unitaire, total

⸻

Architecture AI

Entrée utilisateur (texte ou voix) → Whisper API (si voix) → GPT-4 + Tool Calling
Contexte : document actuel, clients existants, paramètres utilisateur (TVA, etc.)
Outils : createDocument, addLine, updateLine, removeLine, applyDiscount, setClient, convertToInvoice, updateField
Sortie : réponse streamée pour mise à jour UI en temps réel

Packages nécessaires : ai, @ai-sdk/openai, @react-pdf/renderer

⸻

Pages principales
	•	documents/ : liste devis/factures
	•	editor/[id]/ : éditeur IA + preview
	•	clients/[id]/ : CRM simple
	•	settings/ : paramètres utilisateur

⸻

Variables d’environnement

OPENAI_API_KEY=“sk-…”

⸻

Coûts estimés (500 utilisateurs)

Stack principale : ~50$/mois
GPT-4 (~40M tokens) : ~200$/mois
Whisper (~8h audio) : ~30$/mois
Total : ~280$/mois
Revenue : 500 × 29€ = 14 500€/mois → marge ~98%