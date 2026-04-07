"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import Image from "next/image"

const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setError("E-Mail oder Passwort ist falsch.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — black branding panel */}
      <div className="hidden lg:flex w-1/2 bg-[#010101] flex-col items-center justify-center p-12">
        <Image src="/logo-white.svg" alt="Bensel Media" width={220} height={78} className="mb-10" />
        <p className="text-white/30 text-sm text-center max-w-xs leading-relaxed">
          Social Media Management für professionelle Agenturen.
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Image src="/logo.svg" alt="Bensel Media" width={160} height={57} />
          </div>

          <h1 className="text-2xl font-semibold text-[#010101] mb-1">Anmelden</h1>
          <p className="text-sm text-gray-400 mb-8">Willkommen zurück</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#010101] mb-1.5">
                E-Mail
              </label>
              <input
                type="email"
                placeholder="name@bensel-media.de"
                {...register("email")}
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm outline-none focus:border-[#010101] transition-colors placeholder:text-gray-300"
              />
              {errors.email && (
                <p className="text-xs text-[#ca151a] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#010101] mb-1.5">
                Passwort
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm outline-none focus:border-[#010101] transition-colors placeholder:text-gray-300"
              />
              {errors.password && (
                <p className="text-xs text-[#ca151a] mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-[#ca151a]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#010101] text-white rounded-md py-2.5 text-sm font-medium hover:bg-[#ca151a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Wird angemeldet..." : "Anmelden"}
            </button>
          </form>

          <p className="text-xs text-gray-300 text-center mt-8">
            Kein Zugang? Administrator kontaktieren.
          </p>
        </div>
      </div>
    </div>
  )
}
