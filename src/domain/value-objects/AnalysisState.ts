export type AnalysisState =
  | 'IDLE'
  | 'FETCHING_DOCUMENTATION'
  | 'ANALYZING_DOCUMENTATION'
  | 'CHECKING_FUNDING_SIGNAL'
  | 'FETCHING_FUNDING'
  | 'ANALYZING_FUNDING'
  | 'FETCHING_MARKET_DATA'
  | 'ANALYZING_MARKET'
  | 'FETCHING_TEAM_DATA'
  | 'ANALYZING_TEAM'
  | 'FETCHING_CODE'
  | 'ANALYZING_CODE'
  | 'GENERATING_RATING'
  | 'FORMATTING_OUTPUT'
  | 'COMPLETED'
  | 'FAILED'
  | 'NO_FUNDING';

export interface AnalysisStateTransition {
  from: AnalysisState;
  to: AnalysisState;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AnalysisProgress {
  currentState: AnalysisState;
  stateHistory: AnalysisStateTransition[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export function createInitialProgress(): AnalysisProgress {
  return {
    currentState: 'IDLE',
    stateHistory: [],
    startedAt: new Date(),
  };
}

export function transitionState(
  progress: AnalysisProgress,
  newState: AnalysisState,
  metadata?: Record<string, unknown>
): AnalysisProgress {
  const transition: AnalysisStateTransition = {
    from: progress.currentState,
    to: newState,
    timestamp: new Date(),
    metadata,
  };

  return {
    ...progress,
    currentState: newState,
    stateHistory: [...progress.stateHistory, transition],
    completedAt: newState === 'COMPLETED' || newState === 'FAILED' ? new Date() : undefined,
  };
}
