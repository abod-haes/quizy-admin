import {
  useMemo,
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { CreditCard,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Badge,
  Button,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PaginatedDataTable,
  PageHeader,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui'

type CourseOption = { id: string; title?: string | null; name?: string | null }
type StudentOption = { id: string; name?: string | null; firstName?: string | null; lastName?: string | null; phoneNumber?: string | null }
type CoursePurchase = {
  id: string
  courseId: string
  courseTitle?: string | null
  studentId: string
  studentName?: string | null
  status: string
  paymentMethod?: string | null
  transactionId?: string | null
  qrCodeId?: string | null
  purchasedAt?: string | null
}
type GrantPayload = { studentId: string; paymentMethod?: string | null; transactionId?: string | null }

const PAGE_SIZE = 20
const LOOKUP_SIZE = 100

function courseLabel(course: CourseOption) { return course.title?.trim() || course.name?.trim() || course.id }
function studentLabel(student: StudentOption) {
  const name = student.name || [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
  return [name, student.phoneNumber].filter(Boolean).join(' — ') || student.id
}

export default function CoursePurchasesPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [page, setPage] = useState(1)
  const [grantOpen, setGrantOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<CoursePurchase | null>(null)

  const coursesQuery = useQuery({
    queryKey: ['course-purchases', 'courses'],
    queryFn: () => api.get<PagedResponse<CourseOption>>(API_ENDPOINTS.courses.list, { params: { page: 1, perPage: LOOKUP_SIZE } }),
    staleTime: 5 * 60 * 1000,
  })
  const studentsQuery = useQuery({
    queryKey: ['course-purchases', 'students'],
    queryFn: () => api.get<StudentOption[]>(API_ENDPOINTS.students.brief),
    staleTime: 5 * 60 * 1000,
  })
  const purchasesQuery = useQuery({
    queryKey: ['course-purchases', courseId, page],
    queryFn: () => api.get<PagedResponse<CoursePurchase>>(API_ENDPOINTS.courses.purchases(courseId), { params: { page, perPage: PAGE_SIZE } }),
    enabled: Boolean(courseId),
  })

  const courseOptions = useMemo(() => (coursesQuery.data?.items ?? []).map((course) => ({ value: course.id, label: courseLabel(course) })), [coursesQuery.data?.items])
  const studentOptions = useMemo(() => (studentsQuery.data ?? []).map((student) => ({ value: student.id, label: studentLabel(student) })), [studentsQuery.data])
  const selectedCourseName = courseOptions.find((option) => option.value === courseId)?.label ?? ''

  const closeGrant = () => {
    setGrantOpen(false)
    setStudentId('')
    setPaymentMethod('')
    setTransactionId('')
  }

  const grantMutation = useMutation({
    mutationFn: () => {
      const payload: GrantPayload = {
        studentId,
        paymentMethod: paymentMethod.trim() || null,
        transactionId: transactionId.trim() || null,
      }
      return api.post(API_ENDPOINTS.courses.purchases(courseId), payload)
    },
    onSuccess: async () => {
      toast.success(t('coursePurchases.granted'))
      closeGrant()
      await queryClient.invalidateQueries({ queryKey: ['course-purchases', courseId] })
    },
    onError: () => toast.error(t('coursePurchases.grantError')),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(API_ENDPOINTS.coursePurchases.remove(id)),
    onSuccess: async () => {
      toast.success(t('coursePurchases.revoked'))
      setRevokeTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['course-purchases', courseId] })
    },
    onError: () => toast.error(t('coursePurchases.revokeError')),
  })

  const rows = purchasesQuery.data?.items ?? []
  const totalCount = purchasesQuery.data?.totalCount ?? 0
  const pageSize = purchasesQuery.data?.pageSize ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<CreditCard />}
        title={t('coursePurchases.title')}
        description={t('coursePurchases.description')}
        controls={<CustomSelect className="h-9 min-w-56" value={courseId || undefined} placeholder={t('coursePurchases.selectCourse')} options={courseOptions} onValueChange={(value) => { setCourseId(String(value)); setPage(1) }} />}
        actions={<><Button variant="outline" disabled={!courseId || purchasesQuery.isFetching} onClick={() => void purchasesQuery.refetch()}><RefreshCcw />{t('common.refresh')}</Button><Button disabled={!courseId} onClick={() => setGrantOpen(true)}><Plus />{t('coursePurchases.grant')}</Button></>}
      />

      {!courseId ? <div className="flex min-h-0 flex-1 items-center justify-center border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">{t('coursePurchases.selectCourseFirst')}</div> : <PaginatedDataTable<CoursePurchase>
        className="min-h-0 flex-1"
          rows={rows}
          loading={purchasesQuery.isLoading || purchasesQuery.isFetching}
          getRowId={(row) => row.id}
          summaryText={t('coursePurchases.summary', { count: totalCount, course: selectedCourseName })}
          emptyMessage={t('coursePurchases.empty')}
          pagination={{ currentPage: page, totalPages, pageSize, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
          columns={[
            { id: 'student', header: t('coursePurchases.student'), renderCell: (row) => <span className="font-semibold">{row.studentName || row.studentId}</span> },
            { id: 'status', header: t('coursePurchases.status'), renderCell: (row) => <Badge variant="outline" color={row.status.toLowerCase() === 'purchased' || row.status.toLowerCase() === 'active' ? 'emerald' : 'slate'}>{row.status}</Badge> },
            { id: 'payment', header: t('coursePurchases.paymentMethod'), renderCell: (row) => row.paymentMethod || '-' },
            { id: 'transaction', header: t('coursePurchases.transactionId'), renderCell: (row) => row.transactionId || '-' },
            { id: 'date', header: t('coursePurchases.purchasedAt'), renderCell: (row) => row.purchasedAt ? new Date(row.purchasedAt).toLocaleString() : '-' },
            { id: 'actions', header: '', renderCell: (row) => <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRevokeTarget(row)}><Trash2 className="size-4" />{t('coursePurchases.revoke')}</Button> },
          ]}
      />}

      <Sheet open={grantOpen} onOpenChange={(open) => { if (!open && !grantMutation.isPending) closeGrant() }}>
        <SheetContent className="max-w-lg"><SheetHeader><SheetTitle>{t('coursePurchases.grantTitle')}</SheetTitle><SheetDescription>{t('coursePurchases.grantDescription', { course: selectedCourseName })}</SheetDescription></SheetHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label>{t('coursePurchases.student')}</Label><CustomSelect value={studentId || undefined} placeholder={t('coursePurchases.selectStudent')} options={studentOptions} onValueChange={(value) => setStudentId(String(value))} /></div><div className="space-y-2"><Label>{t('coursePurchases.paymentMethod')}</Label><Input maxLength={100} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} /></div><div className="space-y-2"><Label>{t('coursePurchases.transactionId')}</Label><Input maxLength={150} value={transactionId} onChange={(event) => setTransactionId(event.target.value)} /></div></div><SheetFooter><Button variant="outline" disabled={grantMutation.isPending} onClick={closeGrant}>{t('common.cancel')}</Button><Button disabled={!studentId || grantMutation.isPending} onClick={() => grantMutation.mutate()}>{grantMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('coursePurchases.grant')}</Button></SheetFooter></SheetContent>
      </Sheet>

      <Dialog open={Boolean(revokeTarget)} onOpenChange={(open) => { if (!open && !revokeMutation.isPending) setRevokeTarget(null) }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t('coursePurchases.revokeTitle')}</DialogTitle><DialogDescription>{revokeTarget ? t('coursePurchases.revokeConfirm', { name: revokeTarget.studentName || revokeTarget.studentId }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={revokeMutation.isPending} onClick={() => setRevokeTarget(null)}>{t('common.cancel')}</Button><Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={revokeMutation.isPending} onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}>{revokeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('coursePurchases.revoke')}</Button></DialogFooter></DialogContent>
      </Dialog>
    </section>
  )
}
