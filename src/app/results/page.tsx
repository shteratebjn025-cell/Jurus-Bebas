"use client";

import Link from "next/link";
import { useFirestoreCollection } from "@/lib/hooks/use-firestore";
import type { Result } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loading from "@/app/loading";
import { Trophy } from "lucide-react";

export default function ResultsPage() {
    const { data: results, loading } = useFirestoreCollection<Result>('results');

    if (loading) {
        return <Loading />;
    }

    const sortedResults = results.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Trophy className="h-12 w-12 text-primary" />
                <h1 className="font-headline text-4xl md:text-5xl font-bold">
                    Hasil Pertandingan
                </h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Skor</CardTitle>
                    <CardDescription>Daftar semua pertandingan yang telah selesai dinilai.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Peserta</TableHead>
                                <TableHead>Kontingen</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">Skor Akhir</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedResults.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Belum ada hasil pertandingan.</TableCell>
                                </TableRow>
                            ) : (
                                sortedResults.map((result) => (
                                    <TableRow key={result.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/results/${result.id}`} className="hover:underline text-primary">
                                                {result.participantName}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{result.participantContingent}</TableCell>
                                        <TableCell>{result.ageCategory}</TableCell>
                                        <TableCell className="text-right font-mono">{result.finalScore.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">Selesai</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
