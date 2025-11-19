import type { Achievement } from '../types.ts';

export const ALL_ACHIEVEMENTS: Achievement[] = [
    { id: 'ach1', name: 'First Service', description: 'Serve in your first event.', icon: 'star' },
    { id: 'ach2', name: 'Five Services', description: 'Serve in 5 different events.', icon: 'trophy' },
    { id: 'ach3', name: 'Audio Novice', description: 'Serve in an audio role.', icon: 'sound' },
    { id: 'ach4', name: 'Camera Novice', description: 'Serve in a camera operator role.', icon: 'camera' },
    { id: 'ach5', name: 'Video Director', description: 'Serve as a Video Director.', icon: 'video' },
    { id: 'ach6', name: 'ProPresenter', description: 'Serve as a ProPresenter operator.', icon: 'presentation' },
];