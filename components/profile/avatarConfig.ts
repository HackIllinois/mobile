import Character1AvatarSvg from '../../assets/profile/avatar-screen/avatars/character1.svg';
import Character2AvatarSvg from '../../assets/profile/avatar-screen/avatars/character2.svg';
import Character3AvatarSvg from '../../assets/profile/avatar-screen/avatars/character3.svg';
import Character4AvatarSvg from '../../assets/profile/avatar-screen/avatars/character4.svg';
import Character5AvatarSvg from '../../assets/profile/avatar-screen/avatars/character5.svg';

export interface AvatarDimensions {
  width: number;
  height: number;
}

export interface AvatarConfig {
  id: string;
  component: React.ComponentType<any>;
  profileDimensions: AvatarDimensions;  // Size on the main profile screen
  modalDimensions: AvatarDimensions;     // Size in the selection modal
  modalOffsetX?: number;                 // Horizontal offset to center avatar in modal
}

export const AVATARS: AvatarConfig[] = [
  {
    id: 'character1',
    component: Character1AvatarSvg,
    profileDimensions: { width: 140, height: 310 },
    modalDimensions: { width: 156, height: 300 },
    modalOffsetX: 5,
  },
  {
    id: 'character2',
    component: Character2AvatarSvg,
    profileDimensions: { width: 192, height: 310 },  // Wider for hair
    modalDimensions: { width: 156, height: 300 }, 
  },
  {
    id: 'character3',
    component: Character3AvatarSvg,
    profileDimensions: { width: 140, height: 310 },
    modalDimensions: { width: 156, height: 300 },
    modalOffsetX: 5,
  },
  {
    id: 'character4',
    component: Character4AvatarSvg,
    profileDimensions: { width: 140, height: 310 },
    modalDimensions: { width: 156, height: 300 },
  },
  {
    id: 'character5',
    component: Character5AvatarSvg,
    profileDimensions: { width: 140, height: 310 },
    modalDimensions: { width: 156, height: 300 },
  },
];

export const getAvatarById = (avatarId: string | null): AvatarConfig | undefined => {
  if (!avatarId) return undefined;
  return AVATARS.find(avatar => avatar.id === avatarId);
};

export const getCharacterIdFromUrl = (avatarUrl: string | null): string | null => {
  if (!avatarUrl) return null;

  const match = avatarUrl.match(/character(\d+)/i);
  if (match) {
    return `character${match[1]}`;
  }

  return null;
};
