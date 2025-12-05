"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreCollection, useFirestoreDocument } from "@/lib/hooks/use-firestore";
import type { Participant, Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Play, RefreshCw, SkipForward } from "lucide-react";

const initialMatchState: Match = {
  participantId: null,
  participantName: "",
  participantContingent: "",
  numberOfJudges: 6,
  status: 'idle',
  scores: {},
  finalScore: null,
  deviation: null,
  judgesTotals: null,
  medianScores: {},
};

export function MatchControls() {
  const { data: participants, loading: participantsLoading } = useFirestoreCollection<Participant>('participants');
  const { data: match, loading: matchLoading } = useFirestoreDocument<Match>('match', 'current');
  
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
      
      await setDoc(doc(db, "timer", "state"), { isRunning: true, startTime: Date.now(), duration: 180 });

      toast({ title: "Pertandingan Dimulai!", description: `${participant.name} dari ${participant.contingent} sedang bertanding.` });
    } catch (error) {
      console.error("Error starting match:", error);
      toast({ title: "Error", description: "Gagal memulai pertandingan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetOrNext = async (isNext: boolean = false) => {
    setIsSubmitting(true);
    let nextParticipantId: string | null = null;
  
    if (isNext && match?.participantId && participants.length > 0) {
      const sortedParticipants = [...participants].sort((a, b) => a.matchNumber - b.matchNumber);
      const currentParticipant = sortedParticipants.find(p => p.id === match.participantId);
      if (currentParticipant) {
        const currentIndex = sortedParticipants.findIndex(p => p.id === currentParticipant.id);
        if (currentIndex !== -1 && currentIndex + 1 < sortedParticipants.length) {
          nextParticipantId = sortedParticipants[currentIndex + 1].id;
        }
      }
    }
  
    try {
      const resetState: Match = {
        ...initialMatchState,
        numberOfJudges: numberOfJudges, // Keep the number of judges
      };
      await setDoc(doc(db, "match", "current"), resetState);
      await setDoc(doc(db, "timer", "state"), { isRunning: false, startTime: null, duration: 180 });
  
      setSelectedParticipantId(nextParticipantId);
  
      toast({ title: isNext ? "Partai Selanjutnya Siap" : "Papan Skor Direset", description: "Siap untuk pertandingan berikutnya." });
    } catch (error) {
      console.error("Error resetting match:", error);
      toast({ title: "Error", description: "Gagal mereset pertandingan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = participantsLoading || matchLoading;
  const isMatchRunning = match?.status === 'running';
  const isMatchFinished = match?.status === 'finished';

  const sortedParticipants = participants ? [...participants].sort((a, b) => a.matchNumber - b.matchNumber) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrol Pertandingan</CardTitle>
        <CardDescription>
          {isMatchFinished ? `Pertandingan ${match?.participantName} Selesai. Siapkan partai berikutnya.` : 'Atur dan mulai pertandingan baru dari sini.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Pilih Peserta</Label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={selectedParticipantId || ""} 
              onValueChange={setSelectedParticipantId} 
              disabled={isSubmitting || isMatchRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih seorang peserta" />
              </SelectTrigger>
              <SelectContent>
                {sortedParticipants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>Partai {p.matchNumber}: {p.name} - {p.contingent}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
            <Label>Jumlah Juri</Label>
            <RadioGroup 
                value={String(numberOfJudges)} 
                onValueChange={(val) => setNumberOfJudges(val === '4' ? 4 : 6)} 
                className="flex items-center gap-4" 
                disabled={isSubmitting || isMatchRunning}
            >
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
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>
            {isMatchRunning ? 'Pertandingan sedang berjalan. Gunakan tombol "Reset" untuk menghentikan dan menghapus data saat ini.' : 'Pilihan Anda akan tersimpan otomatis. Tekan "Mulai" jika sudah siap.'}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          {isMatchFinished ? (
             <Button onClick={() => handleResetOrNext(true)} disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <SkipForward className="mr-2" /> Partai Selanjutnya
            </Button>
          ) : (
            <>
              <Button onClick={handleStartMatch} disabled={isLoading || isSubmitting || !selectedParticipantId || isMatchRunning} className="flex-1 bg-green-600 hover:bg-green-700">
                <Play className="mr-2" /> {isSubmitting ? "Memulai..." : "Mulai Pertandingan"}
              </Button>
              <Button onClick={() => handleResetOrNext(false)} variant="destructive" disabled={isSubmitting || isLoading} className="flex-1">
                <RefreshCw className="mr-2" /> {isSubmitting ? "Mereset..." : "Reset Pertandingan"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
