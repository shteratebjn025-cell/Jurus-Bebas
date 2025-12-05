"use client";

import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Match } from '@/lib/types';
import Loading from '../loading';
import { SilatScorerLogo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { TimerDisplay } from '@/components/timer-display';


export default function DisplayPage() {
    const { data: match, loading } = useFirestoreDocument<Match>('match', 'current');
    
    if (loading) {
        return <Loading />;
    }

    if (!match || match.status === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background p-4">
                <SilatScorerLogo className="h-32 w-32 text-primary mb-6" />
                <h1 className="font-headline text-5xl mb-4">SilatScorer</h1>
                <p className="text-muted-foreground text-2xl">Papan Skor akan aktif saat pertandingan dimulai.</p>
            </div>
        );
    }
    
    if (match.status === 'finished') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                 <Card className="w-full max-w-4xl text-center shadow-2xl">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <Trophy className="h-24 w-24 text-accent" />
                        </div>
                        <CardTitle className="font-headline text-5xl">Hasil Akhir</CardTitle>
                        <CardDescription className="text-lg">{match.participantName} - {match.participantContingent}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="text-lg text-muted-foreground">SKOR TOTAL</p>
                            <p className="text-8xl font-bold text-primary">{match.finalScore?.toFixed(2)}</p>
                        </div>
                        {match.judgesTotals && (
                            <div>
                                <h3 className='font-headline text-2xl mb-2'>Rincian Skor Juri</h3>
                                <div className='flex justify-center gap-4 flex-wrap'>
                                    {match.judgesTotals.map(({judgeId, total}) => (
                                        <div key={judgeId} className='p-3 border rounded-md'>
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

    const judges = Array.from({ length: match.numberOfJudges }, (_, i) => `juri${i + 1}`);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col">
            <header className="text-center mb-8">
                <h1 className="font-headline text-4xl md:text-6xl">{match.participantName}</h1>
                <p className="text-muted-foreground text-xl md:text-2xl">{match.participantContingent}</p>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex items-center justify-center">
                    <TimerDisplay />
                </div>
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl">Papan Skor Langsung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {judges.map(juriId => (
                                    <div key={juriId} className="border rounded-lg p-4 text-center">
                                        <p className="font-bold text-lg">{juriId.replace('juri', 'Juri ')}</p>
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground">Jurus Terakhir</p>
                                            <p className="font-mono text-3xl font-bold">
                                                {Object.keys(match.scores?.[juriId] || {}).length > 0 ? Object.values(match.scores[juriId]).slice(-1)[0] : '-'}
                                            </p>
                                        </div>
                                         <div className="mt-2">
                                            <p className="text-xs text-muted-foreground">Total Jurus</p>
                                            <p className="font-mono text-lg">
                                                {Object.keys(match.scores?.[juriId] || {}).filter(k => k.startsWith('jurus')).length} / 59
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
