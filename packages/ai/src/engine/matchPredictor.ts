export interface MatchPrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
}

export class MatchPredictorEngine {
  static getPrediction(minute: number, score: string): MatchPrediction {
    const min = Math.min(Math.max(minute, 0), 90);

    // Initial equal strength
    let homeWinProbability = 38;
    let awayWinProbability = 32;
    let drawProbability = 30;

    if (score.includes('2 - 1')) {
      // Brazil leading at late stage
      const timeFactor = (90 - min) / 90; // closes to 0
      homeWinProbability = Math.round(95 - timeFactor * 30);
      awayWinProbability = Math.round(2 + timeFactor * 10);
      drawProbability = 100 - (homeWinProbability + awayWinProbability);
    } else if (score.includes('1 - 1')) {
      // Draw state
      homeWinProbability = 30;
      awayWinProbability = 30;
      drawProbability = 40;
    } else if (score.includes('1 - 0')) {
      // Brazil leading early
      homeWinProbability = 65;
      awayWinProbability = 15;
      drawProbability = 20;
    }

    return {
      homeWinProbability,
      awayWinProbability,
      drawProbability,
    };
  }
}
