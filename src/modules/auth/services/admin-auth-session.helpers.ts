import type { AuthUser } from '@/app/auth/auth-user.type'
import type { AdminLoginUser } from '@/modules/auth/services/login.services'

export const ADMIN_DEVICE_NAME = 'dashboard-web'

export function toAuthUser(user: AdminLoginUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: null,
    profilePhotoPath: null,
    profilePhotoUrl: null,
    isActive: user.is_active,
  }
}
