export type AuthUser = {
  id: number | string
  name: string
  email: string
  role: string | null
  profilePhotoPath: string | null
  profilePhotoUrl: string | null
} & Record<string, unknown>
