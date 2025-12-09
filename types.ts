export interface SolutionStep {
  title: string;
  content: string;
}

export interface Solution {
  subject: string;
  problemStatement: string;
  steps: string; // Markdown content
  finalAnswer: string;
}

export interface AdConfig {
  publisherId: string;
  slots: {
    sidebar: string;
    content: string;
    bottom: string;
  };
}

export type PageRoute = 'home' | 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer';

export enum SolveStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SOLVING = 'SOLVING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
