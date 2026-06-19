import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCrudRelationEndpoint } from '@/shared/constants/crud-relations-map'
import { fetchCrudRelationOptions } from '@/shared/lib/forms/crud-relation-options'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { useFaqsCrudMutations, useFaqsById } from '@/modules/faqs/hooks/use-faqs-crud.hook'
import type { FaqsCreatePayload } from '@/modules/faqs/types/faqs.type'
import {
  FaqsCreateSchema,
  hasFaqsValidationErrors,
  validateFaqsPayload,
  type FaqsFormErrors,
} from '@/modules/faqs/validations/faqs.validation'
import { translateFormError } from '@/shared/lib/forms/zod-form-errors'
import { Button, PageHeader, FormField, Input, CustomSelect, FormToggleRow } from '@/shared/ui'

const initialState: FaqsCreatePayload = {
  section_id: 0,
  sort_order: 0,
  is_active: false,
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

function toCreatePayload(value: unknown): FaqsCreatePayload {
  const merged =
    value && typeof value === 'object'
      ? { ...initialState, ...(value as Record<string, unknown>) }
      : initialState

  const parsed = FaqsCreateSchema.partial().safeParse(merged)
  if (!parsed.success) {
    return merged as FaqsCreatePayload
  }

  return { ...initialState, ...parsed.data } as FaqsCreatePayload
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

export default function FaqsFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('faqs')
  const entitySingular = t('entity.singular', { defaultValue: "Faq" })

  const isEdit = useMemo(() => Boolean(id), [id])
  const detailQuery = useFaqsById(id ?? '', isEdit)
  const { createMutation, updateMutation, } = useFaqsCrudMutations()

  const [draft, setDraft] = useState<Partial<FaqsCreatePayload>>({})
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<FaqsFormErrors>({})

  const baseForm = useMemo<FaqsCreatePayload>(
    () => toCreatePayload(detailQuery.data),
    [detailQuery.data]
  )

  const form = useMemo<FaqsCreatePayload>(
    () => ({ ...baseForm, ...draft }),
    [baseForm, draft]
  )

  const relationOptionQueries = {
    "section_id": useQuery({
      queryKey: ['faqs-relation-section_id'],
      queryFn: () => fetchCrudRelationOptions(getCrudRelationEndpoint('faqs', "section_id")),
      enabled: Boolean(getCrudRelationEndpoint('faqs', "section_id")),
    }),
  }

  const relationOptionsByField = Object.fromEntries(
    Object.entries(relationOptionQueries).map(([key, query]) => [
      key,
      (query.data ?? []).map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ])
  ) as Record<string, { value: string; label: string }[]>

  const handleSubmit = async () => {
    const { value: nextForm, errors: arrayErrors } = applyArrayInputsToForm(
      form as Record<string, unknown>,
      arrayInputs,
      ["translations"]
    )

    const nextErrors = {
      ...validateFaqsPayload(nextForm as FaqsCreatePayload),
      ...arrayErrors,
    }
    setErrors(nextErrors)

    if (hasFaqsValidationErrors(nextErrors)) {
      return
    }

    if (isEdit && id) {
      await updateMutation.mutateAsync({ identifier: id, data: nextForm as FaqsCreatePayload })
    } else {
      await createMutation.mutateAsync(nextForm as FaqsCreatePayload)
    }

    navigate(APP_ROUTES.faqs.path)
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
        <FormField htmlFor="faqs-section_id" label={`${t('form.fields.sectionId')} *`} error={translateFormError(errors['section_id'], t)}>
          <CustomSelect
            id="faqs-section_id"
            value={String((getValueAtPath(form, 'section_id') as number | undefined) ?? '')}
            options={relationOptionsByField["section_id"] ?? []}
            onValueChange={(value) =>
              setDraft((previous) =>
                setValueAtPath(previous as Record<string, unknown>, 'section_id', value === '' ? 0 : Number(value)) as Partial<FaqsCreatePayload>
              )
            }
          />
        </FormField>

        <FormField htmlFor="faqs-sort_order" label={`${t('form.fields.sortOrder')} *`} error={translateFormError(errors['sort_order'], t)}>
          <Input
            id="faqs-sort_order"
            type="number"
            value={String((getValueAtPath(form, 'sort_order') as number | undefined) ?? '')}
            onChange={(event) =>
              setDraft((previous) =>
                setValueAtPath(previous as Record<string, unknown>, 'sort_order', event.target.value === '' ? 0 : Number(event.target.value)) as Partial<FaqsCreatePayload>
              )
            }
          />
        </FormField>

        <FormToggleRow
          label={`${t('form.fields.isActive')} *`}
          checked={Boolean(getValueAtPath(form, 'is_active'))}
          onCheckedChange={(checked) =>
            setDraft((previous) =>
              setValueAtPath(previous as Record<string, unknown>, 'is_active', checked) as Partial<FaqsCreatePayload>
            )
          }
        />

        <FormField htmlFor="faqs-translations" label={`${t('form.fields.translations')} *`} error={translateFormError(errors['translations'], t)}>
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
                      id={index === 0 ? "faqs-translations-${entryKey}" : undefined}
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

                          return setValueAtPath(previous as Record<string, unknown>, 'translations', nextArray) as Partial<FaqsCreatePayload>
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
                          return setValueAtPath(previous as Record<string, unknown>, 'translations', nextArray) as Partial<FaqsCreatePayload>
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

                  return setValueAtPath(previous as Record<string, unknown>, 'translations', [...current, template]) as Partial<FaqsCreatePayload>
                })
              }
            >
              {t('common.actions.add', { ns: 'translation' })}
            </Button>
          </div>
        </FormField>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(APP_ROUTES.faqs.path)}>
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
