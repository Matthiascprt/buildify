"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addClient } from "@/lib/supabase/api";
import type { Client } from "@/lib/supabase/types";

type ClientType = "particulier" | "professionnel";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export function NewClientModal({
  isOpen,
  onClose,
  onClientCreated,
}: NewClientModalProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    type: "particulier" as ClientType,
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      type: "particulier",
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await addClient({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        type: formData.type,
      });

      if (result.success && result.client) {
        onClientCreated(result.client);
        resetForm();
        onClose();
      } else {
        console.error("Error adding client:", result.error);
      }
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Nouveau client</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new_last_name" className="text-sm">
                Nom
              </Label>
              <Input
                id="new_last_name"
                placeholder="Dupont"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_first_name" className="text-sm">
                Prénom
              </Label>
              <Input
                id="new_first_name"
                placeholder="Jean"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_email" className="text-sm">
              Email
            </Label>
            <Input
              id="new_email"
              type="email"
              placeholder="jean.dupont@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_phone" className="text-sm">
              Téléphone
            </Label>
            <Input
              id="new_phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_type" className="text-sm">
              Type
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as ClientType })
              }
            >
              <SelectTrigger id="new_type" className="w-full">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="particulier">Particulier</SelectItem>
                <SelectItem value="professionnel">Professionnel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={
              isPending || (!formData.first_name && !formData.last_name)
            }
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
}
