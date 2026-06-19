export const MEDIA_COLLECTION_ENUM = {
  default: 'default',
  hero: 'hero',
  gallery: 'gallery',
  boardMembers: 'board-members',
  projects: 'projects',
} as const

export type MediaCollection = (typeof MEDIA_COLLECTION_ENUM)[keyof typeof MEDIA_COLLECTION_ENUM]

export const MEDIA_NAME_ENUM = {
  image: 'image',
  cover: 'cover',
  banner: 'banner',
  thumbnail: 'thumbnail',
  photo: 'photo',
  projectMapAsset: 'project-map-asset',
} as const

export type MediaName = (typeof MEDIA_NAME_ENUM)[keyof typeof MEDIA_NAME_ENUM]

export const MEDIA_COLLECTION_OPTIONS: Array<{ value: MediaCollection; label: string }> = [
  { value: MEDIA_COLLECTION_ENUM.default, label: 'Default' },
  { value: MEDIA_COLLECTION_ENUM.hero, label: 'Hero' },
  { value: MEDIA_COLLECTION_ENUM.gallery, label: 'Gallery' },
  { value: MEDIA_COLLECTION_ENUM.boardMembers, label: 'Board Members' },
  { value: MEDIA_COLLECTION_ENUM.projects, label: 'Projects' },
]

export const MEDIA_NAME_OPTIONS: Array<{ value: MediaName; label: string }> = [
  { value: MEDIA_NAME_ENUM.image, label: 'Image' },
  { value: MEDIA_NAME_ENUM.cover, label: 'Cover' },
  { value: MEDIA_NAME_ENUM.banner, label: 'Banner' },
  { value: MEDIA_NAME_ENUM.thumbnail, label: 'Thumbnail' },
  { value: MEDIA_NAME_ENUM.photo, label: 'Photo' },
  { value: MEDIA_NAME_ENUM.projectMapAsset, label: 'Project Map Asset' },
]
