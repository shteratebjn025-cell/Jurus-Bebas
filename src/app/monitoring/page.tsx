"use client";

import { useState } from 'react';
import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Match } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { calculateMedian } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Loading from '../loading';
import { SilatScorerLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const TOTAL_JURUS = 59;

export default function MonitoringPage() {
  const { data: match, loading } = useFirestoreDocument<Match>('match', 'current');
  const [isFinishing, setIsFinishing] = useState(false);
  const { toast } = useToast();

  const handleFinishMatch = async () => {
    if (!match) return;
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
    for (let i = 1; i <= TOTAL_JURUS; i++) {
        const jurusKey = `jurus_${i}`;
        const jurusScores = judges.map(juriId => match.scores[juriId]?.[jurusKey]).filter(s => s !== undefined) as number[];
        medianScores[jurusKey] = calculateMedian(jurusScores);
    }

    // Calculate median for stamina
    const staminaScores = judges.map(juriId => match.scores[juriId]?.stamina).filter(s => s !== undefined) as number[];
    medianScores['stamina'] = calculateMedian(staminaScores);

    const totalJurusScore = Object.values(medianScores).reduce((sum, score) => sum + (score || 0), 0) - (medianScores['stamina'] || 0);
    const finalScore = 39 + totalJurusScore + (medianScores['stamina'] || 0);

    // Calculate total score for each judge
    judges.forEach(juriId => {
        const scores = match.scores[juriId];
        if (scores) {
            let total = 0;
            for (let i = 1; i <= TOTAL_JURUS; i++) {
                total += scores[`jurus_${i}`] || 0;
            }
            total += scores.stamina || 0;
            judgesTotals.push({ judgeId: juriId, total: 39 + total });
        }
    });

    try {
        const matchRef = doc(db, "match", "current");
        await updateDoc(matchRef, {
            status: 'finished',
            finalScore: parseFloat(finalScore.toFixed(2)),
            medianScores,
            judgesTotals,
        });
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
                    {Array.from({ length: TOTAL_JURUS }, (_, i) => i + 1).map(jurusNum => (
                        <TableRow key={jurusNum}>
                            <TableCell>Jurus {jurusNum}</TableCell>
                            {judges.map(juriId => (
                                <TableCell key={juriId} className="text-center font-mono">
                                    {match.scores?.[juriId]?.[`jurus_${jurusNum}`] ?? '-'}
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
                        Pastikan semua juri telah menyelesaikan penilaian sebelum menekan tombol "Selesaikan Pertandingan". Tindakan ini tidak dapat diurungkan.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleFinishMatch} disabled={isFinishing} className="w-full mt-4" size="lg">
                    {isFinishing ? 'Menghitung...' : 'Selesaikan Pertandingan'}
                </Button>
            </div>
          )}
          {match.status === 'finished' && (
            <div className='mt-6 text-center'>
                <h2 className='font-headline text-2xl'>Pertandingan Selesai</h2>
                <p className='text-5xl font-bold text-primary my-2'>{match.finalScore?.toFixed(2)}</p>
                <p className='text-muted-foreground'>Skor akhir telah dikalkulasi.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
