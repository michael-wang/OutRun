import type {RaceCheckpoint} from './race-recovery';
export interface RacingStage {
  id: 'coast' | 'city' | 'canyon';
  name: string;
  english: string;
  preview: 'coast' | 'city' | 'canyon';
  loading?: { landscape: string; portrait: string };
  enter?: (onExit: () => void, recovery?: RaceCheckpoint) => Promise<void>;
}

export const stages: readonly RacingStage[] = [
  { id: 'coast', name: '海濱公路', english: 'Coast Highway', preview: 'coast',
    loading: { landscape: 'ui/start-landscape.png', portrait: 'ui/start-portrait.png' },
    enter: async (onExit,recovery) => (await import('./main')).enterCoast(onExit,recovery) },
  { id: 'city', name: '城際快線', english: 'City Expressway', preview: 'city',
    loading: {landscape: 'ui/city-loading.jpg', portrait: 'ui/city-loading.jpg'},
    enter: async onExit => (await import('./city/drive.mjs')).enterCity(onExit) },
  { id: 'canyon', name: '大峽谷', english: 'Grand Canyon', preview: 'canyon' },
];
