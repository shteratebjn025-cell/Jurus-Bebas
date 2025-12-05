export interface Participant {
  id: string;
  name: string;
  contingent: string;
  gender: 'Laki-laki' | 'Perempuan';
  ageCategory: 'Remaja' | 'Dewasa';
}

export interface JurusScore {
  [key: `jurus_${number}`]: number;
}

export interface JudgeScore extends JurusScore {
  stamina: number;
}

export interface Scores {
  [judgeId: string]: Partial<JudgeScore>;
}

export interface Match {
  participantId: string | null;
  participantName: string;
  participantContingent: string;
  numberOfJudges: 4 | 6;
  status: 'idle' | 'running' | 'finished';
  scores: Scores;
  finalScore: number | null;
  judgesTotals: { judgeId: string; total: number }[] | null;
  medianScores: { [key: string]: number };
}

export interface Timer {
  id?: string;
  startTime: number | null; // Timestamp
  duration: number; // in seconds
  isRunning: boolean;
}
