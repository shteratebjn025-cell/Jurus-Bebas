'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Match } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Loading from '@/app/loading';
import { SilatScorerLogo } from '@/components/icons';
import { Gavel, ShieldCheck, Trophy, CheckCircle } from 'lucide-react';

const JURUS_NAMES = [
  "1.A", "1.B", "2.A", "2.B", "3.A", "3.B", "4.A", "4.B", "4.C", "4.D", 
  "5", "6", "7.A", "7.B", "8.A", "8.B", "8.C", "9", "10.A", "10.B",
  "11.A", "11.B", "12", "13", "14.A", "14.B", "15", "16.A1", "16.A2", "16.B",
  "17.A", "17.B", "18.A", "18.B", "19.A", "19.B", "20.A", "20.B", "21", "22",
  "23.A", "23.B", "24.A", "24.B", "25.A", "25.B", "26", "27.A1", "27.A2", 
  "27.A3", "27.B", "28", "29.A", "29.B", "30", "31", "32", "33", "34"
];
const STAMINA_SCORES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

export default function JuriPage() {
  const params = useParams();
  const juriId = params.juriId as string;
  const { data: match, loading } = useFirestoreDocument<Match>(
    'match',
    'current'
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [staminaScore, setStaminaScore] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isScoringFinished = match?.scores?.[juriId]?.finished === true;

  useEffect(() => {
    // This effect now correctly synchronizes the current step based on Firestore data.
    if (match?.status === 'running' && !isScoringFinished) {
      const judgeScores = match.scores?.[juriId] || {};
      const jurusKeys = Object.keys(judgeScores).filter(k => k.startsWith('jurus_'));
      const lastScoredStep = jurusKeys.length > 0
        ? Math.max(0, ...jurusKeys.map(k => parseInt(k.split('_')[1])))
        : 0;
      
      setCurrentStep(lastScoredStep + 1);

      // Also, re-hydrate stamina score if it exists in Firestore
      if (judgeScores.stamina !== undefined) {
        setStaminaScore(judgeScores.stamina);
      }
    }

    // Reset for a new participant
    if (match?.status === 'running' && isScoringFinished) {
      // If the current match has a new participant, reset the UI for the judge.
      // The logic to reset is handled by the `isScoringFinished` flag.
    }
  }, [match, juriId, isScoringFinished]);


  const handleScore = async (score: number) => {
    if (!match || !juriId || isScoringFinished || isSubmitting) return;

    const isStamina = currentStep > JURUS_NAMES.length;

    if (isStamina) {
        setStaminaScore(score);
        return; // Just update local state for stamina until finish is clicked
    }
    
    setIsSubmitting(true);
    const field = `scores.${juriId}.jurus_${currentStep}`;

    try {
      const matchRef = doc(db, 'match', 'current');
      await updateDoc(matchRef, { [field]: score });
      // We no longer optimistically update currentStep here. 
      // The useEffect will handle it when Firestore data changes.
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishScoring = async () => {
    if (!match || !juriId || staminaScore === undefined || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const matchRef = doc(db, 'match', 'current');
      await updateDoc(matchRef, { 
          [`scores.${juriId}.stamina`]: staminaScore,
          [`scores.${juriId}.finished`]: true 
      });
    } catch (error) {
      console.error('Failed to finish scoring:', error);
    } finally {
      setIsSubmitting(false);
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
        <p className="text-muted-foreground">
          Panel penilaian akan aktif setelah admin memulai pertandingan.
        </p>
      </div>
    );
  }

  if (isScoringFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Trophy className="h-24 w-24 text-accent mb-4" />
        <h1 className="font-headline text-3xl mb-2">Penilaian Selesai</h1>
        <p className="text-muted-foreground">
          Terima kasih, Anda telah menyelesaikan penilaian untuk{' '}
          <span className="font-bold">{match.participantName}</span>.
        </p>
        <p className="text-muted-foreground mt-2 animate-pulse">
          Menunggu peserta berikutnya...
        </p>
      </div>
    );
  }

  const jurusProgress = currentStep > JURUS_NAMES.length ? JURUS_NAMES.length : currentStep - 1;
  const progressPercentage = ((jurusProgress + (staminaScore !== undefined ? 1 : 0)) / (JURUS_NAMES.length + 1)) * 100;


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-bold text-lg">{match.participantName}</p>
              <p className="text-sm text-muted-foreground">
                {match.participantContingent}
              </p>
            </div>
            <h2 className="font-bold text-lg text-primary">
              JURI {juriId.replace('juri', '')}
            </h2>
          </div>
          <Progress
            value={progressPercentage}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {currentStep <= JURUS_NAMES.length ? (
            // Jurus Scoring
            <div className="text-center space-y-6">
              <h3 className="font-headline text-5xl">Jurus {JURUS_NAMES[currentStep - 1]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleScore(1)}
                  className="h-24 text-2xl bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  <ShieldCheck className="mr-2" /> Benar (1)
                </Button>
                <Button
                  onClick={() => handleScore(0.5)}
                  variant="destructive"
                  className="h-24 text-2xl"
                  disabled={isSubmitting}
                >
                  <Gavel className="mr-2" /> Kurang Benar (0.5)
                </Button>
              </div>
            </div>
          ) : (
            // Stamina & Finish Scoring
            <div className="text-center space-y-6">
              <h3 className="font-headline text-5xl">Penilaian Stamina</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {STAMINA_SCORES.map((score) => (
                  <Button
                    key={score}
                    onClick={() => setStaminaScore(score)}
                    variant={
                      staminaScore === score
                        ? 'default'
                        : 'outline'
                    }
                    className="h-16 text-xl"
                    disabled={isSubmitting}
                  >
                    {score.toFixed(1)}
                  </Button>
                ))}
              </div>
              <Button
                onClick={handleFinishScoring}
                className="w-full h-20 text-2xl mt-4"
                size="lg"
                disabled={staminaScore === undefined || isSubmitting}
              >
                <CheckCircle className="mr-2" /> {isSubmitting ? 'Mengirim...' : 'Selesai & Kirim Nilai Akhir'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
