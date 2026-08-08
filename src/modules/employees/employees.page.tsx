import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, RefreshCcw, Send, ShieldCheck, Trash2, UserPlus, UserRoundCheck, UserRoundX } from 'lucide-react'

import { employeesService } from '@/modules/employees/employees.service'
import type {
  AdminEmployee,
  AdminEmployeeStatus,
  CreateAdminEmployeeInput,
} from '@/modules/employees/employees.types'
import {
  Alert,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomSelect,
  FormField,
  Input,
  PaginatedDataTable,
} from '@/shared/ui'

const PAGE_SIZE = 20
const EMPTY_FORM: CreateAdminEmployeeInput = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  countryCallingCode: '+963',
  permissions: [],
  sendInvitation: true,
}

const STATUS_LABEL: Record<AdminEmployeeStatus, string> = {
  INVITED: 'بانتظار التفعيل',
  ACTIVE: 'فعال',
  DISABLED: 'معطل',
}

export default function EmployeesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AdminEmployeeStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<CreateAdminEmployeeInput>(EMPTY_FORM)
  const [editing, setEditing] = useState<AdminEmployee | null>(null)
  const [formError, setFormError] = useState('')

  const employeesQuery = useQuery({
    queryKey: ['admin-employees', page, status, search],
    queryFn: () =>
      employeesService.list({
        page,
        perPage: PAGE_SIZE,
        ...(status !== 'ALL' ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
  })
  const permissionsQuery = useQuery({
    queryKey: ['admin-employees', 'permissions'],
    queryFn: employeesService.permissions,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-employees'] })
  const createMutation = useMutation({
    mutationFn: employeesService.create,
    onSuccess: async () => {
      setForm(EMPTY_FORM)
      setFormError('')
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, firstName, lastName, permissions }: { id: string; firstName: string; lastName: string; permissions: string[] }) =>
      employeesService.update(id, { firstName, lastName, permissions }),
    onSuccess: async () => {
      setEditing(null)
      await invalidate()
    },
  })
  const disableMutation = useMutation({ mutationFn: employeesService.disable, onSuccess: invalidate })
  const enableMutation = useMutation({ mutationFn: employeesService.enable, onSuccess: invalidate })
  const resendMutation = useMutation({ mutationFn: employeesService.resendInvitation, onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: employeesService.remove, onSuccess: invalidate })

  const togglePermission = (code: string, edit = false) => {
    if (edit && editing) {
      setEditing({
        ...editing,
        permissions: editing.permissions.includes(code)
          ? editing.permissions.filter((item) => item !== code)
          : [...editing.permissions, code],
      })
      return
    }
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(code)
        ? current.permissions.filter((item) => item !== code)
        : [...current.permissions, code],
    }))
  }

  const submitCreate = () => {
    if (!form.firstName.trim() || !form.phoneNumber.trim() || !form.countryCallingCode.trim()) {
      setFormError('الاسم ورقم الهاتف ورمز الدولة مطلوبة.')
      return
    }
    setFormError('')
    createMutation.mutate({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName?.trim() || undefined,
      phoneNumber: form.phoneNumber.trim(),
      countryCallingCode: form.countryCallingCode.trim(),
    })
  }

  const rows = employeesQuery.data?.items ?? []
  const totalCount = employeesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const statusOptions = [
    { value: 'ALL', label: 'كل الحالات' },
    { value: 'ACTIVE', label: STATUS_LABEL.ACTIVE },
    { value: 'INVITED', label: STATUS_LABEL.INVITED },
    { value: 'DISABLED', label: STATUS_LABEL.DISABLED },
  ]
  const permissions = permissionsQuery.data ?? []
  const anyActionPending =
    disableMutation.isPending || enableMutation.isPending || resendMutation.isPending || deleteMutation.isPending

  const permissionNames = useMemo(
    () => new Map(permissions.map((permission) => [permission.code, permission.name])),
    [permissions],
  )

  return (
    <section className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-6" /></div>
          <div><h1 className="text-2xl font-bold">موظفو الإدارة</h1><p className="mt-1 text-sm text-muted-foreground">إدارة دعوات الموظفين وصلاحياتهم وجلساتهم من Nest مباشرة.</p></div>
        </div>
        <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void employeesQuery.refetch()}>تحديث</Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="size-5" />إضافة موظف</CardTitle><CardDescription>سيتم إرسال دعوة واتساب افتراضياً، ولا يوجد تسجيل Admin عام.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="الاسم"><Input value={form.firstName} onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))} /></FormField>
            <FormField label="الكنية"><Input value={form.lastName ?? ''} onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))} /></FormField>
            <FormField label="رمز الدولة"><Input value={form.countryCallingCode} onChange={(e) => setForm((c) => ({ ...c, countryCallingCode: e.target.value }))} /></FormField>
            <FormField label="رقم الهاتف"><Input inputMode="tel" value={form.phoneNumber} onChange={(e) => setForm((c) => ({ ...c, phoneNumber: e.target.value }))} /></FormField>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">الصلاحيات</p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {permissions.map((permission) => (
                <label key={permission.code} className="flex cursor-pointer items-start gap-2 rounded-2xl border border-border p-3 text-sm">
                  <input className="mt-1" type="checkbox" checked={form.permissions.includes(permission.code)} onChange={() => togglePermission(permission.code)} />
                  <span><span className="block font-semibold">{permission.name}</span><span className="text-xs text-muted-foreground">{permission.description ?? permission.code}</span></span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sendInvitation !== false} onChange={(e) => setForm((c) => ({ ...c, sendInvitation: e.target.checked }))} />إرسال دعوة واتساب مباشرة</label>
          {formError ? <Alert variant="destructive"><AlertTitle>{formError}</AlertTitle></Alert> : null}
          {createMutation.isError ? <Alert variant="destructive"><AlertTitle>تعذر إنشاء الموظف.</AlertTitle></Alert> : null}
          <div className="flex justify-end"><Button loading={createMutation.isPending} icon={<UserPlus className="size-4" />} onClick={submitCreate}>إضافة الموظف</Button></div>
        </CardContent>
      </Card>

      {editing ? (
        <Card className="rounded-3xl border-primary/20">
          <CardHeader><CardTitle>تعديل {editing.firstName} {editing.lastName ?? ''}</CardTitle><CardDescription>يمكن تعديل الاسم والصلاحيات فقط. تغيير رقم الهاتف يحتاج مسار هوية منفصل.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2"><FormField label="الاسم"><Input value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} /></FormField><FormField label="الكنية"><Input value={editing.lastName ?? ''} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} /></FormField></div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{permissions.map((permission) => <label key={permission.code} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={editing.permissions.includes(permission.code)} onChange={() => togglePermission(permission.code, true)} />{permission.name}</label>)}</div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button><Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: editing.id, firstName: editing.firstName, lastName: editing.lastName ?? '', permissions: editing.permissions })}>حفظ</Button></div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[1fr_14rem]"><Input value={search} placeholder="بحث بالاسم أو الرقم" onChange={(e) => { setSearch(e.target.value); setPage(1) }} /><CustomSelect value={status} options={statusOptions} onValueChange={(value) => { setStatus(value as AdminEmployeeStatus | 'ALL'); setPage(1) }} /></div>

      <PaginatedDataTable<AdminEmployee>
        rows={rows}
        loading={employeesQuery.isLoading || employeesQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={`${totalCount} موظف`}
        emptyMessage="لا يوجد موظفون مطابقون."
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: 'السابق', nextLabel: 'التالي', getPageLabel: (pageNumber) => `صفحة ${pageNumber}` }}
        columns={[
          { id: 'name', header: 'الموظف', renderCell: (row) => <div><p className="font-semibold">{row.firstName} {row.lastName ?? ''}</p><p className="text-xs text-muted-foreground">{row.countryCallingCode ?? ''} {row.phoneNumber}</p></div> },
          { id: 'status', header: 'الحالة', renderCell: (row) => <Badge variant="outline" color={row.status === 'ACTIVE' ? 'emerald' : row.status === 'DISABLED' ? 'slate' : 'amber'}>{STATUS_LABEL[row.status]}</Badge> },
          { id: 'permissions', header: 'الصلاحيات', renderCell: (row) => <div className="flex max-w-md flex-wrap gap-1">{row.permissions.length ? row.permissions.map((code) => <Badge key={code} variant="outline">{permissionNames.get(code) ?? code}</Badge>) : <span className="text-xs text-muted-foreground">بدون صلاحيات</span>}</div> },
          { id: 'actions', header: '', renderCell: (row) => <div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="outline" icon={<Pencil className="size-3.5" />} onClick={() => setEditing({ ...row })}>تعديل</Button>{row.status === 'DISABLED' ? <Button size="sm" variant="outline" icon={<UserRoundCheck className="size-3.5" />} disabled={anyActionPending} onClick={() => enableMutation.mutate(row.id)}>تفعيل</Button> : <Button size="sm" variant="outline" icon={<UserRoundX className="size-3.5" />} disabled={anyActionPending} onClick={() => disableMutation.mutate(row.id)}>تعطيل</Button>}{row.status === 'INVITED' ? <Button size="sm" variant="outline" icon={<Send className="size-3.5" />} disabled={anyActionPending} onClick={() => resendMutation.mutate(row.id)}>إعادة الدعوة</Button> : null}<Button size="sm" variant="outline" icon={<Trash2 className="size-3.5" />} disabled={anyActionPending} onClick={() => deleteMutation.mutate(row.id)}>حذف</Button></div> },
        ]}
      />

      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground"><KeyRound className="me-2 inline size-4" />تعطيل الموظف يلغي Refresh Tokens من السيرفر، لذلك لا يكفي إخفاء الواجهة فقط.</div>
    </section>
  )
}
