"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreCollection } from "@/lib/hooks/use-firestore";
import type { Participant, Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const initialMatchState: Match = {
  participantId: null,
  participantName: "",
  participantContingent: "",
  numberOfJudges: 6,
  status: 'idle',
  scores: {},
  finalScore: null,
  judgesTotals: null,
  medianScores: {},
};

export function MatchControls() {
  const { data: participants, loading: participantsLoading } = useFirestoreCollection<Participant>('participants');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [numberOfJudges, setNumberOfJudges] = useState<4 | 6>(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleStartMatch = async () => {
    if (!selectedParticipantId) {
      toast({ title: "Error", description: "Silakan pilih peserta.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const participant = participants.find(p => p.id === selectedParticipantId);
      if (!participant) {
        toast({ title: "Error", description: "Peserta tidak ditemukan.", variant: "destructive" });
        return;
      }
      
      const newMatchState: Match = {
        ...initialMatchState,
        participantId: participant.id,
        participantName: participant.name,
        participantContingent: participant.contingent,
        numberOfJudges: numberOfJudges,
        status: 'running',
      };
      await setDoc(doc(db, "match", "current"), newMatchState);
      
      // Reset timer
      await setDoc(doc(db, "timer", "state"), { isRunning: false, startTime: null, duration: 180 });

      toast({ title: "Pertandingan Dimulai!", description: `${participant.name} dari ${participant.contingent} sedang bertanding.` });
    } catch (error) {
      console.error("Error starting match:", error);
      toast({ title: "Error", description: "Gagal memulai pertandingan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetMatch = async () => {
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "match", "current"), initialMatchState);
      await setDoc(doc(db, "timer", "state"), { isRunning: false, startTime: null, duration: 180 });
      toast({ title: "Pertandingan Direset", description: "Status pertandingan telah kembali ke idle." });
    } catch (error) {
      console.error("Error resetting match:", error);
      toast({ title: "Error", description: "Gagal mereset pertandingan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrol Pertandingan</CardTitle>
        <CardDescription>Atur dan mulai pertandingan baru dari sini.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Pilih Peserta</Label>
          {participantsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select onValueChange={setSelectedParticipantId} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih seorang peserta" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} - {p.contingent}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
            <Label>Jumlah Juri</Label>
            <RadioGroup defaultValue="6" onValueChange={(val) => setNumberOfJudges(val === '4' ? 4 : 6)} className="flex items-center gap-4" disabled={isSubmitting}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="r2" />
                    <Label htmlFor="r2">4 Juri</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="6" id="r3" />
                    <Label htmlFor="r3">6 Juri</Label>
                </div>
            </RadioGroup>
        </div>
        
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Perhatian!</AlertTitle>
          <AlertDescription>
            Menekan "Mulai Pertandingan" akan menghapus data pertandingan sebelumnya. Gunakan "Reset" untuk membersihkan papan skor secara manual.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={handleStartMatch} disabled={isSubmitting || !selectedParticipantId} className="flex-1 bg-green-600 hover:bg-green-700">
            {isSubmitting ? "Memulai..." : "Mulai Pertandingan"}
          </Button>
          <Button onClick={handleResetMatch} variant="destructive" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Mereset..." : "Reset Pertandingan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
