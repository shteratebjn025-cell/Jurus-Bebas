"use client";

import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Match, Participant } from '@/lib/types';
import Loading from '../loading';
import { SilatScorerLogo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const JURUS_NAMES = [
  "1.A", "1.B", "2.A", "2.B", "3.A", "3.B", "4.A", "4.B", "4.C", "4.D", 
  "5", "6", "7.A", "7.B", "8.A", "8.B", "8.C", "9", "10.A", "10.B",
  "11.A", "11.B", "12", "13", "14.A", "14.B", "15", "16.A1", "16.A2", "16.B",
  "17.A", "17.B", "18.A", "18.B", "19.A", "19.B", "20.A", "20.B", "21", "22",
  "23.A", "23.B", "24.A", "24.B", "25.A", "25.B", "26", "27.A1", "27.A2", 
  "27.A3", "27.B", "28", "29.A", "29.B", "30", "31", "32", "33", "34", "35"
];

export default function MonitoringPage() {
  const { data: match, loading } = useFirestoreDocument<Match>('match', 'current');

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
          {match.status === 'finished' && (
            <div className='mt-6 text-center'>
                <h2 className='font-headline text-2xl'>Pertandingan Selesai</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                    <div>
                        <p className="text-sm text-muted-foreground">SKOR AKHIR</p>
                        <p className='text-5xl font-bold text-primary'>{match.finalScore?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">STANDAR DEVIASI</p>
                        <p className='text-5xl font-bold text-primary'>{match.deviation?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">WAKTU SELESAI</p>
                        <p className='text-3xl font-bold text-primary'>{match.createdAt ? format(match.createdAt.toDate(), 'HH:mm:ss') : '-'}</p>
                    </div>
                </div>
                <p className='text-muted-foreground'>Skor akhir telah dikalkulasi dan disimpan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
