"use client";

import { useState, useEffect } from 'react';
import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Timer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
    size?: 'small' | 'large';
}

export function TimerDisplay({ size = 'large' }: TimerDisplayProps) {
    const { data: timerState } = useFirestoreDocument<Timer>('timer', 'state');
    const [timeLeft, setTimeLeft] = useState(timerState?.duration || 180);

    useEffect(() => {
        if (timerState) {
            if (timerState.isRunning && timerState.startTime) {
                const updateTimer = () => {
                    const now = Date.now();
                    const elapsed = Math.floor((now - timerState.startTime!) / 1000);
                    const remaining = timerState.duration - elapsed;
                    setTimeLeft(remaining > 0 ? remaining : 0);
                };
                updateTimer();
                const interval = setInterval(updateTimer, 1000);
                return () => clearInterval(interval);
            } else {
                setTimeLeft(timerState.duration);
            }
        }
    }, [timerState]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const timerClass = cn(
        "font-mono font-bold text-primary",
        {
            "text-7xl md:text-9xl": size === 'large',
            "text-6xl": size === 'small',
        }
    );

    return (
        <div className={timerClass}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
}
