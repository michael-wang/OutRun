export interface RacingStage {
  id: 'coast' | 'city' | 'canyon';
  name: string;
  english: string;
  preview: 'coast' | 'city' | 'canyon';
  loading?: { landscape: string; portrait: string };
  enter?: () => Promise<unknown>;
}

export const stages: readonly RacingStage[] = [
  { id: 'coast', name: '海濱公路', english: 'Coast Highway', preview: 'coast',
    loading: { landscape: 'ui/start-landscape.png', portrait: 'ui/start-portrait.png' },
    enter: () => import('./main') },
  { id: 'city', name: '城市', english: 'City Circuit', preview: 'city' },
  { id: 'canyon', name: '大峽谷', english: 'Grand Canyon', preview: 'canyon' },
];
