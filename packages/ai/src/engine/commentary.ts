import { MatchEvent, MatchState, CommentaryEntry } from './types';

export class CommentaryEngine {
  static generateCommentary(event: MatchEvent, state: MatchState): CommentaryEntry {
    let text = event.detail;

    switch (event.eventType) {
      case 'Kickoff':
        text = `The match begins! ${state.homeTeam} vs ${state.awayTeam}. A thrilling contest awaits.`;
        break;
      case 'Goal':
        text = `${event.player} scores from inside the box! The stadium erupts. Current Score: ${state.score.home} - ${state.score.away}.`;
        break;
      case 'YellowCard':
        text = `Tactical booking! ${event.player} goes into the referee's notebook.`;
        break;
      case 'RedCard':
        text = `Drama! ${event.player} receives a red card and is sent off!`;
        break;
      case 'Substitution':
        text = `${state.awayTeam} look dangerous after the substitution of ${event.player}.`;
        break;
      case 'VAR':
        text = `VAR review is underway. High tension as the referee consults the video assistant screen.`;
        break;
      case 'Penalty':
        text = `Penalty awarded! A huge moment in the match.`;
        break;
      case 'HalfTime':
        text = `Half time whistle blows. Score stands at ${state.score.home}-${state.score.away}.`;
        break;
      case 'FullTime':
        text = `Full time! The whistle blows. Final score: ${state.homeTeam} ${state.score.home} - ${state.score.away} ${state.awayTeam}.`;
        break;
      case 'Corner':
        text = `Corner kick for ${event.team === 'Home' ? state.homeTeam : state.awayTeam}. Pressure builds.`;
        break;
      case 'Foul':
        text = `Free kick awarded after a foul in the middle of the park.`;
        break;
      default:
        break;
    }

    // Add extra context if possession is highly one sided
    if (state.statistics.possessionHome > 54 && event.eventType === 'Foul') {
      text += ` ${state.homeTeam} have dominated possession.`;
    }

    return {
      id: `comm-${event.id}`,
      minute: event.minute,
      text,
      eventId: event.id,
    };
  }
}
