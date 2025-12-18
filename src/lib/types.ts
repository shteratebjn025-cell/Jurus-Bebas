export interface Participant {
  id: string;
  name: string;
  contingent: string;
  gender: 'Laki-laki' | 'Perempuan';
  ageCategory: 'Remaja' | 'Dewasa';
  matchNumber: number;
}

export interface JurusScore {
  [jurusKey: string]: number;
}

export interface JudgeScore extends JurusScore {
  stamina: number;
  finished: boolean;
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
  deviation: number | null;
  judgesTotals: { judgeId: string; total: number }[] | null;
  medianScores: { [key: string]: number };
  createdAt?: any;
}

export interface Timer {
  id?: string;
  startTime: number | null; // Timestamp
  duration: number; // in seconds
  isRunning: boolean;
}

export interface Result {
    id?: string;
    participantId: string | null;
    participantName: string;
    participantContingent: string;
    ageCategory: 'Remaja' | 'Dewasa';
    finalScore: number;
    deviation: number;
    judgesTotals: { judgeId: string; total: number }[] | null;
    medianScores: { [key: string]: number };
    numberOfJudges: 4 | 6;
    scores: Scores;
    createdAt: any;
}
