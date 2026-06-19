import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { usePagesCrudMutations, usePagesById } from '@/modules/pages/hooks/use-pages-crud.hook'
import type { PagesCreatePayload } from '@/modules/pages/types/pages.type'
import {
  PagesCreateSchema,
  hasPagesValidationErrors,
  validatePagesPayload,
  type PagesFormErrors,
} from '@/modules/pages/validations/pages.validation'
import { translateFormError } from '@/shared/lib/forms/zod-form-errors'
import { Button, PageHeader, FormField, Input, FormToggleRow } from '@/shared/ui'

const initialState: PagesCreatePayload = {
  slug: '',
  is_published: false,
  translations: [],
}

function getValueAtPath(target: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean)

  let cursor: unknown = target
  for (const segment of segments) {
    if (!cursor || typeof cursor !== 'object') {
      return undefined
    }

    cursor = (cursor as Record<string, unknown>)[segment]
  }

  return cursor
}

function setValueAtPath<T extends Record<string, unknown>>(target: T, path: string, value: unknown): T {
  const segments = path.split('.').filter(Boolean)

  if (!segments.length) {
    return target
  }

  const clone = { ...target }
  let cursor: Record<string, unknown> = clone

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const isLeaf = index === segments.length - 1

    if (isLeaf) {
      cursor[segment] = value
      break
    }

    const nextValue = cursor[segment]
    const nextObject =
      nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)
        ? { ...(nextValue as Record<string, unknown>) }
        : {}

    cursor[segment] = nextObject
    cursor = nextObject
  }

  return clone as T
}

function toCreatePayload(value: unknown): PagesCreatePayload {
  const merged =
    value && typeof value === 'object'
      ? { ...initialState, ...(value as Record<string, unknown>) }
      : initialState

  const parsed = PagesCreateSchema.partial().safeParse(merged)
  if (!parsed.success) {
    return merged as PagesCreatePayload
  }

  return { ...initialState, ...parsed.data } as PagesCreatePayload
}

function applyArrayInputsToForm<T extends Record<string, unknown>>(
  source: T,
  arrayInputs: Record<string, string>,
  arrayPaths: string[]
): { value: T; errors: Record<string, string> } {
  let nextValue = source
  const nextErrors: Record<string, string> = {}

  for (const path of arrayPaths) {
    if (!(path in arrayInputs)) {
      continue
    }

    const rawValue = arrayInputs[path]?.trim()
    if (!rawValue) {
      nextValue = setValueAtPath(nextValue, path, [])
      continue
    }

    try {
      const parsed = JSON.parse(rawValue)
      if (!Array.isArray(parsed)) {
        nextErrors[path] = 'Array JSON is required'
        continue
      }

      nextValue = setValueAtPath(nextValue, path, parsed)
    } catch {
      nextErrors[path] = 'Invalid JSON array'
    }
  }

  return { value: nextValue, errors: nextErrors }
}

export default function PagesFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('pages')
  const entitySingular = t('entity.singular', { defaultValue: "Page" })

  const isEdit = useMemo(() => Boolean(id), [id])
  const detailQuery = usePagesById(id ?? '', isEdit)
  const { createMutation, updateMutation, } = usePagesCrudMutations()

  const [draft, setDraft] = useState<Partial<PagesCreatePayload>>({})
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<PagesFormErrors>({})

  const baseForm = useMemo<PagesCreatePayload>(
    () => toCreatePayload(detailQuery.data),
    [detailQuery.data]
  )

  const form = useMemo<PagesCreatePayload>(
    () => ({ ...baseForm, ...draft }),
    [baseForm, draft]
  )

  const relationOptionsByField: Record<string, { value: string; label: string }[]> = {}

  const handleSubmit = async () => {
    const { value: nextForm, errors: arrayErrors } = applyArrayInputsToForm(
      form as Record<string, unknown>,
      arrayInputs,
      ["translations"]
    )

    const nextErrors = {
      ...validatePagesPayload(nextForm as PagesCreatePayload),
      ...arrayErrors,
    }
    setErrors(nextErrors)

    if (hasPagesValidationErrors(nextErrors)) {
      return
    }

    if (isEdit && id) {
      await updateMutation.mutateAsync({ identifier: id, data: nextForm as PagesCreatePayload })
    } else {
      await createMutation.mutateAsync(nextForm as PagesCreatePayload)
    }

    navigate(APP_ROUTES.pages.path)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <PageHeader
        breadcrumbs={<AppBreadcrumbs />}
        title={(isEdit ? t('common.actions.edit', { ns: 'translation' }) : t('common.actions.add', { ns: 'translation' })) + ' ' + entitySingular}
        description={isEdit ? t('common.form.updateDescription', { ns: 'translation' }) : t('common.form.createDescription', { ns: 'translation' })}
      />

      <div className="space-y-4 rounded-md border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField htmlFor="pages-slug" label={`${t('form.fields.slug')} *`} error={translateFormError(errors['slug'], t)}>
          <Input
            id="pages-slug"
            type="text"
            value={String((getValueAtPath(form, 'slug') as string | undefined) ?? '')}
            onChange={(event) =>
              setDraft((previous) =>
                setValueAtPath(previous as Record<string, unknown>, 'slug', event.target.value) as Partial<PagesCreatePayload>
              )
            }
          />
        </FormField>

        <FormToggleRow
          label={`${t('form.fields.isPublished')} *`}
          checked={Boolean(getValueAtPath(form, 'is_published'))}
          onCheckedChange={(checked) =>
            setDraft((previous) =>
              setValueAtPath(previous as Record<string, unknown>, 'is_published', checked) as Partial<PagesCreatePayload>
            )
          }
        />

        <FormField htmlFor="pages-translations" label={`${t('form.fields.translations')} *`} error={translateFormError(errors['translations'], t)}>
          <div className="space-y-2">
            {((getValueAtPath(form, 'translations') as unknown[] | undefined) ?? []).map((item, index) => {
              const itemRecord = item && typeof item === 'object' && !Array.isArray(item)
                ? (item as Record<string, unknown>)
                : { value: item }

              return (
                <div key={index} className="space-y-2 rounded-md border border-border p-2">
                  {Object.entries(itemRecord).map(([entryKey, entryValue]) => (
                    <Input
                      key={entryKey}
                      id={index === 0 ? "pages-translations-${entryKey}" : undefined}
                      placeholder={entryKey}
                      value={String(entryValue ?? '')}
                      onChange={(event) =>
                        setDraft((previous) => {
                          const current = (getValueAtPath({ ...form, ...previous }, 'translations') as unknown[] | undefined) ?? []
                          const nextArray = [...current]
                          const nextItem =
                            nextArray[index] && typeof nextArray[index] === 'object' && !Array.isArray(nextArray[index])
                              ? { ...(nextArray[index] as Record<string, unknown>) }
                              : {}

                          nextItem[entryKey] = event.target.value
                          nextArray[index] = nextItem

                          return setValueAtPath(previous as Record<string, unknown>, 'translations', nextArray) as Partial<PagesCreatePayload>
                        })
                      }
                    />
                  ))}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setDraft((previous) => {
                          const current = (getValueAtPath({ ...form, ...previous }, 'translations') as unknown[] | undefined) ?? []
                          const nextArray = current.filter((_, entryIndex) => entryIndex !== index)
                          return setValueAtPath(previous as Record<string, unknown>, 'translations', nextArray) as Partial<PagesCreatePayload>
                        })
                      }
                    >
                      {t('common.actions.delete', { ns: 'translation' })}
                    </Button>
                  </div>
                </div>
              )
            })}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((previous) => {
                  const current = (getValueAtPath({ ...form, ...previous }, 'translations') as unknown[] | undefined) ?? []
                  const first = current[0]
                  const template =
                    first && typeof first === 'object' && !Array.isArray(first)
                      ? Object.fromEntries(Object.keys(first as Record<string, unknown>).map((key) => [key, '']))
                      : { value: '' }

                  return setValueAtPath(previous as Record<string, unknown>, 'translations', [...current, template]) as Partial<PagesCreatePayload>
                })
              }
            >
              {t('common.actions.add', { ns: 'translation' })}
            </Button>
          </div>
        </FormField>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(APP_ROUTES.pages.path)}>
            {t('common.actions.cancel', { ns: 'translation' })}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            loading={createMutation.isPending || updateMutation.isPending}
            disabled={createMutation.isPending || updateMutation.isPending || (isEdit ? false : false)}
          >
            {isEdit ? t('common.actions.update', { ns: 'translation' }) : t('common.actions.create', { ns: 'translation' })}
          </Button>
        </div>
      </div>
    </section>
  )
}
