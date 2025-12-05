"use client";

import { useState, useEffect, useRef } from 'react';
import { useFirestoreDocument } from '@/lib/hooks/use-firestore';
import type { Timer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
    size?: 'small' | 'large';
}

export function TimerDisplay({ size = 'large' }: TimerDisplayProps) {
    const { data: timerState } = useFirestoreDocument<Timer>('timer', 'state');
    const [timeLeft, setTimeLeft] = useState(timerState?.duration || 180);
    const animationFrameId = useRef<number>();

    useEffect(() => {
        if (timerState?.isRunning && timerState.startTime) {
            const startTime = timerState.startTime;
            const duration = timerState.duration;

            const updateTimer = () => {
                const now = Date.now();
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = duration - elapsed;
                
                setTimeLeft(remaining > 0 ? remaining : 0);

                if (remaining > 0) {
                    animationFrameId.current = requestAnimationFrame(updateTimer);
                }
            };

            animationFrameId.current = requestAnimationFrame(updateTimer);
            
            return () => {
                if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                }
            };
        } else if (timerState) {
            setTimeLeft(timerState.duration);
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
