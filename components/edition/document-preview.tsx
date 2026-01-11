import { FileText } from "lucide-react";

export function DocumentPreview() {
  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Aperçu du document</h2>
        <p className="text-sm text-muted-foreground">
          Votre devis ou facture apparaîtra ici
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex aspect-[210/297] w-full max-w-md flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background">
          <FileText className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Document A4
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Le contenu généré apparaîtra ici
          </p>
        </div>
      </div>
    </div>
  );
}
