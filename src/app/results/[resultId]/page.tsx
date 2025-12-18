"use client";

import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Result } from '@/lib/types';
import Loading from '@/app/loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Timer } from 'lucide-react';
import { useParams } from 'next/navigation';

function formatTime(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '00:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function ResultDetailPage() {
    const params = useParams();
    const resultId = params.resultId as string;
    const { data: result, loading } = useFirestoreDocument<Result>('results', resultId);
    
    if (loading) {
        return <Loading />;
    }

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background p-4">
                <h1 className="font-headline text-5xl mb-4">Hasil Tidak Ditemukan</h1>
                <p className="text-muted-foreground text-2xl">Data untuk pertandingan ini tidak dapat ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
             <Card className="w-full max-w-4xl text-center shadow-2xl">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Trophy className="h-24 w-24 text-accent" />
                    </div>
                    <CardTitle className="font-headline text-5xl">Hasil Akhir</CardTitle>
                    <CardDescription className="text-lg">{result.participantName} - {result.participantContingent}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-lg text-muted-foreground">SKOR TOTAL</p>
                            <p className="text-8xl font-bold text-primary">{result.finalScore?.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-lg text-muted-foreground">STANDAR DEVIASI</p>
                            <p className="text-8xl font-bold text-primary">{result.deviation?.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-lg text-muted-foreground">WAKTU PENAMPILAN</p>
                            <div className="flex items-center justify-center gap-2">
                                <Timer className="h-16 w-16 text-primary" />
                                <p className="text-8xl font-bold text-primary">{formatTime(result.timeUsedInSeconds)}</p>
                            </div>
                        </div>
                    </div>

                    {result.judgesTotals && (
                        <div>
                            <h3 className='font-headline text-2xl mb-2'>Rincian Skor Juri</h3>
                            <div className='flex justify-center gap-4 flex-wrap'>
                                {result.judgesTotals.map(({judgeId, total}) => (
                                    <div key={judgeId} className='p-3 border rounded-md min-w-[100px]'>
                                        <p className='font-bold text-sm'>{judgeId.replace('juri', 'Juri ')}</p>
                                        <p className='font-mono text-2xl'>{total.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
