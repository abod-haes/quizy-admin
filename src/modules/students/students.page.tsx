import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react'

import { StudentsPage as StudentsCrudPage } from '@/modules/content-crud/pages/academic-content-crud.page'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import { Button, Card, CardContent, CardHeader } from '@/shared/ui'

type StudentBrief = {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
}

type StudentAccountStatus = {
  id: string
  isBlocked: boolean
  blockedAt: string | null
}

type AccountAction = {
  id: string
  action: 'block' | 'unblock'
}

function getStudentLabel(student: StudentBrief) {
  const fullName = student.name?.trim() || [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
  if (fullName && student.phoneNumber) return `${fullName} — ${student.phoneNumber}`
  return fullName || student.phoneNumber || student.id
}

export default function StudentsManagementPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState('')

  const studentsQuery = useQuery({
    queryKey: ['students', 'account-controls', 'brief'],
    queryFn: () => api.get<StudentBrief[]>(API_ENDPOINTS.students.brief),
  })
  const statusesQuery = useQuery({
    queryKey: ['students', 'account-controls', 'statuses'],
    queryFn: () => api.get<StudentAccountStatus[]>(API_ENDPOINTS.students.statuses),
  })

  const statusById = useMemo(
    () => new Map((statusesQuery.data ?? []).map((status) => [status.id, status])),
    [statusesQuery.data],
  )
  const availableStudents = useMemo(
    () => (studentsQuery.data ?? []).filter((student) => !statusesQuery.data || statusById.has(student.id)),
    [statusById, statusesQuery.data, studentsQuery.data],
  )
  const activeSelectedId =
    selectedId && availableStudents.some((student) => student.id === selectedId)
      ? selectedId
      : availableStudents[0]?.id ?? ''
  const selectedStudent = availableStudents.find((student) => student.id === activeSelectedId)
  const selectedStatus = activeSelectedId ? statusById.get(activeSelectedId) : undefined

  const accountMutation = useMutation({
    mutationFn: ({ id, action }: AccountAction) =>
      api.patch<{ message?: string }>(
        action === 'block' ? API_ENDPOINTS.students.block(id) : API_ENDPOINTS.students.unblock(id),
      ),
    onSuccess: async (response) => {
      toast.success(response.message || 'تم تحديث حالة الحساب')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students', 'account-controls'] }),
        queryClient.invalidateQueries({ queryKey: ['content-crud', 'students'] }),
      ])
    },
    onError: (error) => {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'تعذر تحديث حالة الحساب'
      toast.error(message)
    },
  })

  const refreshControls = async () => {
    await Promise.all([studentsQuery.refetch(), statusesQuery.refetch()])
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Card className="shrink-0 rounded-3xl border-primary/15 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
          <div>
            <h2 className="text-base font-bold text-foreground">التحكم بحساب الطالب</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              الحظر يوقف تسجيل الدخول وينهي الجلسات الحالية، وإلغاء الحظر يتطلب من الطالب تسجيل الدخول من جديد.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={studentsQuery.isFetching || statusesQuery.isFetching}
            onClick={() => void refreshControls()}
          >
            <RefreshCcw className="size-4" />
            تحديث الحالة
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-end">
          <label className="min-w-0 flex-1 space-y-1.5">
            <span className="text-sm font-medium text-foreground">الطالب</span>
            <select
              value={activeSelectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={studentsQuery.isLoading || statusesQuery.isLoading || availableStudents.length === 0}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {availableStudents.length === 0 ? <option value="">لا يوجد طلاب</option> : null}
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {getStudentLabel(student)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {selectedStudent ? (
              <span
                className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-semibold ${
                  selectedStatus?.isBlocked
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {selectedStatus?.isBlocked ? 'محظور' : 'نشط'}
              </span>
            ) : null}

            <Button
              type="button"
              variant={selectedStatus?.isBlocked ? 'outline' : 'destructive'}
              disabled={!activeSelectedId || accountMutation.isPending || statusesQuery.isLoading}
              onClick={() => {
                if (!activeSelectedId) return
                accountMutation.mutate({
                  id: activeSelectedId,
                  action: selectedStatus?.isBlocked ? 'unblock' : 'block',
                })
              }}
            >
              {accountMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : selectedStatus?.isBlocked ? (
                <ShieldCheck className="size-4" />
              ) : (
                <Ban className="size-4" />
              )}
              {selectedStatus?.isBlocked ? 'إلغاء الحظر' : 'حظر الحساب'}
            </Button>
          </div>
        </CardContent>
        <div className="border-t border-destructive/15 bg-destructive/5 px-5 py-2.5 text-xs text-destructive">
          تنبيه: زر حذف الطالب في الجدول أدناه صار حذفاً نهائياً من قاعدة البيانات مع بيانات الطالب المرتبطة، وليس حذفاً مؤقتاً.
        </div>
      </Card>

      <div className="min-h-0 flex-1">
        <StudentsCrudPage />
      </div>
    </div>
  )
}
