import type { PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  attachContentResourceToEntity,
  deleteContentResource,
  updateContentResourceFile,
  uploadContentResource,
  type ContentResource,
} from '@/modules/content-crud/services/content-resource.services'

export type AdminAd = {
  id: string
  title: string | null
  description: string | null
  imageId: string | null
  image?: ContentResource | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type AdInput = {
  title?: string | null
  description?: string | null
}

type AdCreatePayload = AdInput & { imageId: string }
type AdUpdatePayload = AdInput & { imageId?: string }

async function loadImage(imageId: string | null | undefined) {
  if (!imageId) return null
  try {
    return await api.get<ContentResource>(API_ENDPOINTS.resources.detail(imageId))
  } catch {
    return null
  }
}

export const adsService = {
  async list(page: number, perPage: number, search?: string): Promise<PagedResponse<AdminAd>> {
    const normalizedSearch = search?.trim()
    const response = await api.get<PagedResponse<AdminAd>>(API_ENDPOINTS.ads.list, {
      params: {
        page,
        perPage,
        ...(normalizedSearch ? { search: normalizedSearch } : {}),
      },
    })
    const items = await Promise.all(
      response.items.map(async (ad) => ({ ...ad, image: await loadImage(ad.imageId) })),
    )
    return { ...response, items }
  },

  async create(payload: AdInput, imageFile: File): Promise<AdminAd> {
    const image = await uploadContentResource({ entityId: null, file: imageFile })

    try {
      const ad = await api.post<AdminAd, AdCreatePayload>(API_ENDPOINTS.ads.create, {
        ...payload,
        imageId: image.id,
      })
      const attachedImage = await attachContentResourceToEntity(image.id, ad.id).catch(
        () => image,
      )
      return { ...ad, image: attachedImage }
    } catch (error) {
      await deleteContentResource(image.id).catch(() => undefined)
      throw error
    }
  },

  async update(ad: AdminAd, payload: AdInput, imageFile?: File | null): Promise<AdminAd> {
    let image = ad.image ?? null
    let changedImageId: string | undefined

    if (imageFile) {
      if (ad.imageId) {
        image = await updateContentResourceFile({
          id: ad.imageId,
          entityId: ad.id,
          file: imageFile,
        })
        changedImageId = image.id
      } else {
        image = await uploadContentResource({ entityId: ad.id, file: imageFile })
        changedImageId = image.id
      }
    }

    const updated = await api.patch<AdminAd, AdUpdatePayload>(
      API_ENDPOINTS.ads.update(ad.id),
      {
        ...payload,
        ...(changedImageId ? { imageId: changedImageId } : {}),
      },
    )

    return {
      ...updated,
      image: changedImageId ? image : ad.image,
    }
  },

  async remove(ad: AdminAd) {
    await api.delete<{ message: string }>(API_ENDPOINTS.ads.remove(ad.id))
    if (ad.imageId) {
      await deleteContentResource(ad.imageId).catch(() => undefined)
    }
  },
}
