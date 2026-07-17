export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'PAUSED';

export interface MatchStatistics {
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
}

export interface MomentumState {
  value: number; // -100 (Away pressure) to +100 (Home pressure)
  pressureHome: number;
  pressureAway: number;
  fanEnergy: number; // 0 to 100
}

export interface MatchState {
  minute: number;
  status: MatchStatus;
  homeTeam: string;
  awayTeam: string;
  score: {
    home: number;
    away: number;
  };
  statistics: MatchStatistics;
  momentum: MomentumState;
}

export type EventType =
  | 'Kickoff'
  | 'Goal'
  | 'Corner'
  | 'Foul'
  | 'YellowCard'
  | 'RedCard'
  | 'Substitution'
  | 'VAR'
  | 'Penalty'
  | 'HalfTime'
  | 'SecondHalf'
  | 'FullTime'
  | 'MinuteTick';

export interface MatchEvent {
  id: string;
  minute: number;
  eventType: EventType;
  team: 'Home' | 'Away' | 'Neutral';
  player?: string;
  detail: string;
}

export interface CommentaryEntry {
  id: string;
  minute: number;
  text: string;
  eventId?: string;
}
