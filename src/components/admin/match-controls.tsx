
"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreCollection, useFirestoreDocument } from "@/lib/hooks/use-firestore";
import type { Participant, Match, Result, Timer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Play, RefreshCw, Save, SkipForward } from "lucide-react";
import { calculateMedian, calculateStandardDeviation } from "@/lib/utils";

const JURUS_NAMES = [
    "1.A", "1.B", "2.A", "2.B", "3.A", "3.B", "4.A", "4.B", "4.C", "4.D", 
    "5", "6", "7.A", "7.B", "8.A", "8.B", "8.C", "9", "10.A", "10.B",
    "11.A", "11.B", "12", "13", "14.A", "14.B", "15", "16.A1", "16.A2", "16.B",
    "17.A", "17.B", "18.A", "18.B", "19.A", "19.B", "20.A", "20.B", "21", "22",
    "23.A", "23.B", "24.A", "24.B", "25.A", "25.B", "26", "27.A1", "27.A2", 
    "27.A3", "27.B", "28", "29.A", "29.B", "30", "31", "32", "33", "34", "35"
  ];
  
const BASE_SCORE = 38.1;

const initialMatchState: Omit<Match, 'id'> = {
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
  timeUsedInSeconds: null,
};

// Store original timer duration when a match starts
let originalTimerDuration = 180;

export function MatchControls() {
  const { data: participants, loading: participantsLoading } = useFirestoreCollection<Participant>('participants');
  const { data: match, loading: matchLoading } = useFirestoreDocument<Match>('match', 'current');
  const { data: participant } = useFirestoreDocument<Participant>('participants', match?.participantId || 'dummy_id');
  
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [numberOfJudges, setNumberOfJudges] = useState<4 | 6>(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedJudges = window.localStorage.getItem('silatscorer_num_judges');
      if (savedJudges && (savedJudges === '4' || savedJudges === '6')) {
        setNumberOfJudges(parseInt(savedJudges) as 4 | 6);
      }
    } catch (error) {
        console.error("Could not read from local storage:", error);
    }
  }, []);

  useEffect(() => {
    if (match) {
        setSelectedParticipantId(match.participantId);
    }
  }, [match]);


  const handleNumberOfJudgesChange = (val: string) => {
    const num = val === '4' ? 4 : 6;
    setNumberOfJudges(num);
    try {
        window.localStorage.setItem('silatscorer_num_judges', String(num));
    } catch (error) {
        console.error("Could not write to local storage:", error);
    }
  };

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
      
      // Get current timer duration to store it as the original duration for this match
      const timerRef = doc(db, "timer", "state");
      const timerSnap = await getDoc(timerRef);
      if (timerSnap.exists()) {
        originalTimerDuration = timerSnap.data().duration;
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
    let toastMessage = { title: "Papan Skor Direset", description: "Siap untuk pertandingan baru." };

    try {
        let nextMatchState: Match = { ...initialMatchState, numberOfJudges: numberOfJudges };

        if (isNext && match?.participantId && participants && participants.length > 0) {
            const sortedParticipants = [...participants].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
            const currentIndex = sortedParticipants.findIndex(p => p.id === match.participantId);
            
            const nextParticipant = sortedParticipants.find((p, index) => index > currentIndex);

            if (nextParticipant) {
                nextMatchState = {
                    ...initialMatchState,
                    participantId: nextParticipant.id,
                    participantName: nextParticipant.name,
                    participantContingent: nextParticipant.contingent,
                    numberOfJudges: numberOfJudges,
                    status: 'idle',
                };
                toastMessage = { title: "Partai Selanjutnya Siap", description: `Peserta berikutnya: ${nextParticipant.name}. Tekan "Mulai" untuk bertanding.` };
            } else {
                 nextMatchState = { ...initialMatchState, numberOfJudges: numberOfJudges, status: 'idle', participantId: null };
                 toastMessage = { title: "Kompetisi Selesai", description: "Ini adalah peserta terakhir. Papan skor direset." };
            }
        }
      
        await setDoc(doc(db, "match", "current"), nextMatchState);
        toast(toastMessage);

    } catch (error) {
      console.error("Error setting next/reset match:", error);
      toast({ title: "Error", description: "Gagal memproses tindakan.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFinishMatch = async () => {
    if (!match || !participant || !match.participantId) {
        toast({ title: 'Error', description: 'Data pertandingan atau peserta tidak lengkap untuk menyimpan hasil.', variant: 'destructive' });
        return;
    }
    setIsFinishing(true);

    const judges = Object.keys(match.scores).filter(id => match.scores[id]?.finished);
    if (judges.length < match.numberOfJudges) {
        toast({ title: 'Peringatan', description: 'Belum semua juri menyelesaikan penilaian.', variant: 'destructive' });
        setIsFinishing(false);
        return;
    }

    const medianScores: { [key: string]: number } = {};
    const judgesTotals: { judgeId: string; total: number }[] = [];
    
    JURUS_NAMES.forEach((_, index) => {
        const jurusKey = `jurus_${index + 1}`;
        const jurusScores = judges.map(juriId => match.scores[juriId]?.[jurusKey]).filter(s => s !== undefined) as number[];
        medianScores[jurusKey] = calculateMedian(jurusScores);
    });

    const staminaScores = judges.map(juriId => match.scores[juriId]?.stamina).filter(s => s !== undefined) as number[];
    medianScores['stamina'] = calculateMedian(staminaScores);

    const totalJurusScore = Object.keys(medianScores)
        .filter(key => key !== 'stamina')
        .reduce((sum, key) => sum + (medianScores[key] || 0), 0);
        
    const finalScore = BASE_SCORE + totalJurusScore + (medianScores['stamina'] || 0);

    judges.forEach(juriId => {
        const scores = match.scores[juriId];
        if (scores) {
            let total = 0;
            JURUS_NAMES.forEach((_, index) => {
                total += scores[`jurus_${index + 1}`] || 0;
            });
            total += scores.stamina || 0;
            judgesTotals.push({ judgeId: juriId, total: parseFloat((BASE_SCORE + total).toFixed(2)) });
        }
    });

    const allJudgeTotals = judgesTotals.map(j => j.total);
    const deviation = calculateStandardDeviation(allJudgeTotals);
    
    const finalDeviation = parseFloat(deviation.toFixed(2));
    const finalScoreFloat = parseFloat(finalScore.toFixed(2));

    try {
        // --- Calculate Time Used ---
        const timerRef = doc(db, "timer", "state");
        const timerSnap = await getDoc(timerRef);
        let timeUsedInSeconds = 0;

        if (timerSnap.exists()) {
            const timerState = timerSnap.data() as Timer;
            const remainingDuration = timerState.duration;

            if (originalTimerDuration > remainingDuration) {
                timeUsedInSeconds = originalTimerDuration - remainingDuration;
            }
             // If timer was never started or reset without starting, used time is 0.
        }

        const matchRef = doc(db, "match", "current");
        await updateDoc(matchRef, {
            status: 'finished',
            finalScore: finalScoreFloat,
            deviation: finalDeviation,
            medianScores,
            judgesTotals,
            timeUsedInSeconds: timeUsedInSeconds,
        });

        const resultData: Result = {
          participantId: match.participantId,
          participantName: match.participantName,
          participantContingent: match.participantContingent,
          ageCategory: participant.ageCategory,
          finalScore: finalScoreFloat,
          deviation: finalDeviation,
          judgesTotals: judgesTotals,
          medianScores: medianScores,
          numberOfJudges: match.numberOfJudges,
          scores: match.scores,
          createdAt: serverTimestamp(),
          timeUsedInSeconds: timeUsedInSeconds,
        }
        await addDoc(collection(db, 'results'), resultData);

        const participantRef = doc(db, 'participants', match.participantId);
        await deleteDoc(participantRef);

        toast({ title: 'Pertandingan Selesai', description: `Skor akhir telah dihitung dan peserta telah diarsipkan.` });
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Gagal menyelesaikan pertandingan.', variant: 'destructive' });
    } finally {
        setIsFinishing(false);
    }
  };

  const isLoading = participantsLoading || matchLoading;
  const isMatchRunning = match?.status === 'running';
  const isMatchFinished = match?.status === 'finished';

  const sortedParticipants = participants ? [...participants].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0)) : [];
  
  const finishedJudgesCount = match?.scores ? Object.values(match.scores).filter(s => s.finished).length : 0;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrol Pertandingan</CardTitle>
        <CardDescription>
          {isMatchRunning ? `Pertandingan ${match?.participantName} sedang berjalan.` : isMatchFinished ? `Pertandingan ${match?.participantName} Selesai. Lanjut ke partai berikutnya.` : 'Atur dan mulai pertandingan baru dari sini.'}
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
              disabled={isSubmitting || isMatchRunning || isMatchFinished}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih seorang peserta" />
              </SelectTrigger>
              <SelectContent>
                {sortedParticipants.map((p) => (
                  <SelectItem key={p.id} value={p.id as string}>Partai {p.matchNumber || '-'}: {p.name} - {p.contingent}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
            <Label>Jumlah Juri</Label>
            <RadioGroup 
                value={String(numberOfJudges)} 
                onValueChange={handleNumberOfJudgesChange}
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
            {isMatchRunning ? `Pertandingan sedang berjalan. ${finishedJudgesCount}/${numberOfJudges} juri telah selesai.` : 'Pilihan Anda akan tersimpan otomatis. Tekan "Mulai" jika sudah siap.'}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-4">
           <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleStartMatch} disabled={isLoading || isSubmitting || !selectedParticipantId || isMatchRunning || isMatchFinished} className="bg-green-600 hover:bg-green-700">
                <Play className="mr-2" /> {isSubmitting ? "Memulai..." : "Mulai Pertandingan"}
              </Button>
              <Button onClick={() => handleResetOrNext(false)} variant="destructive" disabled={isSubmitting || isLoading}>
                <RefreshCw className="mr-2" /> {isSubmitting ? "Mereset..." : "Reset Papan Skor"}
              </Button>
            </div>
            {isMatchRunning && (
                <Button onClick={handleFinishMatch} disabled={isFinishing} className="w-full" size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    {isFinishing ? 'Menyimpan...' : `Selesaikan Pertandingan & Simpan (${finishedJudgesCount}/${numberOfJudges})`}
                </Button>
            )}
            {isMatchFinished && (
                 <Button onClick={() => handleResetOrNext(true)} disabled={isSubmitting || isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    <SkipForward className="mr-2" /> Lanjut ke Partai Selanjutnya
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

    