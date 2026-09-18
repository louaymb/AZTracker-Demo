"use client";

import { LogOut, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { initials } from "@/lib/format";

export function AccountCard() {
  const { profile, signOut } = useAuth();

  const name = profile?.displayName || profile?.email || "Benutzer";

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Konto
        </CardTitle>
        <CardDescription>
          Nur dieses Google-Konto hat Zugriff auf AusbildungTracker.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 shrink-0 rounded-lg">
            <AvatarImage src={profile?.photoURL || undefined} alt={name} />
            <AvatarFallback className="rounded-lg">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{name}</p>
            <p className="truncate text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-10 w-full sm:h-8 sm:w-auto"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 size-4" />
          Abmelden
        </Button>
      </CardContent>
    </Card>
  );
}
