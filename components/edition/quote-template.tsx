import { MapPin, Phone, Mail, FileText } from "lucide-react";

interface LineItem {
  id: string;
  designation: string;
  description?: string;
  quantity?: string;
  unitPrice?: number;
  tva?: number;
  total?: number;
  isSection?: boolean;
  sectionTotal?: number;
}

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

const defaultData: QuoteData = {
  number: "0777",
  date: "01/01/2026",
  validity: "1 mois",
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
      id: "1",
      designation: "Démolition et préparation",
      isSection: true,
      sectionTotal: 360,
    },
    {
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
      id: "1.2",
      designation: "Dépose carrelage mural",
      description:
        "Retrait de l'ancien carrelage, protection des surfaces adjacentes",
      quantity: "10m²",
      unitPrice: 15,
      tva: 20,
      total: 180,
    },
    {
      id: "2",
      designation: "Démolition et préparation",
      isSection: true,
      sectionTotal: 360,
    },
    {
      id: "2.1",
      designation: "Dépose carrelage mural",
      description:
        "Retrait de l'ancien carrelage, protection des surfaces adjacentes",
      quantity: "10m²",
      unitPrice: 15,
      tva: 20,
      total: 180,
    },
    {
      id: "2.2",
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

interface QuoteTemplateProps {
  data?: QuoteData;
  showIcons?: boolean;
}

export function QuoteTemplate({
  data = defaultData,
  showIcons = true,
}: QuoteTemplateProps) {
  return (
    <div className="w-full max-w-[210mm] mx-auto bg-card text-card-foreground p-8 text-sm font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-40 h-20 bg-muted flex items-center justify-center text-muted-foreground font-semibold">
          LOGO
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">Devis n° {data.number}</h1>
          <p className="text-muted-foreground">Réalisé le {data.date}</p>
          <p className="text-muted-foreground">Valable {data.validity}</p>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Company */}
        <div>
          <h2 className="font-bold text-lg mb-3">{data.company.name}</h2>
          <div className="space-y-2 text-muted-foreground">
            <div className={showIcons ? "flex items-start gap-2" : ""}>
              {showIcons && <MapPin className="h-4 w-4 mt-0.5 shrink-0" />}
              <div>
                <p>{data.company.address}</p>
                <p>{data.company.city}</p>
              </div>
            </div>
            <div className={showIcons ? "flex items-center gap-2" : ""}>
              {showIcons && <Phone className="h-4 w-4 shrink-0" />}
              <p>{data.company.phone}</p>
            </div>
            <div className={showIcons ? "flex items-center gap-2" : ""}>
              {showIcons && <Mail className="h-4 w-4 shrink-0" />}
              <p>{data.company.email}</p>
            </div>
            <div className={showIcons ? "flex items-center gap-2" : ""}>
              {showIcons && <FileText className="h-4 w-4 shrink-0" />}
              <p>{data.company.siret}</p>
            </div>
          </div>
        </div>

        {/* Client */}
        <div>
          <h2 className="font-bold text-lg mb-3">Client</h2>
          <div className="space-y-2 text-muted-foreground">
            <div className={showIcons ? "flex items-start gap-2" : ""}>
              {showIcons && <MapPin className="h-4 w-4 mt-0.5 shrink-0" />}
              <div>
                <p>{data.client.address}</p>
                <p>{data.client.city}</p>
              </div>
            </div>
            <div className={showIcons ? "flex items-center gap-2" : ""}>
              {showIcons && <Phone className="h-4 w-4 shrink-0" />}
              <p>{data.client.phone}</p>
            </div>
            <div className={showIcons ? "flex items-center gap-2" : ""}>
              {showIcons && <Mail className="h-4 w-4 shrink-0" />}
              <p>{data.client.email}</p>
            </div>
            <div className={showIcons ? "flex items-center gap-2" : ""}>
              {showIcons && <FileText className="h-4 w-4 shrink-0" />}
              <p>{data.client.siret}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Title */}
      <h2 className="text-xl font-bold mb-4">{data.projectTitle}</h2>

      {/* Items Table */}
      <div className="border border-border rounded-lg overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-3 py-2 font-semibold text-muted-foreground">
                #
              </th>
              <th className="px-3 py-2 font-semibold text-muted-foreground">
                Désignation
              </th>
              <th className="px-3 py-2 font-semibold text-muted-foreground text-center">
                Quantité
              </th>
              <th className="px-3 py-2 font-semibold text-muted-foreground text-center">
                Prix unitaire HT
              </th>
              <th className="px-3 py-2 font-semibold text-muted-foreground text-center">
                TVA
              </th>
              <th className="px-3 py-2 font-semibold text-muted-foreground text-right">
                Total TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                {item.isSection ? (
                  <>
                    <td className="px-3 py-2 font-bold">{item.id}</td>
                    <td className="px-3 py-2 font-bold">{item.designation}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="px-3 py-2 font-bold text-right">
                      {item.sectionTotal} €
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-muted-foreground">
                      {item.id}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.designation}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {item.unitPrice} €
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {item.tva}%
                    </td>
                    <td className="px-3 py-2 text-right">{item.total} €</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-4">
        <div className="w-48 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total HT</span>
            <span>{data.totalHT} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA {data.tvaRate}%</span>
            <span>{data.tvaAmount} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Acompte versé</span>
            <span>-{data.deposit} €</span>
          </div>
          <div className="flex justify-between font-bold border-t border-border pt-1">
            <span>Total TTC</span>
            <span>{data.totalTTC}€</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-start mt-6">
        <div>
          <h3 className="font-bold mb-2">Condition de paiement</h3>
          <p className="text-xs max-w-xs text-muted-foreground">
            {data.paymentConditions}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Lu et approuvé</p>
          <p className="text-muted-foreground">Le : {data.date}</p>
          <p className="text-muted-foreground mb-8">Signature :</p>
          <div className="w-40 border-b border-border"></div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="text-center mt-8 text-xs text-muted-foreground">
        Mention légales
      </div>
    </div>
  );
}
