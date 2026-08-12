import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCcw, ShieldCheck } from 'lucide-react'
import { toast } from '@/shared/lib/toast'

import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { api } from '@/shared/api/api-client'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CustomMultiSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

const ADMIN_EMPLOYEES_ENDPOINT = '/api/v1/admin/employees'

const permissionOptions = [
  { value: 'employees.manage', label: 'إدارة الموظفين' },
  { value: 'content.manage', label: 'إدارة المحتوى' },
  { value: 'quizzes.manage', label: 'إدارة الاختبارات' },
  { value: 'resources.manage', label: 'إدارة الملفات' },
  { value: 'courses.manage', label: 'إدارة الكورسات' },
  { value: 'ai.manage', label: 'إدارة الذكاء الاصطناعي' },
  { value: 'qr.manage', label: 'إدارة QR' },
  { value: 'notifications.manage', label: 'إدارة الإشعارات' },
]

type AdminEmployee = {
  id: string
  firstName: string
  lastName: string | null
  phoneNumber: string
  countryCallingCode: string | null
  status: 'INVITED' | 'ACTIVE' | 'DISABLED'
  permissions: string[]
  createdAt: string
}

type AdminEmployeePage = {
  items: AdminEmployee[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

type CreateAdminEmployeeRequest = {
  firstName: string
  lastName?: string
  phoneNumber: string
  countryCallingCode: string
  permissions: string[]
  sendInvitation: boolean
}

function emptyForm() {
  return {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCallingCode: '+963',
    permissions: [] as string[],
  }
}

export default function AdminEmployeesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const employeesQuery = useQuery({
    queryKey: ['admin-employees'],
    queryFn: () => api.get<AdminEmployeePage>(ADMIN_EMPLOYEES_ENDPOINT, { params: { page: 1, perPage: 100 } }),
  })

  const employees = useMemo(() => employeesQuery.data?.items ?? [], [employeesQuery.data])

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminEmployeeRequest) =>
      api.post<AdminEmployee, CreateAdminEmployeeRequest>(ADMIN_EMPLOYEES_ENDPOINT, payload),
    onSuccess: async () => {
      toast.success('تم إنشاء حساب الأدمن وإرسال الدعوة')
      setCreateOpen(false)
      setForm(emptyForm())
      await queryClient.invalidateQueries({ queryKey: ['admin-employees'] })
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
      toast.error(message || 'تعذر إنشاء حساب الأدمن')
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.phoneNumber.trim() || !form.countryCallingCode.trim()) return

    createMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      phoneNumber: form.phoneNumber.trim(),
      countryCallingCode: form.countryCallingCode.trim(),
      permissions: form.permissions,
      sendInvitation: true,
    })
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-3xl border border-primary/10 bg-card/95 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة الأدمن</h1>
          <p className="mt-1 text-sm text-muted-foreground">إنشاء حسابات الإدارة يتم من الداشبورد فقط. الحساب الجديد يفعّل كلمة مروره من الدعوة.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => employeesQuery.refetch()} disabled={employeesQuery.isFetching}>
            <RefreshCcw className="size-4" /> تحديث
          </Button>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> إضافة أدمن
          </Button>
        </div>
      </div>

      <Card className="min-h-0 flex-1 overflow-hidden rounded-3xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" /> الصلاحيات الفعلية تُفرض من الـ backend، وليس من الواجهة فقط.
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الصلاحيات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{[employee.firstName, employee.lastName].filter(Boolean).join(' ')}</TableCell>
                  <TableCell dir="ltr">{employee.countryCallingCode ?? ''} {employee.phoneNumber}</TableCell>
                  <TableCell>{employee.status}</TableCell>
                  <TableCell className="max-w-[30rem] whitespace-normal">{employee.permissions.join('، ') || 'بدون صلاحيات'}</TableCell>
                </TableRow>
              ))}
              {!employeesQuery.isLoading && employees.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">لا يوجد موظفو إدارة بعد.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => !createMutation.isPending && setCreateOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة أدمن</DialogTitle>
            <DialogDescription>لا يتم تعيين كلمة مرور من هنا. سيتم إرسال دعوة ليختار الموظف كلمة مروره بنفسه.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="admin-first-name" label="الاسم الأول">
                <Input id="admin-first-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
              </FormField>
              <FormField htmlFor="admin-last-name" label="الاسم الأخير">
                <Input id="admin-last-name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
              </FormField>
              <FormField htmlFor="admin-country-code" label="رمز الدولة">
                <CountryCodeSelect id="admin-country-code" value={form.countryCallingCode} onValueChange={(countryCallingCode) => setForm((current) => ({ ...current, countryCallingCode }))} />
              </FormField>
              <FormField htmlFor="admin-phone" label="رقم الهاتف">
                <Input id="admin-phone" inputMode="tel" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
              </FormField>
            </div>
            <FormField htmlFor="admin-permissions" label="الصلاحيات">
              <CustomMultiSelect id="admin-permissions" value={form.permissions} options={permissionOptions} placeholder="اختر الصلاحيات" onValueChange={(permissions) => setForm((current) => ({ ...current, permissions }))} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={() => setCreateOpen(false)}>إلغاء</Button>
              <Button type="submit" loading={createMutation.isPending} disabled={createMutation.isPending || !form.firstName.trim() || !form.phoneNumber.trim()}>إنشاء وإرسال دعوة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
