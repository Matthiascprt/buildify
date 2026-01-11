# Technical Architecture: Buildify

## Stack Overview

**Base**: NOW.TS boilerplate (https://github.com/Melvynx/now.ts)

| Catégorie | Technologie | Source |
|-----------|-------------|--------|
| Framework | Next.js 15 (App Router) 
| Database | Supabase 
| Payments | Stripe 
| UI | shadcn/ui + Tailwind
| **AI** | Vercel AI SDK + GPT-5 | **À ajouter** |
| **Voice** | Whisper API | **À ajouter** |
| **PDF** | react-pdf | **À ajouter** |

---

## Prisma Schema (à ajouter)

```prisma
// Extends NOW.TS User model
model User {
  // ... existing NOW.TS fields

  // Buildify business info
  companyName   String?
  siret         String?
  address       String?
  phone         String?
  logoUrl       String?
  defaultTva    Float      @default(20)
  paymentTerms  String     @default("30 jours")
  legalMentions String?
  quoteValidity Int        @default(30)

  // Relations
  clients       Client[]
  documents     Document[]
}

model Client {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  email     String?
  phone     String?
  address   String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  documents Document[]

  @@index([userId])
}

model Document {
  id           String         @id @default(cuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  clientId     String?
  client       Client?        @relation(fields: [clientId], references: [id])

  type         DocumentType
  status       DocumentStatus @default(DRAFT)
  number       String

  lines        DocumentLine[]
  subtotal     Float          @default(0)
  tvaRate      Float          @default(20)
  tvaAmount    Float          @default(0)
  total        Float          @default(0)
  discount     Float?

  issueDate    DateTime       @default(now())
  validUntil   DateTime?
  dueDate      DateTime?
  notes        String?

  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  convertedFromId String?     @unique
  convertedFrom   Document?   @relation("QuoteToInvoice", fields: [convertedFromId], references: [id])
  convertedTo     Document?   @relation("QuoteToInvoice")

  @@index([userId])
  @@index([clientId])
  @@index([type, status])
}

model DocumentLine {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  description String
  quantity    Float    @default(1)
  unitPrice   Float
  total       Float
  order       Int      @default(0)

  @@index([documentId])
}

enum DocumentType {
  QUOTE
  INVOICE
}

enum DocumentStatus {
  DRAFT
  SENT
  ACCEPTED
  REFUSED
  PAID
}
```

---

## AI Agent Architecture

```
User Input (text/voice)
       │
       ▼
┌─────────────┐
│ Whisper API │ (si voice)
└─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         GPT-4 + Tool Calling        │
│                                     │
│  Context:                           │
│  - Document actuel                  │
│  - Clients existants                │
│  - Paramètres user (TVA, etc.)      │
│                                     │
│  Tools:                             │
│  - createDocument()                 │
│  - addLine()                        │
│  - updateLine()                     │
│  - removeLine()                     │
│  - applyDiscount()                  │
│  - setClient()                      │
│  - convertToInvoice()               │
│  - updateField()                    │
└─────────────────────────────────────┘
       │
       ▼
  Stream Response → Update UI temps réel
```

**Packages à installer** :
```bash
pnpm add ai @ai-sdk/openai
pnpm add @react-pdf/renderer
```

---

## Pages à créer

```
app/
├── (app)/
│   ├── documents/          # Liste devis/factures
│   ├── editor/             # Éditeur IA + preview document
│   │   └── [id]/
│   ├── clients/            # CRM simple
│   │   └── [id]/
│   └── settings/           # Paramètres (extend NOW.TS)
```

---

## Environment Variables (à ajouter)

```bash
# AI (ajouter aux vars NOW.TS existantes)
OPENAI_API_KEY="sk-..."
```

---

## Coûts estimés (500 users)

| Service | Coût/mois |
|---------|-----------|
| NOW.TS stack (Vercel, Neon, Redis, etc.) | ~$50 |
| OpenAI GPT-4 (~40M tokens) | ~$200 |
| OpenAI Whisper (~8h audio) | ~$30 |
| **Total** | **~$280/mois** |

**Revenue** : 500 × 29€ = 14 500€/mois → **~98% marge**
