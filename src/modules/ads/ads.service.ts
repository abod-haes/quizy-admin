import type { PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  attachContentResourceToEntity,
  deleteContentResource,
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
type AdUpdatePayload = {
  title: string | null
  description: string | null
  imageId: string
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
    let imageId = ad.imageId
    let replacementImage: ContentResource | null = null
    const previousImageId = ad.imageId

    if (imageFile) {
      replacementImage = await uploadContentResource({ entityId: ad.id, file: imageFile })
      image = replacementImage
      imageId = replacementImage.id
    }

    if (!imageId) throw new Error('Ad image is required')

    try {
      const updated = await api.put<AdminAd, AdUpdatePayload>(
        API_ENDPOINTS.ads.update(ad.id),
        {
          title: payload.title ?? null,
          description: payload.description ?? null,
          imageId,
        },
      )

      if (replacementImage && previousImageId && previousImageId !== replacementImage.id) {
        await deleteContentResource(previousImageId).catch(() => undefined)
      }

      return {
        ...updated,
        image,
      }
    } catch (error) {
      if (replacementImage) {
        await deleteContentResource(replacementImage.id).catch(() => undefined)
      }
      throw error
    }
  },

  async remove(ad: AdminAd) {
    await api.delete<{ message: string }>(API_ENDPOINTS.ads.remove(ad.id))
    if (ad.imageId) {
      await deleteContentResource(ad.imageId).catch(() => undefined)
    }
  },
}
