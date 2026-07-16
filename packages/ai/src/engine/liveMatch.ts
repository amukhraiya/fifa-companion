import { MatchState, MatchEvent} from './types';

export class LiveMatchEngine {
  private state: MatchState;
  private isTicking: boolean = false;

  constructor(homeTeam = 'Brazil', awayTeam = 'Spain') {
    this.state = this.initialState(homeTeam, awayTeam);
  }

  private initialState(homeTeam: string, awayTeam: string): MatchState {
    return {
      minute: 0,
      status: 'SCHEDULED',
      homeTeam,
      awayTeam,
      score: { home: 0, away: 0 },
      statistics: {
        possessionHome: 50,
        possessionAway: 50,
        shotsHome: 0,
        shotsAway: 0,
        shotsOnTargetHome: 0,
        shotsOnTargetAway: 0,
        cornersHome: 0,
        cornersAway: 0,
        foulsHome: 0,
        foulsAway: 0,
        yellowCardsHome: 0,
        yellowCardsAway: 0,
        redCardsHome: 0,
        redCardsAway: 0,
        expectedGoalsHome: 0,
        expectedGoalsAway: 0,
      },
      momentum: {
        value: 0,
        pressureHome: 10,
        pressureAway: 10,
        fanEnergy: 80,
      },
    };
  }

  public startMatch(): void {
    this.state.status = 'LIVE';
    this.isTicking = true;
    this.tickTo(1);
  }

  public pause(): void {
    if (this.state.status === 'LIVE') {
      this.state.status = 'PAUSED';
      this.isTicking = false;
    }
  }

  public resume(): void {
    if (this.state.status === 'PAUSED') {
      this.state.status = 'LIVE';
      this.isTicking = true;
    }
  }

  public tick(): MatchEvent | null {
    if (this.state.status !== 'LIVE') return null;

    if (this.state.minute >= 90) {
      this.state.status = 'FINISHED';
      this.isTicking = false;
      return this.generateEventForMinute(90);
    }

    const nextMin = this.state.minute + 1;
    return this.tickTo(nextMin);
  }

  public tickTo(targetMinute: number): MatchEvent | null {
    this.state.minute = targetMinute;
    this.updateStatsForMinute(targetMinute);

    if (targetMinute === 45) {
      this.state.status = 'HALFTIME';
      this.isTicking = false;
    } else if (targetMinute === 90) {
      this.state.status = 'FINISHED';
      this.isTicking = false;
    }

    return this.generateEventForMinute(targetMinute);
  }

  public getState(): MatchState {
    return { ...this.state };
  }

  public reset(): void {
    this.state = this.initialState(this.state.homeTeam, this.state.awayTeam);
    this.isTicking = false;
  }

  private updateStatsForMinute(min: number): void {
    // Expected Goals accumulation
    this.state.statistics.expectedGoalsHome = parseFloat((min * 0.021 + (min >= 82 ? 0.6 : 0)).toFixed(2));
    this.state.statistics.expectedGoalsAway = parseFloat((min * 0.016 + (min >= 74 ? 0.75 : 0)).toFixed(2));

    // Dynamic possession, shots, and corners simulation
    if (min >= 82) {
      this.state.score.home = 2;
      this.state.score.away = 1;
    } else if (min >= 74) {
      this.state.score.home = 1;
      this.state.score.away = 1;
    } else if (min >= 28) {
      this.state.score.home = 1;
      this.state.score.away = 0;
    }

    this.state.statistics.possessionHome = min >= 70 && min < 80 ? 45 : 55;
    this.state.statistics.possessionAway = 100 - this.state.statistics.possessionHome;

    this.state.statistics.shotsHome = Math.floor(min * 0.15);
    this.state.statistics.shotsAway = Math.floor(min * 0.12);
    this.state.statistics.shotsOnTargetHome = Math.floor(this.state.statistics.shotsHome * 0.4);
    this.state.statistics.shotsOnTargetAway = Math.floor(this.state.statistics.shotsAway * 0.35);

    this.state.statistics.cornersHome = Math.floor(min * 0.08);
    this.state.statistics.cornersAway = Math.floor(min * 0.06);

    this.state.statistics.foulsHome = Math.floor(min * 0.14);
    this.state.statistics.foulsAway = Math.floor(min * 0.16);

    this.state.statistics.yellowCardsHome = min >= 80 ? 1 : 0;
    this.state.statistics.yellowCardsAway = min >= 88 ? 2 : (min >= 12 ? 1 : 0);
    this.state.statistics.redCardsAway = min >= 88 ? 1 : 0;

    // Momentum shift calculations
    let val = 15;
    if (min >= 70 && min < 80) val = -45;
    else if (min >= 80) val = 60;

    this.state.momentum = {
      value: val,
      pressureHome: val > 0 ? val : 10,
      pressureAway: val < 0 ? Math.abs(val) : 10,
      fanEnergy: 70 + (min % 20) + (min >= 82 ? 18 : 0),
    };
  }

  private generateEventForMinute(min: number): MatchEvent | null {
    switch (min) {
      case 1:
        return {
          id: 'ev-1',
          minute: 1,
          eventType: 'Kickoff',
          team: 'Neutral',
          detail: 'Kickoff! Brazil vs Spain has commenced in the packed Arena.',
        };
      case 12:
        return {
          id: 'ev-12',
          minute: 12,
          eventType: 'YellowCard',
          team: 'Away',
          player: 'Rodri',
          detail: 'Yellow card for Rodri after a tactical foul stopping Neymar Jr.',
        };
      case 28:
        return {
          id: 'ev-28',
          minute: 28,
          eventType: 'Goal',
          team: 'Home',
          player: 'Neymar Jr',
          detail: 'GOAL! Neymar Jr fires Brazil into the lead with a stunning free kick!',
        };
      case 45:
        return {
          id: 'ev-45',
          minute: 45,
          eventType: 'HalfTime',
          team: 'Neutral',
          detail: 'Half Time! Players head to the tunnels with Brazil leading 1-0.',
        };
      case 46:
        return {
          id: 'ev-46',
          minute: 46,
          eventType: 'SecondHalf',
          team: 'Neutral',
          detail: 'Second Half kicked off. Can Spain turn things around?',
        };
      case 61:
        return {
          id: 'ev-61',
          minute: 61,
          eventType: 'Substitution',
          team: 'Away',
          player: 'Dani Olmo',
          detail: 'Substitution: Dani Olmo replaces Pedri in midfield.',
        };
      case 72:
        return {
          id: 'ev-72',
          minute: 72,
          eventType: 'VAR',
          team: 'Away',
          detail: 'VAR Review: Checking potential handball inside Brazil penalty box.',
        };
      case 74:
        return {
          id: 'ev-74',
          minute: 74,
          eventType: 'Goal',
          team: 'Away',
          player: 'Alvaro Morata',
          detail: 'GOAL! Alvaro Morata converts the penalty to make it 1-1!',
        };
      case 82:
        return {
          id: 'ev-82',
          minute: 82,
          eventType: 'Goal',
          team: 'Home',
          player: 'Vinicius Jr',
          detail: 'GOAL! Vinicius Jr scores a dramatic goal on the counter to make it 2-1!',
        };
      case 88:
        return {
          id: 'ev-88',
          minute: 88,
          eventType: 'RedCard',
          team: 'Away',
          player: 'Dani Carvajal',
          detail: 'Red Card! Dani Carvajal sent off after a second yellow.',
        };
      case 90:
        return {
          id: 'ev-90',
          minute: 90,
          eventType: 'FullTime',
          team: 'Neutral',
          detail: 'Full Time! Brazil emerges victorious with a 2-1 scoreline.',
        };
      default:
        // Regular tick with corner or foul mock
        if (min % 15 === 0) {
          return {
            id: `ev-${min}`,
            minute: min,
            eventType: 'Corner',
            team: min % 30 === 0 ? 'Home' : 'Away',
            detail: `Corner kick awarded to ${min % 30 === 0 ? 'Brazil' : 'Spain'}.`,
          };
        }
        if (min % 11 === 0) {
          return {
            id: `ev-${min}`,
            minute: min,
            eventType: 'Foul',
            team: 'Home',
            detail: 'Foul committed in the midfield area.',
          };
        }
        return null;
    }
  }
}
