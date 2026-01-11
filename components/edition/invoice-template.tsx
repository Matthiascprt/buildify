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
      id: "2.1",
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

interface InvoiceTemplateProps {
  data?: InvoiceData;
}

export function InvoiceTemplate({ data = defaultData }: InvoiceTemplateProps) {
  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-black p-8 text-sm font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-40 h-20 bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
          LOGO
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">Facture n° {data.number}</h1>
          <p className="text-gray-600">Date d&apos;émission : {data.date}</p>
          <p className="text-gray-600">Échéance : {data.dueDate}</p>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Company */}
        <div>
          <h2 className="font-bold text-lg mb-3">{data.company.name}</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>{data.company.address}</p>
                <p>{data.company.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <p>{data.company.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <p>{data.company.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0" />
              <p>{data.company.siret}</p>
            </div>
          </div>
        </div>

        {/* Client */}
        <div>
          <h2 className="font-bold text-lg mb-3">Client</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>{data.client.address}</p>
                <p>{data.client.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <p>{data.client.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <p>{data.client.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0" />
              <p>{data.client.siret}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Title */}
      <h2 className="text-xl font-bold mb-4">{data.projectTitle}</h2>

      {/* Items Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 font-semibold text-gray-700">#</th>
              <th className="px-3 py-2 font-semibold text-gray-700">
                Désignation
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700 text-center">
                Quantité
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700 text-center">
                Prix unitaire HT
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700 text-center">
                TVA
              </th>
              <th className="px-3 py-2 font-semibold text-gray-700 text-right">
                Total TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr
                key={`${item.id}-${index}`}
                className="border-t border-gray-200"
              >
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
                    <td className="px-3 py-2 text-gray-600">{item.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.designation}</div>
                      {item.description && (
                        <div className="text-gray-500 text-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {item.unitPrice} €
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {item.tva}%
                    </td>
                    <td className="px-3 py-2 text-right">{item.total} €</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-48 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT</span>
                <span>{data.totalHT} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA {data.tvaRate}%</span>
                <span>{data.tvaAmount} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Acompte versé</span>
                <span>-{data.deposit} €</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                <span>Total TTC</span>
                <span>{data.totalTTC}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Payment Conditions Only (no signature for invoice) */}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Condition de paiement</h3>
        <p className="text-gray-600 text-xs max-w-xs">
          {data.paymentConditions}
        </p>
      </div>

      {/* Legal Notice */}
      <div className="text-center mt-8 text-gray-500 text-xs">
        Mention légales
      </div>
    </div>
  );
}
