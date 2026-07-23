import { useMemo, useState } from 'react'
import { BrainCircuit, Save, Sparkles } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { aiChatSettingsService } from '@/modules/ai-chat/services/ai-chat-settings.service'
import {
  EMPTY_AI_CHAT_SETTINGS,
  type AiChatSettings,
} from '@/modules/ai-chat/types/ai-chat-settings.types'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Skeleton,
  useToast,
} from '@/shared/ui'

const QUERY_KEY = ['ai-chat', 'settings'] as const

type NumericField = keyof AiChatSettings

type PlanCardProps = {
  title: string
  description: string
  tokenField: NumericField
  messageField: NumericField
  values: AiChatSettings
  errors: Partial<Record<NumericField, string>>
  disabled: boolean
  onChange: (field: NumericField, value: string) => void
}

function PlanCard({
  title,
  description,
  tokenField,
  messageField,
  values,
  errors,
  disabled,
  onChange,
}: PlanCardProps) {
  const { t } = useTranslation('ai-chat')
  return (
    <Card className="rounded-2xl border-border/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          label={t('fields.dailyTokenLimit')}
          error={errors[tokenField]}
          hint={t('hints.positiveInteger')}
        >
          <Input
            type="number"
            min={1}
            step={1}
            value={values[tokenField]}
            disabled={disabled}
            onChange={(event) => onChange(tokenField, event.target.value)}
          />
        </FormField>
        <FormField
          label={t('fields.dailyMessageLimit')}
          error={errors[messageField]}
          hint={t('hints.positiveInteger')}
        >
          <Input
            type="number"
            min={1}
            step={1}
            value={values[messageField]}
            disabled={disabled}
            onChange={(event) => onChange(messageField, event.target.value)}
          />
        </FormField>
      </CardContent>
    </Card>
  )
}

export default function AiChatSettingsPage() {
  const { t } = useTranslation('ai-chat')
  const { success } = useToast()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Partial<AiChatSettings>>({})
  const [errors, setErrors] = useState<Partial<Record<NumericField, string>>>({})

  const settingsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: aiChatSettingsService.get,
  })

  const values = useMemo<AiChatSettings>(
    () => ({
      ...(settingsQuery.data ?? EMPTY_AI_CHAT_SETTINGS),
      ...draft,
    }),
    [draft, settingsQuery.data]
  )

  const updateMutation = useMutation({
    mutationFn: aiChatSettingsService.update,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      setDraft({})
      success(t('messages.saved'))
    },
  })

  const validate = () => {
    const nextErrors: Partial<Record<NumericField, string>> = {}
    for (const [field, value] of Object.entries(values) as Array<[NumericField, number]>) {
      if (!Number.isInteger(value) || value <= 0) {
        nextErrors[field] = t('validation.positiveInteger')
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (field: NumericField, rawValue: string) => {
    const value = Number(rawValue)
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(settingsQuery.data ?? EMPTY_AI_CHAT_SETTINGS),
    [settingsQuery.data, values]
  )

  const handleSubmit = () => {
    if (!validate()) return
    updateMutation.mutate(values)
  }

  if (settingsQuery.isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-2xl" />
          ))}
        </div>
      </section>
    )
  }

  if (settingsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('states.errorTitle')}</AlertTitle>
        <AlertDescription className="mt-2 flex flex-wrap items-center gap-3">
          <span>{t('states.errorDescription')}</span>
          <Button variant="outline" size="sm" onClick={() => void settingsQuery.refetch()}>
            {t('actions.retry')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const disabled = updateMutation.isPending

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" color="primary" className="rounded-full px-3">
              <Sparkles className="size-3.5" />
              {t('badge')}
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t('description')}
              </p>
            </div>
          </div>
          <Button
            icon={<Save className="size-4" />}
            loading={updateMutation.isPending}
            disabled={!isDirty || disabled}
            onClick={handleSubmit}
          >
            {t('actions.save')}
          </Button>
        </div>
      </div>

      {updateMutation.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('messages.saveFailed')}</AlertTitle>
        </Alert>
      ) : null}

      <Card className="rounded-2xl border-primary/15">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <CardTitle>{t('global.title')}</CardTitle>
              <CardDescription>{t('global.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FormField
            label={t('fields.maxInputCharacters')}
            error={errors.maxInputCharacters}
            hint={t('global.hint')}
            className="max-w-xl"
          >
            <Input
              type="number"
              min={1}
              step={1}
              value={values.maxInputCharacters}
              disabled={disabled}
              onChange={(event) => handleChange('maxInputCharacters', event.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanCard
          title={t('plans.free.title')}
          description={t('plans.free.description')}
          tokenField="freeDailyTokenLimit"
          messageField="freeDailyMessageLimit"
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={handleChange}
        />
        <PlanCard
          title={t('plans.plus.title')}
          description={t('plans.plus.description')}
          tokenField="plusDailyTokenLimit"
          messageField="plusDailyMessageLimit"
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={handleChange}
        />
        <PlanCard
          title={t('plans.pro.title')}
          description={t('plans.pro.description')}
          tokenField="proDailyTokenLimit"
          messageField="proDailyMessageLimit"
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={handleChange}
        />
        <PlanCard
          title={t('plans.ultra.title')}
          description={t('plans.ultra.description')}
          tokenField="ultraDailyTokenLimit"
          messageField="ultraDailyMessageLimit"
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={handleChange}
        />
      </div>
    </section>
  )
}
