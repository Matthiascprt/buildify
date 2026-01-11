import { Chat } from "@/components/edition/chat";
import { DocumentPreview } from "@/components/edition/document-preview";

export default function EditionPage() {
  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2">
      <div className="border-r">
        <Chat />
      </div>
      <div className="hidden lg:block">
        <DocumentPreview />
      </div>
    </div>
  );
}
