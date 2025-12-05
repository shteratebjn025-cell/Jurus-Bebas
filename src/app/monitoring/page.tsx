"use client";

import { useState } from 'react';
import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Match, Participant, Result } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { calculateMedian } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Loading from '../loading';
import { SilatScorerLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const JURUS_NAMES = [
  "1.A", "1.B", "2.A", "2.B", "3.A", "3.B", "4.A", "4.B", "4.C", "4.D", 
  "5", "6", "7.A", "7.B", "8.A", "8.B", "8.C", "9", "10.A", "10.B",
  "11.A", "11.B", "12", "13", "14.A", "14.B", "15", "16.A1", "16.A2", "16.B",
  "17.A", "17.B", "18.A", "18.B", "19.A", "19.B", "20.A", "20.B", "21", "22",
  "23.A", "23.B", "24.A", "24.B", "25.A", "25.B", "26", "27.A1", "27.A2", 
  "27.A3", "27.B", "28", "29.A", "29.B", "30", "31", "32", "33", "34", "35"
];

const BASE_SCORE = 38.1;

export default function MonitoringPage() {
  const { data: match, loading } = useFirestoreDocument<Match>('match', 'current');
  // We need participant details for ageCategory
  const { data: participant } = useFirestoreDocument<Participant>('participants', match?.participantId || 'dummy');
  const [isFinishing, setIsFinishing] = useState(false);
  const { toast } = useToast();

  const handleFinishMatch = async () => {
    if (!match || !participant) return;
    setIsFinishing(true);

    const judges = Object.keys(match.scores).filter(id => match.scores[id]?.finished);
    if (judges.length < match.numberOfJudges) {
        toast({ title: 'Peringatan', description: 'Belum semua juri menyelesaikan penilaian.', variant: 'destructive' });
        setIsFinishing(false);
        return;
    }

    const medianScores: { [key: string]: number } = {};
    const judgesTotals: { judgeId: string; total: number }[] = [];
    
    // Calculate median for each jurus
    JURUS_NAMES.forEach((_, index) => {
        const jurusKey = `jurus_${index + 1}`;
        const jurusScores = judges.map(juriId => match.scores[juriId]?.[jurusKey]).filter(s => s !== undefined) as number[];
        medianScores[jurusKey] = calculateMedian(jurusScores);
    });

    // Calculate median for stamina
    const staminaScores = judges.map(juriId => match.scores[juriId]?.stamina).filter(s => s !== undefined) as number[];
    medianScores['stamina'] = calculateMedian(staminaScores);

    const totalJurusScore = Object.keys(medianScores)
        .filter(key => key !== 'stamina')
        .reduce((sum, key) => sum + (medianScores[key] || 0), 0);
        
    const finalScore = BASE_SCORE + totalJurusScore + (medianScores['stamina'] || 0);

    // Calculate total score for each judge
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

    // Calculate deviation
    const allJudgeTotals = judgesTotals.map(j => j.total);
    const deviation = allJudgeTotals.length > 0 ? Math.max(...allJudgeTotals) - Math.min(...allJudgeTotals) : 0;
    
    const finalDeviation = parseFloat(deviation.toFixed(2));
    const finalScoreFloat = parseFloat(finalScore.toFixed(2));

    try {
        const matchRef = doc(db, "match", "current");
        await updateDoc(matchRef, {
            status: 'finished',
            finalScore: finalScoreFloat,
            deviation: finalDeviation,
            medianScores,
            judgesTotals,
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
          createdAt: new Date(),
        }

        await addDoc(collection(db, 'results'), resultData);

        toast({ title: 'Pertandingan Selesai', description: `Skor akhir telah dihitung: ${finalScore.toFixed(2)}` });
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Gagal menyelesaikan pertandingan.', variant: 'destructive' });
    } finally {
        setIsFinishing(false);
    }
  };

  if (loading) return <Loading />;
  
  if (!match || match.status === 'idle') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <SilatScorerLogo className="h-24 w-24 text-primary mb-4" />
            <h1 className="font-headline text-3xl mb-2">Tidak Ada Pertandingan Aktif</h1>
            <p className="text-muted-foreground">Mulai pertandingan dari panel admin untuk memonitor skor.</p>
        </div>
    );
  }

  const judges = Array.from({ length: match.numberOfJudges }, (_, i) => `juri${i + 1}`);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-3xl'>Monitoring Skor - {match.status}</CardTitle>
          <CardDescription>{match.participantName} - {match.participantContingent}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Jurus</TableHead>
                        {judges.map(juriId => <TableHead key={juriId} className="text-center">{juriId.replace('juri', 'Juri ')}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {JURUS_NAMES.map((jurusName, index) => (
                        <TableRow key={jurusName}>
                            <TableCell>Jurus {jurusName}</TableCell>
                            {judges.map(juriId => (
                                <TableCell key={juriId} className="text-center font-mono">
                                    {match.scores?.[juriId]?.[`jurus_${index + 1}`] ?? '-'}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                        <TableCell>Stamina</TableCell>
                        {judges.map(juriId => (
                            <TableCell key={juriId} className="text-center font-mono">
                                {match.scores?.[juriId]?.stamina ?? '-'}
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Status Selesai</TableCell>
                        {judges.map(juriId => (
                            <TableCell key={juriId} className="text-center font-mono text-xs">
                                {match.scores?.[juriId]?.finished ? '✅' : '❌'}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
          </div>
          {match.status === 'running' && (
             <div className='mt-6'>
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Konfirmasi Penyelesaian</AlertTitle>
                    <AlertDescription>
                        Pastikan semua juri telah menyelesaikan penilaian sebelum menekan tombol "Selesaikan Pertandingan". Tindakan ini akan menyimpan hasil secara permanen.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleFinishMatch} disabled={isFinishing} className="w-full mt-4" size="lg">
                    {isFinishing ? 'Menyimpan & Menghitung...' : 'Selesaikan Pertandingan & Simpan Hasil'}
                </Button>
            </div>
          )}
          {match.status === 'finished' && (
            <div className='mt-6 text-center'>
                <h2 className='font-headline text-2xl'>Pertandingan Selesai</h2>
                <p className='text-5xl font-bold text-primary my-2'>{match.finalScore?.toFixed(2)}</p>
                <p className='text-muted-foreground'>Skor akhir telah dikalkulasi dan disimpan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
