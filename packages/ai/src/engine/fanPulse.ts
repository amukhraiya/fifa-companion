export interface FanPulseState {
  sentiment: 'Excited' | 'Nervous' | 'Ecstatic' | 'Anxious' | 'Chanting';
  decibels: number;
  chantText: string;
  energyIndex: number;
}

export class FanPulseEngine {
  static getPulseForMinute(minute: number, score: string): FanPulseState {
    const min = Math.min(Math.max(minute, 0), 90);

    // Dynamic decibels and energy index depending on minute and score events
    let decibels = 82 + (min % 10);
    let energyIndex = 70 + (min % 20);
    let sentiment: FanPulseState['sentiment'] = 'Excited';
    let chantText = 'Vamos Brasil! Vamos Brasil!';

    if (score.includes('2 - 1') && min >= 82) {
      decibels = 118; // Ecstatic goal celebration
      energyIndex = 98;
      sentiment = 'Ecstatic';
      chantText = 'CAMPEAO! CAMPEAO! OLE OLE OLE!';
    } else if (score.includes('1 - 1') && min >= 74 && min < 82) {
      decibels = 94;
      energyIndex = 82;
      sentiment = 'Nervous';
      chantText = 'A por ellos, oe! A por ellos, oe!';
    } else if (min >= 88) {
      decibels = 104; // red card card calling
      energyIndex = 90;
      sentiment = 'Anxious';
      chantText = 'U-E-E-! U-E-E-!';
    } else {
      sentiment = 'Chanting';
      chantText = 'Brasil! Brasil! OLE OLE OLE!';
    }

    return {
      sentiment,
      decibels,
      chantText,
      energyIndex,
    };
  }
}
