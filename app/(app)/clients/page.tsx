"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
} from "@/lib/supabase/api";
import type { Client } from "@/lib/supabase/types";
import { ClientDocuments } from "@/components/clients/client-documents";

type ClientType = "particulier" | "professionnel";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ClientType>("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    type: "particulier" as ClientType,
  });
  const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    type: "particulier" as ClientType,
  });

  useEffect(() => {
    async function loadClients() {
      setIsLoading(true);
      const data = await getClients();
      setClients(data);
      setIsLoading(false);
    }
    loadClients();
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setEditFormData({
      first_name: client.first_name ?? "",
      last_name: client.last_name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      type: (client.type as ClientType) ?? "particulier",
    });
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.first_name?.toLowerCase().includes(query) ||
          client.last_name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query),
      );
    }

    if (filterType !== "all") {
      result = result.filter((client) => client.type === filterType);
    }

    if (sortBy === "name") {
      result.sort((a, b) => {
        const nameA =
          `${a.first_name ?? ""} ${a.last_name ?? ""}`.toLowerCase();
        const nameB =
          `${b.first_name ?? ""} ${b.last_name ?? ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return result;
  }, [clients, searchQuery, filterType, sortBy]);

  const handleAddClient = () => {
    startTransition(async () => {
      const result = await addClient({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        type: formData.type,
      });

      if (result.success && result.client) {
        setClients((prev) => [result.client!, ...prev]);
        resetForm();
        setIsAddModalOpen(false);
      } else {
        setAddErrorMessage(
          result.error || "Erreur lors de la création du client",
        );
      }
    });
  };

  const handleUpdateClient = () => {
    if (!selectedClient) return;

    startTransition(async () => {
      const result = await updateClient(selectedClient.id, {
        first_name: editFormData.first_name || null,
        last_name: editFormData.last_name || null,
        email: editFormData.email || null,
        phone: editFormData.phone || null,
        type: editFormData.type,
      });

      if (result.success && result.client) {
        setClients((prev) =>
          prev.map((c) => (c.id === selectedClient.id ? result.client! : c)),
        );
        setSelectedClient(result.client);
      } else {
        console.error("Error updating client:", result.error);
      }
    });
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;

    startTransition(async () => {
      const result = await deleteClient(selectedClient.id);
      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
        setSelectedClient(null);
      } else {
        console.error("Error deleting client:", result.error);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      type: "particulier",
    });
    setAddErrorMessage(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg border"
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Gérez votre base de clients</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter */}
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as "all" | ClientType)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="particulier">Particuliers</SelectItem>
            <SelectItem value="professionnel">Professionnels</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "name" | "date")}
        >
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom (A → Z)</SelectItem>
            <SelectItem value="date">Date (récent → ancien)</SelectItem>
          </SelectContent>
        </Select>

        {/* New Client Button */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
              <DialogDescription>
                Remplissez les informations du nouveau client.
              </DialogDescription>
            </DialogHeader>
            {addErrorMessage && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{addErrorMessage}</span>
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add_last_name">Nom</Label>
                  <Input
                    id="add_last_name"
                    placeholder="Dupont"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_first_name">Prénom</Label>
                  <Input
                    id="add_first_name"
                    placeholder="Jean"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_email">Email</Label>
                <Input
                  id="add_email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_phone">Téléphone</Label>
                <Input
                  id="add_phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as ClientType })
                  }
                >
                  <SelectTrigger id="add_type" className="w-full">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particulier">Particulier</SelectItem>
                    <SelectItem value="professionnel">Professionnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(false);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleAddClient} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tous les clients</CardTitle>
            {clients.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedClients.length} client
                {filteredAndSortedClients.length > 1 ? "s" : ""}
                {filteredAndSortedClients.length !== clients.length &&
                  ` sur ${clients.length}`}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun client</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Ajoutez votre premier client ou créez un document pour en
                ajouter automatiquement.
              </p>
            </div>
          ) : filteredAndSortedClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground text-sm">
                Aucun client ne correspond à vos critères de recherche.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedClients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onClick={() => handleSelectClient(client)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog
        open={selectedClient !== null}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {selectedClient && (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {`${selectedClient.first_name?.charAt(0) ?? ""}${selectedClient.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {selectedClient.first_name} {selectedClient.last_name}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Modifiez les informations du client
                </DialogDescription>
              </DialogHeader>

              {/* Edit Form */}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_last_name">Nom</Label>
                    <Input
                      id="edit_last_name"
                      placeholder="Dupont"
                      value={editFormData.last_name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          last_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_first_name">Prénom</Label>
                    <Input
                      id="edit_first_name"
                      placeholder="Jean"
                      value={editFormData.first_name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          first_name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    placeholder="jean.dupont@example.com"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Téléphone</Label>
                  <Input
                    id="edit_phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_type">Type</Label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        type: value as ClientType,
                      })
                    }
                  >
                    <SelectTrigger id="edit_type" className="w-full">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">
                        Professionnel
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdateClient} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer les modifications
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Documents Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Documents</h3>
                <ClientDocuments clientId={selectedClient.id} />
              </div>

              <Separator className="my-4" />

              {/* Danger Zone */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Supprimer ce client
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteClient}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1.5" />
                  )}
                  Supprimer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ClientRowProps {
  client: Client;
  onClick: () => void;
}

function ClientRow({ client, onClick }: ClientRowProps) {
  const initials =
    `${client.first_name?.charAt(0) ?? ""}${client.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
    "?";

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Client Info */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Name and Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-semibold text-base truncate">
            {client.first_name} {client.last_name}
          </p>
          {client.type && (
            <Badge
              variant={
                client.type === "professionnel" ? "default" : "secondary"
              }
              className="text-xs shrink-0"
            >
              {client.type === "professionnel"
                ? "Professionnel"
                : "Particulier"}
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {client.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{client.email}</span>
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{client.phone}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
