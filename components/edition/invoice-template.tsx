"use client";

import Image from "next/image";
import { EditableField } from "./editable-field";

const formatPrice = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0.00";
  return value.toFixed(2);
};

// Calcule la luminosité relative d'une couleur (WCAG)
function getLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }) || [0, 0, 0];
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// Détermine si le texte doit être blanc ou noir pour un bon contraste
function getContrastColor(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  return luminance > 0.4 ? "#1f2937" : "#ffffff";
}

interface LineItem {
  lineId: string;
  id: string;
  designation: string;
  description?: string;
  quantity?: string;
  unitPrice?: number;
  tva?: number;
  total?: number;
  isSection?: boolean;
  sectionTotal?: number;
  sectionTotalTTC?: number;
}

interface InvoiceData {
  number: string;
  date: string;
  dueDate: string;
  company: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    siret: string;
    logoUrl?: string;
    paymentTerms?: string;
    legalNotice?: string;
  };
  client: {
    name?: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    siret?: string;
  };
  projectTitle: string;
  items: LineItem[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  deposit: number;
  totalTTC: number;
  paymentConditions: string;
}

const defaultData: InvoiceData = {
  number: "0777",
  date: "01/01/2026",
  dueDate: "30 jours",
  company: {
    name: "Entreprise de Matthias Colpaert",
    address: "181, chemin d'Estantens",
    city: "31870, Beaumont, France",
    phone: "06 10 76 06 37",
    email: "Colpaertmatthias@gmail.com",
    siret: "777 777 777",
  },
  client: {
    address: "181, chemin d'Estantens",
    city: "31870, Beaumont, France",
    phone: "06 10 76 06 37",
    email: "Colpaertmatthias@gmail.com",
    siret: "777 777 777",
  },
  projectTitle: "Rénovation de la cuisine",
  items: [
    {
      lineId: "example-section-1",
      id: "1",
      designation: "Démolition et préparation",
      isSection: true,
      sectionTotal: 360,
    },
    {
      lineId: "example-line-1",
      id: "1.1",
      designation: "Dépose carrelage mural",
      description:
        "Retrait de l'ancien carrelage, protection des surfaces adjacentes",
      quantity: "10m²",
      unitPrice: 15,
      tva: 20,
      total: 180,
    },
    {
      lineId: "example-line-2",
      id: "1.2",
      designation: "Dépose carrelage mural",
      description:
        "Retrait de l'ancien carrelage, protection des surfaces adjacentes",
      quantity: "10m²",
      unitPrice: 15,
      tva: 20,
      total: 180,
    },
  ],
  totalHT: 720,
  tvaRate: 20,
  tvaAmount: 144,
  deposit: 0,
  totalTTC: 864,
  paymentConditions:
    "Acompte à xx , espèce ou virement bancaire sur le compte : xxxx",
};

// Champs protégés (modifiables uniquement via Paramètres):
// - Toutes les infos entreprise (company.*)
// - Numéro de document (number)
// - Date d'émission (date)
// - Conditions de paiement (paymentTerms via company)
// - Mentions légales (legalNotice via company)

type UpdatePath =
  | "dueDate"
  | "projectTitle"
  | "deposit"
  | "tvaRate"
  | `client.${keyof InvoiceData["client"]}`
  | `items.${number}.designation`
  | `items.${number}.description`
  | `items.${number}.quantity`
  | `items.${number}.unitPrice`
  | `items.${number}.tva`;

interface InvoiceTemplateProps {
  data?: InvoiceData;
  onUpdate?: (path: UpdatePath, value: string | number) => void;
  deleteMode?: boolean;
  selectedLines?: Set<number>;
  onLineClick?: (lineIndex: number) => void;
  onLineMouseDown?: (lineIndex: number) => void;
  onLineMouseEnter?: (lineIndex: number) => void;
  accentColor?: string | null;
}

export function InvoiceTemplate({
  data = defaultData,
  onUpdate,
  deleteMode = false,
  selectedLines = new Set(),
  onLineClick,
  onLineMouseDown,
  onLineMouseEnter,
  accentColor,
}: InvoiceTemplateProps) {
  const hasCustomColor = accentColor !== null && accentColor !== undefined;
  const textColor = hasCustomColor ? getContrastColor(accentColor) : undefined;
  const handleUpdate = (path: UpdatePath, value: string | number) => {
    if (onUpdate) {
      onUpdate(path, value);
    }
  };

  const handleRowMouseDown = (index: number) => {
    if (deleteMode && onLineMouseDown) {
      onLineMouseDown(index);
    }
  };

  const handleRowMouseEnter = (index: number) => {
    if (deleteMode && onLineMouseEnter) {
      onLineMouseEnter(index);
    }
  };

  const handleRowClick = (index: number) => {
    if (deleteMode && onLineClick) {
      onLineClick(index);
    }
  };

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-card text-card-foreground p-8 text-sm font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        {data.company.logoUrl ? (
          <Image
            src={data.company.logoUrl}
            alt="Logo entreprise"
            width={160}
            height={80}
            className="w-40 h-20 object-contain object-left"
            unoptimized
          />
        ) : (
          <div className="w-40 h-20 bg-muted flex items-center justify-center text-muted-foreground font-semibold">
            LOGO
          </div>
        )}
        <div className="sm:text-right">
          <h1 className="text-xl font-bold">Facture n° {data.number}</h1>
          <p className="text-muted-foreground">
            Date d&apos;émission : {data.date}
          </p>
          <p className="text-muted-foreground">
            Échéance :{" "}
            <EditableField
              value={data.dueDate}
              onSave={(v) => handleUpdate("dueDate", v)}
            />
          </p>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Company - Champs protégés (modifiables uniquement via Paramètres) */}
        <div>
          <h2 className="font-bold text-lg mb-3">{data.company.name}</h2>
          <div className="space-y-1 text-muted-foreground">
            <p>{data.company.address}</p>
            {data.company.city && <p>{data.company.city}</p>}
            <p>{data.company.phone}</p>
            <p>{data.company.email}</p>
            <p>SIRET: {data.company.siret}</p>
          </div>
        </div>

        {/* Client */}
        <div>
          <h2 className="font-bold text-lg mb-3">
            <EditableField
              value={data.client.name || "Client"}
              onSave={(v) => handleUpdate("client.name", v)}
              placeholder="Client"
            />
          </h2>
          <div className="space-y-1 text-muted-foreground">
            <p>
              <EditableField
                value={data.client.phone}
                onSave={(v) => handleUpdate("client.phone", v)}
                placeholder="Téléphone"
              />
            </p>
            <p>
              <EditableField
                value={data.client.email}
                onSave={(v) => handleUpdate("client.email", v)}
                placeholder="Email"
              />
            </p>
          </div>
        </div>
      </div>

      {/* Project Title */}
      <h2 className="text-xl font-bold mb-4">
        <EditableField
          value={data.projectTitle}
          onSave={(v) => handleUpdate("projectTitle", v)}
          placeholder="Titre du projet"
        />
      </h2>

      {/* Items Table */}
      <div className="border border-border rounded-lg overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr
                className={!hasCustomColor ? "bg-muted" : ""}
                style={
                  hasCustomColor
                    ? { backgroundColor: accentColor, color: textColor }
                    : undefined
                }
              >
                <th
                  className={`px-3 py-2 font-semibold whitespace-nowrap ${!hasCustomColor ? "text-muted-foreground" : ""}`}
                >
                  #
                </th>
                <th
                  className={`px-3 py-2 font-semibold ${!hasCustomColor ? "text-muted-foreground" : ""}`}
                >
                  Désignation
                </th>
                <th
                  className={`px-3 py-2 font-semibold text-center whitespace-nowrap ${!hasCustomColor ? "text-muted-foreground" : ""}`}
                >
                  Quantité
                </th>
                <th
                  className={`px-3 py-2 font-semibold text-center whitespace-nowrap ${!hasCustomColor ? "text-muted-foreground" : ""}`}
                >
                  Prix unit. HT
                </th>
                <th
                  className={`px-3 py-2 font-semibold text-center whitespace-nowrap ${!hasCustomColor ? "text-muted-foreground" : ""}`}
                >
                  TVA
                </th>
                <th
                  className={`px-3 py-2 font-semibold text-right whitespace-nowrap ${!hasCustomColor ? "text-muted-foreground" : ""}`}
                >
                  Total TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr
                  key={item.lineId}
                  className={`border-t border-border select-none ${
                    deleteMode
                      ? selectedLines.has(index)
                        ? "bg-destructive/20 cursor-pointer"
                        : "cursor-pointer hover:bg-destructive/10"
                      : ""
                  } transition-colors`}
                  onClick={() => handleRowClick(index)}
                  onMouseDown={() => handleRowMouseDown(index)}
                  onMouseEnter={() => handleRowMouseEnter(index)}
                >
                  {item.isSection ? (
                    <>
                      <td className="px-3 py-2 font-bold">{item.id}</td>
                      <td className="px-3 py-2 font-bold">
                        <EditableField
                          value={item.designation}
                          onSave={(v) =>
                            handleUpdate(`items.${index}.designation`, v)
                          }
                        />
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="px-3 py-2 font-bold text-right">
                        {formatPrice(item.sectionTotalTTC ?? item.sectionTotal)}{" "}
                        €
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-muted-foreground">
                        {item.id}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          <EditableField
                            value={item.designation}
                            onSave={(v) =>
                              handleUpdate(`items.${index}.designation`, v)
                            }
                            placeholder="Désignation"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <EditableField
                            value={item.description}
                            onSave={(v) =>
                              handleUpdate(`items.${index}.description`, v)
                            }
                            placeholder="Description"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        <EditableField
                          value={item.quantity}
                          onSave={(v) =>
                            handleUpdate(`items.${index}.quantity`, v)
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        <EditableField
                          value={formatPrice(item.unitPrice)}
                          onSave={(v) =>
                            handleUpdate(
                              `items.${index}.unitPrice`,
                              parseFloat(v) || 0,
                            )
                          }
                          suffix=" €"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        <EditableField
                          value={item.tva}
                          onSave={(v) =>
                            handleUpdate(
                              `items.${index}.tva`,
                              parseFloat(v) || 0,
                            )
                          }
                          suffix="%"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatPrice(
                          (item.total || 0) * (1 + (item.tva || 0) / 100),
                        )}{" "}
                        €
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-4">
        <div className="w-48 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total HT</span>
            <span>{formatPrice(data.totalHT)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total TVA</span>
            <span>{formatPrice(data.tvaAmount)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Acompte versé</span>
            <span>
              -
              <EditableField
                value={formatPrice(data.deposit)}
                onSave={(v) => handleUpdate("deposit", parseFloat(v) || 0)}
                suffix=" €"
              />
            </span>
          </div>
          <div className="flex justify-between font-bold border-t border-border pt-1">
            <span>Total TTC</span>
            <span>{formatPrice(data.totalTTC)}€</span>
          </div>
        </div>
      </div>

      {/* Footer - Payment Conditions Only (no signature for invoice) */}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Conditions de paiement</h3>
        <p className="text-xs max-w-sm text-muted-foreground whitespace-pre-line">
          {data.company.paymentTerms || data.paymentConditions || "Aucune"}
        </p>
      </div>

      {/* Legal Notice */}
      <div className="text-center mt-8 text-xs text-muted-foreground whitespace-pre-line">
        {data.company.legalNotice || "Aucune mention légale"}
      </div>
    </div>
  );
}
