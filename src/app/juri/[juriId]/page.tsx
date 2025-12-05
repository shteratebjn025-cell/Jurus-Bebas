"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirestoreDocument } from "@/lib/hooks/use-firestore";
import type { Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Loading from "@/app/loading";
import { SilatScorerLogo } from "@/components/icons";
import { Gavel, ShieldCheck, Trophy } from "lucide-react";

const TOTAL_JURUS = 59;
const STAMINA_SCORES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

export default function JuriPage() {
  const params = useParams();
  const juriId = params.juriId as string;
  const { data: match, loading } = useFirestoreDocument<Match>("match", "current");
  const [currentStep, setCurrentStep] = useState(1); // 1-59 for jurus, 60 for stamina

  const isScoringFinished =
    match?.scores[juriId] &&
    Object.keys(match.scores[juriId]).length === TOTAL_JURUS + 1;

  useEffect(() => {
    // Reset step when match changes
    setCurrentStep(1);
  }, [match?.participantId]);

  const handleScore = async (score: number) => {
    if (!match || !juriId || isScoringFinished) return;

    const field = currentStep <= TOTAL_JURUS ? `scores.${juriId}.jurus_${currentStep}` : `scores.${juriId}.stamina`;
    
    try {
        const matchRef = doc(db, "match", "current");
        await updateDoc(matchRef, { [field]: score });
        if(currentStep <= TOTAL_JURUS) {
            setCurrentStep(prev => prev + 1);
        }
    } catch (error) {
        console.error("Failed to submit score:", error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!match || match.status !== 'running') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <SilatScorerLogo className="h-24 w-24 text-primary mb-4" />
        <h1 className="font-headline text-3xl mb-2">Menunggu Pertandingan</h1>
        <p className="text-muted-foreground">Panel penilaian akan aktif setelah admin memulai pertandingan.</p>
      </div>
    );
  }

  if (isScoringFinished) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <Trophy className="h-24 w-24 text-accent mb-4" />
            <h1 className="font-headline text-3xl mb-2">Penilaian Selesai</h1>
            <p className="text-muted-foreground">Terima kasih, Anda telah menyelesaikan penilaian untuk peserta ini.</p>
            <p className="text-muted-foreground mt-2">Menunggu peserta berikutnya...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <div className="flex items-center justify-between">
                <div className="text-left">
                    <p className="font-bold text-lg">{match.participantName}</p>
                    <p className="text-sm text-muted-foreground">{match.participantContingent}</p>
                </div>
                <h2 className="font-bold text-lg text-primary">JURI {juriId.replace('juri','')}</h2>
            </div>
            <Progress value={(currentStep / (TOTAL_JURUS + 1)) * 100} className="mt-4" />
        </CardHeader>
        <CardContent>
          {currentStep <= TOTAL_JURUS ? (
            // Jurus Scoring
            <div className="text-center space-y-6">
              <h3 className="font-headline text-5xl">Jurus ke-{currentStep}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => handleScore(1)} className="h-24 text-2xl bg-green-600 hover:bg-green-700">
                    <ShieldCheck className="mr-2"/> Benar (1)
                </Button>
                <Button onClick={() => handleScore(0.5)} variant="destructive" className="h-24 text-2xl">
                    <Gavel className="mr-2"/> Kurang Benar (0.5)
                </Button>
              </div>
            </div>
          ) : (
            // Stamina Scoring
            <div className="text-center space-y-6">
              <h3 className="font-headline text-5xl">Penilaian Stamina</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {STAMINA_SCORES.map((score) => (
                  <Button
                    key={score}
                    onClick={() => handleScore(score)}
                    variant="outline"
                    className="h-16 text-xl"
                  >
                    {score.toFixed(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
