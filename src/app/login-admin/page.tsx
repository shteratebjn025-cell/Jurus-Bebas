"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SilatScorerLogo } from "@/components/icons";
import { Shield } from "lucide-react";

const ADMIN_PASSWORD = "psht"; // In a real app, use a secure auth system

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password === ADMIN_PASSWORD) {
      try {
        window.localStorage.setItem("silatscorer_admin_verified", "true");
        toast({
          title: "Login Berhasil",
          description: "Mengarahkan ke panel admin.",
        });
        router.push("/admin");
      } catch (error) {
        toast({
            title: "Error",
            description: "Local storage tidak tersedia.",
            variant: "destructive",
          });
      }
    } else {
      toast({
        title: "Login Gagal",
        description: "Password yang Anda masukkan salah.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
            </div>
          <CardDescription>Masukkan password untuk mengakses panel admin.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memverifikasi..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
