"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function JuriLoginPage() {
  const router = useRouter();
  const [juriId, setJuriId] = useState("");

  const handleLogin = () => {
    if (juriId) {
      router.push(`/juri/${juriId}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Gavel className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-3xl">Juri Login</CardTitle>
            </div>
          <CardDescription>Pilih nomor juri Anda untuk memulai penilaian.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nomor Juri</Label>
            <Select onValueChange={setJuriId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih nomor juri..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={`juri${num}`}>
                    Juri {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleLogin} className="w-full" disabled={!juriId}>
            Masuk
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
