import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Créer ton espace</h1>
        <p className="text-sm text-muted-foreground">Tes données restent privées : chaque compte ne voit que les siennes.</p>
      </div>
      <AuthForm mode="signup" />
    </>
  );
}
