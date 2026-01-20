"use client";

import { Fragment } from "react";
import Image from "next/image";
import { EditableField } from "./editable-field";
import type { Section } from "@/lib/types/document";

const formatPrice = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0,00";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface QuoteData {
  number: string;
  date: string;
  validity: string;
  company: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    siret: string;
    rcs?: string;
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
  sections: Section[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  deposit: number;
  totalTTC: number;
  paymentConditions: string;
}

const defaultData: QuoteData = {
  number: "2024-0001",
  date: "01/01/2024",
  validity: "1 mois",
  company: {
    name: "Entreprise Exemple SARL",
    address: "1 rue de la Démonstration",
    city: "75001 Paris, France",
    phone: "01 23 45 67 89",
    email: "contact@exemple-entreprise.fr",
    siret: "123 456 789 00012",
  },
  client: {
    name: "Client Exemple",
    address: "10 avenue du Test",
    city: "69001 Lyon, France",
    phone: "01 98 76 54 32",
    email: "client@exemple.fr",
  },
  projectTitle: "Projet exemple",
  sections: [
    {
      sectionId: "example-section-1",
      sectionNumber: "1",
      sectionLabel: "Section exemple",
      totalHT: 500,
      subsections: [
        {
          subsectionId: "example-subsection-1",
          subsectionNumber: "1.1",
          subsectionLabel: "Sous-section exemple",
          totalHT: 500,
          lines: [
            {
              lineId: "example-line-1",
              lineNumber: "1.1.1",
              designation: "Prestation exemple",
              description: "Description de la prestation",
              quantity: 10,
              unitPriceHT: 50,
              vatRate: 20,
              totalHT: 500,
            },
          ],
        },
      ],
    },
  ],
  totalHT: 500,
  tvaRate: 20,
  tvaAmount: 100,
  deposit: 0,
  totalTTC: 600,
  paymentConditions: "Conditions de paiement à définir",
};

type UpdatePath =
  | "validity"
  | "projectTitle"
  | "deposit"
  | "tvaRate"
  | `client.${keyof QuoteData["client"]}`
  | `sections.${string}.label`
  | `subsections.${string}.label`
  | `lines.${string}.designation`
  | `lines.${string}.description`
  | `lines.${string}.quantity`
  | `lines.${string}.unitPriceHT`
  | `lines.${string}.vatRate`;

interface QuoteTemplateProps {
  data?: QuoteData;
  onUpdate?: (path: UpdatePath, value: string | number) => void;
  deleteMode?: boolean;
  isItemSelected?: (
    type: "section" | "subsection" | "line",
    id: string,
  ) => boolean;
  onSectionClick?: (sectionId: string) => void;
  onSubsectionClick?: (subsectionId: string, sectionId: string) => void;
  onLineClick?: (
    lineId: string,
    subsectionId: string,
    sectionId: string,
  ) => void;
  accentColor?: string | null;
  signature?: string;
}

export function QuoteTemplate({
  data = defaultData,
  onUpdate,
  deleteMode = false,
  isItemSelected,
  onSectionClick,
  onSubsectionClick,
  onLineClick,
  accentColor,
  signature,
}: QuoteTemplateProps) {
  const themeColor = accentColor || "#000000";

  const handleUpdate = (path: UpdatePath, value: string | number) => {
    if (onUpdate) {
      onUpdate(path, value);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    if (deleteMode && onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  const handleSubsectionClick = (
    subsectionId: string,
    sectionId: string,
    e: React.MouseEvent,
  ) => {
    if (deleteMode && onSubsectionClick) {
      e.stopPropagation();
      onSubsectionClick(subsectionId, sectionId);
    }
  };

  const handleLineClick = (
    lineId: string,
    subsectionId: string,
    sectionId: string,
    e: React.MouseEvent,
  ) => {
    if (deleteMode && onLineClick) {
      e.stopPropagation();
      onLineClick(lineId, subsectionId, sectionId);
    }
  };

  const isSectionSelected = (sectionId: string) =>
    isItemSelected?.("section", sectionId) ?? false;
  const isSubsectionSelected = (subsectionId: string) =>
    isItemSelected?.("subsection", subsectionId) ?? false;
  const isLineSelected = (lineId: string) =>
    isItemSelected?.("line", lineId) ?? false;

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-card text-card-foreground p-8 text-sm font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        {data.company.logoUrl ? (
          <>
            <Image
              src={data.company.logoUrl}
              alt="Logo entreprise"
              width={160}
              height={80}
              className="w-40 h-20 object-contain object-left"
              unoptimized
            />
            <div className="sm:text-right">
              <h1 className="text-xl font-bold">Devis n° {data.number}</h1>
              <p className="text-muted-foreground">Réalisé le {data.date}</p>
              <p className="text-muted-foreground">
                Valable jusqu&apos;au{" "}
                <EditableField
                  value={data.validity}
                  onSave={(v) => handleUpdate("validity", v)}
                />
              </p>
            </div>
          </>
        ) : (
          <div>
            <h1 className="text-xl font-bold">Devis n° {data.number}</h1>
            <p className="text-muted-foreground">Réalisé le {data.date}</p>
            <p className="text-muted-foreground">
              Valable jusqu&apos;au{" "}
              <EditableField
                value={data.validity}
                onSave={(v) => handleUpdate("validity", v)}
              />
            </p>
          </div>
        )}
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold text-lg mb-3">{data.company.name}</h2>
          <div className="space-y-1 text-muted-foreground">
            <p>{data.company.address}</p>
            {data.company.city && <p>{data.company.city}</p>}
            <p>{data.company.phone}</p>
            <p>{data.company.email}</p>
            <p>SIRET: {data.company.siret}</p>
            {data.company.rcs && <p>RCS: {data.company.rcs}</p>}
          </div>
        </div>

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
      <div className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                  N°
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                  Désignation
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground">
                  Qté
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground">
                  Prix U.
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground">
                  TVA
                </th>
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {data.sections.map((section) => (
                <Fragment key={section.sectionId}>
                  <tr
                    className={`font-semibold select-none ${
                      deleteMode
                        ? isSectionSelected(section.sectionId)
                          ? "ring-2 ring-inset ring-destructive cursor-pointer"
                          : "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-destructive/50"
                        : ""
                    } transition-all duration-200`}
                    style={{
                      borderBottom: `2px solid ${themeColor}`,
                    }}
                    onClick={() => handleSectionClick(section.sectionId)}
                  >
                    <td className="px-2 py-3" style={{ color: themeColor }}>
                      {section.sectionNumber}
                    </td>
                    <td
                      className="px-2 py-3"
                      colSpan={4}
                      style={{ color: themeColor }}
                    >
                      <EditableField
                        value={section.sectionLabel}
                        onSave={(v) =>
                          handleUpdate(`sections.${section.sectionId}.label`, v)
                        }
                      />
                    </td>
                    <td
                      className="px-2 py-3 text-right"
                      style={{ color: themeColor }}
                    >
                      {formatPrice(section.totalHT)} €
                    </td>
                  </tr>

                  {section.subsections.map((subsection) => (
                    <Fragment key={subsection.subsectionId}>
                      <tr
                        className={`font-medium select-none ${
                          deleteMode
                            ? isSubsectionSelected(subsection.subsectionId)
                              ? "ring-2 ring-inset ring-destructive cursor-pointer"
                              : "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-destructive/50"
                            : ""
                        } transition-all duration-200`}
                        style={{
                          borderBottom: `1px solid ${themeColor}CC`,
                        }}
                        onClick={(e) =>
                          handleSubsectionClick(
                            subsection.subsectionId,
                            section.sectionId,
                            e,
                          )
                        }
                      >
                        <td
                          className="px-2 py-2"
                          style={{ color: `${themeColor}CC` }}
                        >
                          {subsection.subsectionNumber}
                        </td>
                        <td
                          className="px-2 py-2"
                          colSpan={4}
                          style={{ color: `${themeColor}CC` }}
                        >
                          <EditableField
                            value={subsection.subsectionLabel}
                            onSave={(v) =>
                              handleUpdate(
                                `subsections.${subsection.subsectionId}.label`,
                                v,
                              )
                            }
                          />
                        </td>
                        <td
                          className="px-2 py-2 text-right font-semibold"
                          style={{ color: `${themeColor}CC` }}
                        >
                          {formatPrice(subsection.totalHT)} €
                        </td>
                      </tr>

                      {subsection.lines.map((line) => (
                        <tr
                          key={line.lineId}
                          className={`select-none border-b border-border/30 ${
                            deleteMode
                              ? isLineSelected(line.lineId)
                                ? "bg-destructive/20 cursor-pointer"
                                : "cursor-pointer hover:bg-destructive/10"
                              : "hover:bg-muted/20"
                          } transition-all duration-200`}
                          onClick={(e) =>
                            handleLineClick(
                              line.lineId,
                              subsection.subsectionId,
                              section.sectionId,
                              e,
                            )
                          }
                        >
                          <td className="px-2 py-3 text-muted-foreground text-sm">
                            {line.lineNumber}
                          </td>
                          <td className="px-2 py-3">
                            <div className="font-medium text-sm">
                              <EditableField
                                value={line.designation}
                                onSave={(v) =>
                                  handleUpdate(
                                    `lines.${line.lineId}.designation`,
                                    v,
                                  )
                                }
                                placeholder="Désignation"
                              />
                            </div>
                            {line.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                <EditableField
                                  value={line.description}
                                  onSave={(v) =>
                                    handleUpdate(
                                      `lines.${line.lineId}.description`,
                                      v,
                                    )
                                  }
                                  placeholder="Description"
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center text-sm">
                            <EditableField
                              value={String(line.quantity)}
                              onSave={(v) =>
                                handleUpdate(
                                  `lines.${line.lineId}.quantity`,
                                  parseFloat(v) || 0,
                                )
                              }
                              suffix={line.unit ? ` ${line.unit}` : undefined}
                            />
                          </td>
                          <td className="px-2 py-3 text-center text-sm">
                            <EditableField
                              value={formatPrice(line.unitPriceHT)}
                              onSave={(v) =>
                                handleUpdate(
                                  `lines.${line.lineId}.unitPriceHT`,
                                  parseFloat(v.replace(",", ".")) || 0,
                                )
                              }
                              suffix=" €"
                            />
                          </td>
                          <td className="px-2 py-3 text-center text-sm text-muted-foreground">
                            <EditableField
                              value={String(line.vatRate)}
                              onSave={(v) =>
                                handleUpdate(
                                  `lines.${line.lineId}.vatRate`,
                                  parseFloat(v) || 0,
                                )
                              }
                              suffix=" %"
                            />
                          </td>
                          <td className="px-2 py-3 text-right text-sm font-medium">
                            {formatPrice(line.totalHT)} €
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
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
                onSave={(v) =>
                  handleUpdate("deposit", parseFloat(v.replace(",", ".")) || 0)
                }
                suffix=" €"
              />
            </span>
          </div>
          <div className="flex justify-between font-bold border-t border-border pt-1">
            <span>Total TTC</span>
            <span>{formatPrice(data.totalTTC)} €</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-start mt-6">
        <div>
          <h3 className="font-bold mb-2">Conditions de paiement</h3>
          <p className="text-xs max-w-sm text-muted-foreground whitespace-pre-line">
            {data.company.paymentTerms || data.paymentConditions || "Aucune"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Lu et approuvé</p>
          <p className="text-muted-foreground">Le : {data.date}</p>
          <p className="text-muted-foreground mb-2">Signature :</p>
          {signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signature}
              alt="Signature"
              className="w-48 h-24 object-contain ml-auto"
            />
          ) : (
            <div className="w-48 h-20 border-b border-border"></div>
          )}
        </div>
      </div>

      {/* Legal Notice */}
      <div className="text-center mt-8 text-xs text-muted-foreground whitespace-pre-line">
        {data.company.legalNotice || "Aucune mention légale"}
      </div>
    </div>
  );
}
