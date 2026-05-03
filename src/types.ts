export type BodyWeightState = 'light' | 'normal' | 'heavy' | 'very_heavy' | 'very_light';
export type RhythmState = 'none' | 'weak' | 'normal' | 'strong' | 'yes';
export type WalkState = 'none' | '10min' | '20min' | 'over_30min';
export type MuscleState = 'none' | 'done';
export type BodyCheckState = 'none' | 'done';
export type SleepState = 'not_enough' | 'adequate' | 'too_much';

export type BodyStateRecord = {
  id: string;
  date: string;
  weight: BodyWeightState | null;
  rhythm: RhythmState | null;
  walk: WalkState | null;
  muscle: MuscleState | null;
  bodyCheck: BodyCheckState | null;
  sleep: SleepState | null;
  memo: string;
  imageUrl?: string;
  moodEmoji?: string | null;
};

export type ItemType = 'expense' | 'wish';
export type WishNecessity = 'essential' | 'thinking' | 'unnecessary';

export type WishlistItem = {
  id: string;
  date: string;
  name: string;
  imageUrl: string;
  type: ItemType;
  status: 'wish' | 'bought';
  necessity: WishNecessity;
  price: string;
  linkUrl?: string;
};

export type AILogItem = {
  id: string;
  date: string;
  toolName: string;
  usage: string;
  feedback: string;
};

export type FocusItem = {
  id: string;
  date: string;
  goal: string;
};

export type FocusReflection = {
  id: string;
  content: string;
};

export type MemoItem = {
  id: string;
  date: string;
  title: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string; // Stored as base64 or blob URL temporarily (though blob URLs don't persist)
};
