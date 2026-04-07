"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClientCard } from "@/components/client-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import axios from "axios"
import { useSearchParams } from "next/navigation"

interface Client {
  id: string
  name: string
  logo: string | null
  socialAccounts: Array<{
    id: string
    platform: any
    accountName: string
  }>
  _count: { posts: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [creating, setCreating] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")

    if (error === "oauth_failed") {
      toast({
        title: "Verbindung fehlgeschlagen",
        description: "Die OAuth-Verbindung konnte nicht hergestellt werden.",
        variant: "destructive",
      })
    }
  }, [searchParams])

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/clients")
      setClients(response.data)
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kunden konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createClient = async () => {
    if (!newClientName.trim()) return

    setCreating(true)
    try {
      const response = await axios.post("/api/clients", { name: newClientName.trim() })
      setClients([...clients, { ...response.data, socialAccounts: [], _count: { posts: 0 } }])
      setNewClientName("")
      setShowDialog(false)
      toast({
        title: "Kunde erstellt",
        description: `${newClientName} wurde erfolgreich hinzugefügt.`,
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kunde konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clients.length} Kunden verwaltet
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Kunden suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          {search ? (
            <p className="text-gray-500">Keine Kunden gefunden für "{search}"</p>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">Noch keine Kunden vorhanden</p>
              <Button
                onClick={() => setShowDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ersten Kunden anlegen
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Create client dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Kunden anlegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Kundenname</Label>
              <Input
                id="clientName"
                placeholder="z.B. Mustermann GmbH"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createClient()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={createClient}
              disabled={!newClientName.trim() || creating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
