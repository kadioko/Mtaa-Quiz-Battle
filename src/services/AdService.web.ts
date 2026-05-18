export type AdRewardType = 'extra-life' | 'double-coins';

export interface AdReward {
  type: 'currency' | string;
  amount: number;
}

export function showRewardedAd(_type: AdRewardType): Promise<AdReward | null> {
  return Promise.resolve(null);
}

export function adsAvailable(): boolean {
  return false;
}
