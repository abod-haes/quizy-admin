import {
  useMemo,
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { KeyRound,
  Pencil,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRoundCheck,
  UserRoundX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { employeesService } from '@/modules/employees/employees.service'
import type {
  AdminEmployee,
  AdminEmployeeStatus,
  CreateAdminEmployeeInput,
  } from '@/modules/employees/employees.types'
import type { AdminPermissionCode } from '@/shared/auth/admin-permissions'
import {
  Alert,
  AlertTitle,
  Badge,
  Button,
  CustomSelect,
  FormField,
  Input,
  PaginatedDataTable,
  PageHeader,
  TableRowActionsMenu,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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

export default function EmployeesPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AdminEmployeeStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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
      setCreateDialogOpen(false)
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, firstName, lastName, permissions }: { id: string; firstName: string; lastName: string; permissions: AdminPermissionCode[] }) =>
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

  const resetCreateForm = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    createMutation.reset()
  }

  const openCreateDialog = () => {
    resetCreateForm()
    setCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    if (createMutation.isPending) return
    setCreateDialogOpen(false)
    resetCreateForm()
  }

  const togglePermission = (code: AdminPermissionCode, edit = false) => {
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
      setFormError(t('employees.requiredError'))
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
  const statusLabel = (value: AdminEmployeeStatus) => t(`employees.statuses.${value}`)
  const statusOptions = [
    { value: 'ALL', label: t('employees.allStatuses') },
    { value: 'ACTIVE', label: statusLabel('ACTIVE') },
    { value: 'INVITED', label: statusLabel('INVITED') },
    { value: 'DISABLED', label: statusLabel('DISABLED') },
  ]
  const permissions = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data])
  const anyActionPending =
    disableMutation.isPending || enableMutation.isPending || resendMutation.isPending || deleteMutation.isPending

  const permissionNames = useMemo(
    () => new Map(permissions.map((permission) => [permission.code, permission.name])),
    [permissions],
  )

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<ShieldCheck />}
        title={t('employees.title')}
        description={t('employees.description')}
        search={{ value: search, placeholder: t('employees.searchPlaceholder'), onChange: (value) => { setSearch(value); setPage(1) } }}
        controls={<CustomSelect className="h-9 min-w-44" value={status} options={statusOptions} onValueChange={(value) => { setStatus(value as AdminEmployeeStatus | 'ALL'); setPage(1) }} />}
        actions={<><Button variant="outline" icon={<RefreshCcw />} onClick={() => void employeesQuery.refetch()}>{t('common.refresh')}</Button><Button icon={<UserPlus />} onClick={openCreateDialog}>{t('employees.add')}</Button></>}
      />


      <PaginatedDataTable<AdminEmployee>
        className="min-h-0 flex-1"
        rows={rows}
        loading={employeesQuery.isLoading || employeesQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('employees.summary', { count: totalCount })}
        emptyMessage={t('employees.empty')}
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
        columns={[
          { id: 'name', header: t('employees.employee'), renderCell: (row) => <div><p className="font-semibold">{row.firstName} {row.lastName ?? ''}</p><p className="text-xs text-muted-foreground">{row.countryCallingCode ?? ''} {row.phoneNumber}</p></div> },
          { id: 'status', header: t('employees.status'), renderCell: (row) => <Badge variant="outline" color={row.status === 'ACTIVE' ? 'emerald' : row.status === 'DISABLED' ? 'slate' : 'amber'}>{statusLabel(row.status)}</Badge> },
          { id: 'permissions', header: t('employees.permissions'), renderCell: (row) => <div className="flex max-w-md flex-wrap gap-1">{row.permissions.length ? row.permissions.map((code) => <Badge key={code} variant="outline">{permissionNames.get(code) ?? code}</Badge>) : <span className="text-xs text-muted-foreground">{t('employees.noPermissions')}</span>}</div> },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex w-full justify-end">
                <TableRowActionsMenu
                  row={row}
                  triggerAriaLabel={t('common.actions')}
                  actions={[
                    { key: 'edit', label: t('common.edit'), icon: <Pencil />, onClick: () => setEditing({ ...row }) },
                    row.status === 'DISABLED'
                      ? { key: 'enable', label: t('employees.enable'), icon: <UserRoundCheck />, disabled: anyActionPending, onClick: () => enableMutation.mutate(row.id) }
                      : { key: 'disable', label: t('employees.disable'), icon: <UserRoundX />, disabled: anyActionPending, onClick: () => disableMutation.mutate(row.id) },
                    ...(row.status === 'INVITED' ? [{ key: 'resend', label: t('employees.resendInvitation'), icon: <Send />, disabled: anyActionPending, onClick: () => resendMutation.mutate(row.id) }] : []),
                    { key: 'delete', label: t('common.delete'), icon: <Trash2 />, variant: 'destructive' as const, disabled: anyActionPending, confirm: { title: t('common.delete'), confirmLabel: t('common.delete'), cancelLabel: t('common.cancel') }, onClick: async () => { await deleteMutation.mutateAsync(row.id) } },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground"><KeyRound className="me-2 inline size-4" />{t('employees.tokenHint')}</div>

      <Sheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) setEditing(null)
        }}
      >
        <SheetContent className="max-w-3xl">
          <SheetHeader>
            <SheetTitle>{editing ? t('employees.editTitle', { name: `${editing.firstName} ${editing.lastName ?? ''}`.trim() }) : t('employees.editTitle', { name: '' })}</SheetTitle>
            <SheetDescription>{t('employees.editDescription')}</SheetDescription>
          </SheetHeader>
          {editing ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('employees.firstName')}>
                  <Input value={editing.firstName} onChange={(event) => setEditing({ ...editing, firstName: event.target.value })} />
                </FormField>
                <FormField label={t('employees.lastName')}>
                  <Input value={editing.lastName ?? ''} onChange={(event) => setEditing({ ...editing, lastName: event.target.value })} />
                </FormField>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{t('employees.permissions')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions.map((permission) => {
                    const checked = editing.permissions.includes(permission.code)
                    return (
                      <label key={permission.code} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${checked ? 'border-primary/35 bg-primary/[0.05]' : 'border-border bg-background hover:border-primary/20 hover:bg-muted/25'}`}>
                        <input className="mt-1 size-4 shrink-0 accent-primary" type="checkbox" checked={checked} onChange={() => togglePermission(permission.code, true)} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground">{permission.name}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{permission.description ?? permission.code}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <SheetFooter>
                <Button variant="outline" disabled={updateMutation.isPending} onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
                <Button
                  loading={updateMutation.isPending}
                  disabled={!editing.firstName.trim()}
                  onClick={() => updateMutation.mutate({ id: editing.id, firstName: editing.firstName.trim(), lastName: editing.lastName?.trim() ?? '', permissions: editing.permissions })}
                >
                  {t('common.save')}
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (open) setCreateDialogOpen(true)
          else closeCreateDialog()
        }}
      >
        <SheetContent className="max-w-5xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><UserPlus className="size-5 text-primary" />{t('employees.createTitle')}</SheetTitle>
            <SheetDescription>{t('employees.createDescription')}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label={t('employees.firstName')}><Input autoFocus value={form.firstName} onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))} /></FormField>
              <FormField label={t('employees.lastName')}><Input value={form.lastName ?? ''} onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))} /></FormField>
              <FormField label={t('employees.countryCode')}><Input value={form.countryCallingCode} onChange={(e) => setForm((c) => ({ ...c, countryCallingCode: e.target.value }))} /></FormField>
              <FormField label={t('employees.phone')}><Input inputMode="tel" value={form.phoneNumber} onChange={(e) => setForm((c) => ({ ...c, phoneNumber: e.target.value }))} /></FormField>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t('employees.permissions')}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {permissions.map((permission) => {
                  const checked = form.permissions.includes(permission.code)
                  return (
                    <label
                      key={permission.code}
                      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${checked ? 'border-primary/35 bg-primary/[0.05]' : 'border-border bg-background hover:border-primary/20 hover:bg-muted/25'}`}
                    >
                      <input className="mt-1 size-4 shrink-0 accent-primary" type="checkbox" checked={checked} onChange={() => togglePermission(permission.code)} />
                      <span className="min-w-0"><span className="block font-semibold text-foreground">{permission.name}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{permission.description ?? permission.code}</span></span>
                    </label>
                  )
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-medium">
              <input type="checkbox" className="size-4 accent-primary" checked={form.sendInvitation !== false} onChange={(e) => setForm((c) => ({ ...c, sendInvitation: e.target.checked }))} />
              {t('employees.sendInvitation')}
            </label>

            {formError ? <Alert variant="destructive"><AlertTitle>{formError}</AlertTitle></Alert> : null}
            {createMutation.isError ? <Alert variant="destructive"><AlertTitle>{t('employees.createError')}</AlertTitle></Alert> : null}
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={closeCreateDialog}>{t('common.cancel')}</Button>
            <Button type="button" loading={createMutation.isPending} icon={<UserPlus className="size-4" />} onClick={submitCreate}>{t('employees.add')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}
