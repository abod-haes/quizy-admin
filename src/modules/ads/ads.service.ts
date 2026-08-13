import type { PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  deleteContentResource,
  updateContentResourceFile,
  uploadContentResource,
  type ContentResource,
} from '@/modules/content-crud/services/content-resource.services'

export type AdminAd = {
  id: string
  title: string
  description: string | null
  imageId: string | null
  image?: ContentResource | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type AdInput = {
  title: string
  description?: string | null
}

async function loadImage(imageId: string | null | undefined) {
  if (!imageId) return null
  try {
    return await api.get<ContentResource>(API_ENDPOINTS.resources.detail(imageId))
  } catch {
    return null
  }
}

export const adsService = {
  async list(page: number, perPage: number): Promise<PagedResponse<AdminAd>> {
    const response = await api.get<PagedResponse<AdminAd>>(API_ENDPOINTS.ads.list, {
      params: { page, perPage },
    })
    const items = await Promise.all(
      response.items.map(async (ad) => ({ ...ad, image: await loadImage(ad.imageId) })),
    )
    return { ...response, items }
  },

  async create(payload: AdInput, imageFile?: File | null): Promise<AdminAd> {
    const ad = await api.post<AdminAd, AdInput>(API_ENDPOINTS.ads.create, payload)
    if (!imageFile) return ad

    const image = await uploadContentResource({ entityId: ad.id, file: imageFile })
    const updated = await api.patch<AdminAd, { imageId: string }>(
      API_ENDPOINTS.ads.update(ad.id),
      { imageId: image.id },
    )
    return { ...updated, image }
  },

  async update(ad: AdminAd, payload: AdInput, imageFile?: File | null): Promise<AdminAd> {
    let image = ad.image ?? null
    let imageId = ad.imageId

    if (imageFile) {
      if (ad.imageId) {
        image = await updateContentResourceFile({
          id: ad.imageId,
          entityId: ad.id,
          file: imageFile,
        })
        imageId = image.id
      } else {
        image = await uploadContentResource({ entityId: ad.id, file: imageFile })
        imageId = image.id
      }
    }

    const updated = await api.patch<AdminAd, AdInput & { imageId?: string | null }>(
      API_ENDPOINTS.ads.update(ad.id),
      { ...payload, ...(imageId ? { imageId } : {}) },
    )
    return { ...updated, image }
  },

  async remove(ad: AdminAd) {
    await api.delete<{ message: string }>(API_ENDPOINTS.ads.remove(ad.id))
    if (ad.imageId) {
      await deleteContentResource(ad.imageId).catch(() => undefined)
    }
  },
}
