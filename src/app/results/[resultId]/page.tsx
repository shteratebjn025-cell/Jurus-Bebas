"use client";

import { useState } from 'react';
import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Result } from '@/lib/types';
import Loading from '@/app/loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trophy, Timer, Eye } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const JURUS_NAMES = [
    "1.A", "1.B", "2.A", "2.B", "3.A", "3.B", "4.A", "4.B", "4.C", "4.D", 
    "5", "6", "7.A", "7.B", "8.A", "8.B", "8.C", "9", "10.A", "10.B",
    "11.A", "11.B", "12", "13", "14.A", "14.B", "15", "16.A1", "16.A2", "16.B",
    "17.A", "17.B", "18.A", "18.B", "19.A", "19.B", "20.A", "20.B", "21", "22",
    "23.A", "23.B", "24.A", "24.B", "25.A", "25.B", "26", "27.A1", "27.A2", 
    "27.A3", "27.B", "28", "29.A", "29.B", "30", "31", "32", "33", "34", "35"
];

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
    const [showDetails, setShowDetails] = useState(false);
    
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

    const judges = result.scores ? Object.keys(result.scores) : [];

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
                <CardFooter className="flex-col gap-4">
                    <Button onClick={() => setShowDetails(!showDetails)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {showDetails ? 'Sembunyikan Rincian' : 'Tampilkan Rincian Nilai'}
                    </Button>
                    
                    {showDetails && (
                         <div className='overflow-x-auto w-full mt-4 border rounded-lg'>
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
                                                 {result.scores?.[juriId]?.[`jurus_${index + 1}`] ?? '-'}
                                             </TableCell>
                                         ))}
                                     </TableRow>
                                 ))}
                                 <TableRow className="bg-muted font-bold">
                                     <TableCell>Stamina</TableCell>
                                     {judges.map(juriId => (
                                         <TableCell key={juriId} className="text-center font-mono">
                                             {result.scores?.[juriId]?.stamina ?? '-'}
                                         </TableCell>
                                     ))}
                                 </TableRow>
                                 <TableRow className="bg-muted/50 font-bold">
                                     <TableCell>Status Selesai</TableCell>
                                     {judges.map(juriId => (
                                         <TableCell key={juriId} className="text-center font-mono text-xs">
                                             {result.scores?.[juriId]?.finished ? '✅' : '❌'}
                                         </TableCell>
                                     ))}
                                 </TableRow>
                             </TableBody>
                         </Table>
                       </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
