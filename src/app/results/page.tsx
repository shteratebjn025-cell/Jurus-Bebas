"use client";

import Link from "next/link";
import { useFirestoreCollection } from "@/lib/hooks/use-firestore";
import type { Result } from "@/lib/types";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, writeBatch, collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Loading from "@/app/loading";
import { Trophy, Trash2 } from "lucide-react";

export default function ResultsPage() {
    const { data: results, loading } = useFirestoreCollection<Result>('results');
    const { toast } = useToast();

    if (loading) {
        return <Loading />;
    }

    const handleDeleteResult = async (resultId: string) => {
        try {
            await deleteDoc(doc(db, 'results', resultId));
            toast({ title: "Sukses", description: "Data hasil berhasil dihapus." });
        } catch (error) {
            console.error("Error deleting document: ", error);
            toast({ title: "Error", description: "Gagal menghapus data hasil.", variant: "destructive" });
        }
      };

    const handleDeleteAllResults = async () => {
        if (!results || results.length === 0) {
            toast({ title: "Info", description: "Tidak ada data hasil untuk dihapus." });
            return;
        }
        
        try {
            const batch = writeBatch(db);
            const resultsCollection = collection(db, "results");
            const resultsSnapshot = await getDocs(resultsCollection);
            resultsSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            toast({ title: "Sukses", description: "Semua data hasil pertandingan telah dihapus." });
        } catch (error) {
            console.error("Error deleting all results: ", error);
            toast({ title: "Error", description: "Gagal menghapus semua hasil.", variant: "destructive" });
        }
    };

    const sortedResults = results.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

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
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Riwayat Skor</CardTitle>
                            <CardDescription>Daftar semua pertandingan yang telah selesai dinilai.</CardDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Hapus Semua Hasil</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus **semua** data hasil pertandingan secara permanen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAllResults} className='bg-destructive hover:bg-destructive/90'>Ya, Hapus Semua</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
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
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedResults.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">Belum ada hasil pertandingan.</TableCell>
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
                                        <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data hasil pertandingan ini secara permanen.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteResult(result.id as string)} className='bg-destructive hover:bg-destructive/90'>Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
