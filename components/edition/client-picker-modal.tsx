"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Client } from "@/lib/supabase/types";

interface ClientPickerModalProps {
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
}

export function ClientPickerModal({
  clients,
  isOpen,
  onClose,
  onSelect,
}: ClientPickerModalProps) {
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const searchLower = search.toLowerCase();
    return clients.filter((client) => {
      const firstName = client.first_name?.toLowerCase() || "";
      const lastName = client.last_name?.toLowerCase() || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower)
      );
    });
  }, [clients, search]);

  const getInitials = (client: Client) => {
    const first = client.first_name?.[0] || "";
    const last = client.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getFullName = (client: Client) => {
    const parts = [client.first_name, client.last_name].filter(Boolean);
    return parts.join(" ") || "Client sans nom";
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Sélectionner un client</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {search ? "Aucun client trouvé" : "Aucun client enregistré"}
            </div>
          ) : (
            <div className="py-2">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    onSelect(client);
                    onClose();
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(client)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">
                    {getFullName(client)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
