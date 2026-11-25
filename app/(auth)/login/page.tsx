import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bon retour 👋</h1>
        <p className="text-sm text-muted-foreground">Connecte-toi pour retrouver ton pipeline.</p>
      </div>
      <AuthForm mode="login" />
    </>
  );
}
