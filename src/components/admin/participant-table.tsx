"use client";

import { useState } from 'react';
import { useFirestoreCollection } from '@/lib/hooks/use-firestore';
import type { Participant } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, writeBatch, doc, deleteDoc, getDocs } from 'firebase/firestore';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { PlusCircle, Upload, Download, Trash2 } from 'lucide-react';
  

export function ParticipantTable() {
  const { data: participants, loading, error } = useFirestoreCollection<Participant>('participants');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddParticipant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newParticipant = {
        name: formData.get('name') as string,
        contingent: formData.get('contingent') as string,
        gender: formData.get('gender') as 'Laki-laki' | 'Perempuan',
        ageCategory: formData.get('ageCategory') as 'Remaja' | 'Dewasa',
        matchNumber: parseInt(formData.get('matchNumber') as string),
    };

    if (!newParticipant.name || !newParticipant.contingent || !newParticipant.gender || !newParticipant.ageCategory || isNaN(newParticipant.matchNumber)) {
        toast({ title: "Error", description: "Semua field harus diisi dengan benar.", variant: "destructive" });
        return;
    }

    try {
        await addDoc(collection(db, 'participants'), newParticipant);
        toast({ title: "Sukses", description: "Peserta berhasil ditambahkan." });
        setIsDialogOpen(false);
    } catch (e) {
        console.error("Error adding document: ", e);
        toast({ title: "Error", description: "Gagal menambahkan peserta.", variant: "destructive" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;

        const lines = text.split('\n').slice(1); // Skip header row
        const batch = writeBatch(db);
        let participantsAdded = 0;

        lines.forEach(line => {
            const [name, contingent, gender, ageCategory, matchNumberStr] = line.split(',').map(s => s.trim());
            if (name && contingent && gender && ageCategory && matchNumberStr) {
                const docRef = doc(collection(db, 'participants'));
                batch.set(docRef, { 
                  name, 
                  contingent, 
                  gender: gender as 'Laki-laki' | 'Perempuan', 
                  ageCategory: ageCategory as 'Remaja' | 'Dewasa',
                  matchNumber: parseInt(matchNumberStr),
                });
                participantsAdded++;
            }
        });

        try {
            await batch.commit();
            toast({ title: "Upload Sukses", description: `${participantsAdded} peserta berhasil di-upload.` });
        } catch (error) {
            console.error("Error batch writing:", error);
            toast({ title: "Upload Gagal", description: "Terjadi kesalahan saat menyimpan data.", variant: "destructive" });
        }
    };
    reader.readAsText(file);
  };

  const handleDeleteParticipant = async (participantId: string) => {
    try {
        await deleteDoc(doc(db, 'participants', participantId));
        toast({ title: "Sukses", description: "Peserta berhasil dihapus." });
    } catch (error) {
        console.error("Error deleting document: ", error);
        toast({ title: "Error", description: "Gagal menghapus peserta.", variant: "destructive" });
    }
  };

  const handleDeleteAllParticipants = async () => {
    if (!participants || participants.length === 0) {
        toast({ title: "Info", description: "Tidak ada data peserta untuk dihapus." });
        return;
    }
    
    try {
        const batch = writeBatch(db);
        const participantsCollection = collection(db, "participants");
        const participantsSnapshot = await getDocs(participantsCollection);
        participantsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        toast({ title: "Sukses", description: "Semua data peserta telah dihapus." });
    } catch (error) {
        console.error("Error deleting all participants: ", error);
        toast({ title: "Error", description: "Gagal menghapus semua peserta.", variant: "destructive" });
    }
  };

  const sortedParticipants = participants ? [...participants].sort((a, b) => a.matchNumber - b.matchNumber) : [];

  return (
    <Card>
        <CardHeader>
            <CardTitle>Daftar Peserta</CardTitle>
            <CardDescription>Kelola data semua peserta pertandingan.</CardDescription>
            <div className="flex flex-wrap items-center gap-2 pt-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Tambah Peserta</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Peserta Baru</DialogTitle>
                            <DialogDescription>Isi detail di bawah ini untuk mendaftarkan peserta baru.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddParticipant} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div>
                                <Label htmlFor="contingent">Kontingen</Label>
                                <Input id="contingent" name="contingent" required />
                            </div>
                            <div>
                                <Label htmlFor="matchNumber">Nomor Partai</Label>
                                <Input id="matchNumber" name="matchNumber" type="number" required />
                            </div>
                            <div>
                                <Label htmlFor="gender">Jenis Kelamin</Label>
                                <Select name="gender" required>
                                    <SelectTrigger><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="ageCategory">Kategori Usia</Label>
                                <Select name="ageCategory" required>
                                    <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Remaja">Remaja</SelectItem>
                                        <SelectItem value="Dewasa">Dewasa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" asChild>
                    <Label htmlFor="csv-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Upload CSV</Label>
                </Button>
                <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                
                <a href="/template.csv" download>
                  <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Template</Button>
                </a>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Hapus Semua</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus **semua** data peserta secara permanen dari database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAllParticipants} className='bg-destructive hover:bg-destructive/90'>Ya, Hapus Semua</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableCaption>{loading ? "Memuat data peserta..." : "Daftar semua peserta terdaftar."}</TableCaption>
            <TableHeader>
                <TableRow>
                <TableHead>No. Partai</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kontingen</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Kategori Usia</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : error ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-destructive">Gagal memuat data.</TableCell></TableRow>
                ) : sortedParticipants.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Belum ada peserta.</TableCell></TableRow>
                ) : (
                    sortedParticipants.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.matchNumber || '-'}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.contingent}</TableCell>
                        <TableCell>{p.gender}</TableCell>
                        <TableCell>{p.ageCategory}</TableCell>
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
                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data peserta secara permanen.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteParticipant(p.id as string)} className='bg-destructive hover:bg-destructive/90'>Hapus</AlertDialogAction>
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
  );
}
