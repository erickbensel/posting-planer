"use client"

import { useState } from "react"
import { PostComposer } from "@/components/post-composer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"

interface SocialAccount {
  id: string
  platform: any
  accountName: string
  accountId: string
}

interface Client {
  id: string
  name: string
  socialAccounts: SocialAccount[]
}

interface PostComposerWrapperProps {
  clients: Client[]
  defaultClientId: string
}

export function PostComposerWrapper({
  clients,
  defaultClientId,
}: PostComposerWrapperProps) {
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId)

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  if (clients.length === 0) {
    return (
      <div className="text-center py-20">
        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Kein Kunde vorhanden
        </h3>
        <p className="text-gray-500 mb-4">
          Lege zuerst einen Kunden an, um Beiträge zu erstellen.
        </p>
        <a
          href="/clients"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Kunden anlegen
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Client selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Kunde:
        </label>
        <Select
          value={selectedClientId}
          onValueChange={setSelectedClientId}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Kunden wählen" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClient ? (
        selectedClient.socialAccounts.length === 0 ? (
          <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 font-medium">
              Keine Social-Media-Kanäle verbunden
            </p>
            <p className="text-amber-600 text-sm mt-1">
              Verbinde zunächst mindestens einen Kanal für{" "}
              <strong>{selectedClient.name}</strong>.
            </p>
            <a
              href={`/clients/${selectedClient.id}`}
              className="inline-flex items-center mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Kanäle verbinden
            </a>
          </div>
        ) : (
          <PostComposer
            clientId={selectedClient.id}
            socialAccounts={selectedClient.socialAccounts}
          />
        )
      ) : null}
    </div>
  )
}
