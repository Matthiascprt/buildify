import { redirect } from "next/navigation";

export default function MentionsLegalesPage() {
  redirect("/legal?section=mentions");
}
