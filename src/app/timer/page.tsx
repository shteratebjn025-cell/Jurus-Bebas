"use client";

import { useState, useEffect } from "react";
import { useFirestoreDocument } from "@/lib/hooks/use-firestore";
import type { Timer } from "@/lib/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RefreshCw, TimerIcon } from "lucide-react";

export default function TimerPage() {
    const { data: timerState, loading } = useFirestoreDocument<Timer>('timer', 'state');
    const [durationInput, setDurationInput] = useState(180);
    const { toast } = useToast();

    useEffect(() => {
        if (timerState) {
            setDurationInput(timerState.duration);
        }
    }, [timerState]);

    const handleSet = async () => {
        try {
            await updateDoc(doc(db, "timer", "state"), { duration: durationInput, isRunning: false });
            toast({ title: "Waktu Diatur", description: `Timer diatur ke ${durationInput} detik.` });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive", description: "Gagal mengatur waktu." });
        }
    };

    const handleStart = async () => {
        try {
            await updateDoc(doc(db, "timer", "state"), { isRunning: true, startTime: Date.now() });
            toast({ title: "Timer Dimulai" });
        } catch (error) {
            // If doc doesn't exist, create it.
            if ((error as any).code === 'not-found') {
                 await setDoc(doc(db, "timer", "state"), { isRunning: true, startTime: Date.now(), duration: durationInput });
                 toast({ title: "Timer Dimulai" });
            } else {
                console.error(error);
                toast({ title: "Error", variant: "destructive", description: "Gagal memulai timer." });
            }
        }
    };

    const handleStop = async () => {
        try {
            // To stop, we calculate remaining time and set it as the new duration
            if (timerState && timerState.isRunning && timerState.startTime) {
                const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
                const newDuration = timerState.duration - elapsed;
                await updateDoc(doc(db, "timer", "state"), { isRunning: false, duration: newDuration > 0 ? newDuration : 0 });
            } else {
                await updateDoc(doc(db, "timer", "state"), { isRunning: false });
            }
            toast({ title: "Timer Dihentikan" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive", description: "Gagal menghentikan timer." });
        }
    };
    
    const handleReset = async () => {
        try {
            await updateDoc(doc(db, "timer", "state"), { isRunning: false, duration: durationInput });
            toast({ title: "Timer Direset" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive", description: "Gagal mereset timer." });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <TimerIcon className="h-8 w-8 text-primary" />
                        <CardTitle className="font-headline text-3xl">Kontrol Waktu</CardTitle>
                    </div>
                    <CardDescription>Atur, mulai, dan hentikan waktu pertandingan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Durasi (detik)</Label>
                        <Input 
                            id="duration" 
                            type="number" 
                            value={durationInput} 
                            onChange={(e) => setDurationInput(parseInt(e.target.value))}
                        />
                         <Button onClick={handleSet} variant="outline" className="w-full">Atur Durasi</Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <Button 
                            onClick={handleStart} 
                            disabled={loading || timerState?.isRunning} 
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play className="mr-2 h-4 w-4" /> Start
                        </Button>
                        <Button 
                            onClick={handleStop}
                            disabled={loading || !timerState?.isRunning}
                            variant="destructive"
                        >
                            <Pause className="mr-2 h-4 w-4" /> Stop
                        </Button>
                        <Button 
                            onClick={handleReset}
                            disabled={loading}
                            variant="secondary"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
