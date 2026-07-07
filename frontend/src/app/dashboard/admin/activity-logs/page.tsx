'use client'

import { useEffect, useMemo, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { activityLogsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

const ACTION_KEYS: Record<string, string> = {
  login: 'logs.action.login',
  logout: 'logs.action.logout',
  'user.create': 'logs.action.user_create',
  'user.update': 'logs.action.user_update',
  'user.update+password': 'logs.action.user_update_password',
  'user.deactivate': 'logs.action.user_deactivate',
  'team.create': 'logs.action.team_create',
  'team.update': 'logs.action.team_update',
  'team.delete': 'logs.action.team_delete',
  'product.create': 'logs.action.product_create',
  'product.update': 'logs.action.product_update',
  'product.delete': 'logs.action.product_delete',
  'customer.create': 'logs.action.customer_create',
  'customer.update': 'logs.action.customer_update',
  'customer.delete': 'logs.action.customer_delete',
  'customer_request.create': 'logs.action.customer_request_create',
  'customer_request.approve': 'logs.action.customer_request_approve',
  'customer_request.reject': 'logs.action.customer_request_reject',
  'quotation.create.draft': 'logs.action.quotation_create_draft',
  'quotation.create.pending': 'logs.action.quotation_create_pending',
  'quotation.create.approved': 'logs.action.quotation_create_approved',
  'quotation.create+auto_approve': 'logs.action.quotation_create_auto',
  'quotation.update': 'logs.action.quotation_update',
  'quotation.approve': 'logs.action.quotation_approve',
  'quotation.reject': 'logs.action.quotation_reject',
  'order.create': 'logs.action.order_create',
  'order.create+auto_approve': 'logs.action.order_create_auto',
  'order.review_pass': 'logs.action.order_review_pass',
  'order.review_reject': 'logs.action.order_review_reject',
  'order.confirm': 'logs.action.order_confirm',
  'order.cancel': 'logs.action.order_cancel',
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-50 text-blue-700',
  logout: 'bg-gray-100 text-gray-600',
  'user.create': 'bg-emerald-50 text-emerald-700',
  'user.update': 'bg-yellow-50 text-yellow-700',
  'user.update+password': 'bg-yellow-50 text-yellow-700',
  'user.deactivate': 'bg-red-50 text-red-700',
  'team.create': 'bg-emerald-50 text-emerald-700',
  'team.update': 'bg-yellow-50 text-yellow-700',
  'team.delete': 'bg-red-50 text-red-700',
  'product.create': 'bg-emerald-50 text-emerald-700',
  'product.update': 'bg-yellow-50 text-yellow-700',
  'product.delete': 'bg-red-50 text-red-700',
  'customer.create': 'bg-emerald-50 text-emerald-700',
  'customer.update': 'bg-yellow-50 text-yellow-700',
  'customer.delete': 'bg-red-50 text-red-700',
  'customer_request.create': 'bg-blue-50 text-blue-700',
  'customer_request.approve': 'bg-green-50 text-green-700',
  'customer_request.reject': 'bg-red-50 text-red-700',
  'quotation.create.draft': 'bg-gray-100 text-gray-700',
  'quotation.create.pending': 'bg-blue-50 text-blue-700',
  'quotation.create.approved': 'bg-blue-50 text-blue-700',
  'quotation.create+auto_approve': 'bg-green-50 text-green-700',
  'quotation.update': 'bg-yellow-50 text-yellow-700',
  'quotation.approve': 'bg-green-50 text-green-700',
  'quotation.reject': 'bg-red-50 text-red-700',
  'order.create': 'bg-blue-50 text-blue-700',
  'order.create+auto_approve': 'bg-green-50 text-green-700',
  'order.review_pass': 'bg-green-50 text-green-700',
  'order.review_reject': 'bg-red-50 text-red-700',
  'order.confirm': 'bg-emerald-50 text-emerald-700',
  'order.cancel': 'bg-red-50 text-red-700',
}

export default function ActivityLogsPage() {
  const { t, lang } = useLanguage()
  const ROLE_LABELS: Record<string, string> = { admin: t('role.short.admin'), manager: t('role.short.manager'), sales: t('role.short.sales'), cfo: t('role.short.cfo') }
  const actionInfo = (action: string) => ({
    label: ACTION_KEYS[action] ? t(ACTION_KEYS[action]) : action,
    color: ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-700',
  })

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [sortKey, setSortKey] = useState<'created_at' | 'user' | 'action' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: 'created_at' | 'user' | 'action') => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }
  const SortIcon = ({ k }: { k: 'created_at' | 'user' | 'action' }) => {
    if (sortKey !== k) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 inline" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-blue-500 ml-1 inline" />
      : <ChevronDown size={13} className="text-blue-500 ml-1 inline" />
  }

  useEffect(() => {
    activityLogsApi.list().then((d) => setLogs(d ?? [])).finally(() => setLoading(false))
  }, [])

  const uniqueActions = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => set.add(l.action))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => logs
    .filter((l) => actionFilter === 'all' || l.action === actionFilter)
    .filter((l) => {
      const haystack = [
        l.user?.first_name, l.user?.last_name,
        ROLE_LABELS[l.user?.role], l.user?.role,
        actionInfo(l.action).label, l.action,
        l.description, l.entity_type,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    }), [logs, search, actionFilter, lang])
  const sorted = sortKey ? [...filtered].sort((a, b) => {
    if (sortKey === 'created_at') {
      const av = new Date(a.created_at).getTime(), bv = new Date(b.created_at).getTime()
      return sortDir === 'asc' ? av - bv : bv - av
    }
    if (sortKey === 'user') {
      const av = `${a.user?.first_name ?? ''} ${a.user?.last_name ?? ''}`.trim()
      const bv = `${b.user?.first_name ?? ''} ${b.user?.last_name ?? ''}`.trim()
      return sortDir === 'asc' ? av.localeCompare(bv, lang) : bv.localeCompare(av, lang)
    }
    const av = String(a.action ?? ''), bv = String(b.action ?? '')
    return sortDir === 'asc' ? av.localeCompare(bv, lang) : bv.localeCompare(av, lang)
  }) : filtered
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('logs.title')} />
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
            <div className="relative w-full sm:w-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={t('common.search')}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
            </div>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">{t('logs.all_actions')}</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{actionInfo(a).label}</option>)}
            </select>
            <p className="ml-auto text-sm text-gray-500">{filtered.length} {t('common.records')}</p>
          </div>

          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('created_at')}>{t('logs.col.time')}<SortIcon k="created_at" /></th>
                <th className="text-left px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('user')}>{t('logs.col.user')}<SortIcon k="user" /></th>
                <th className="text-left px-5 py-3">{t('logs.col.role')}</th>
                <th className="text-left px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('action')}>{t('logs.col.action')}<SortIcon k="action" /></th>
                <th className="text-left px-5 py-3">{t('logs.col.detail')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">{t('common.loading')}</td></tr>}
              {!loading && paginated.map((log) => {
                const info = actionInfo(log.action)
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">
                      <div>{new Date(log.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-gray-400">{new Date(log.created_at).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-900">
                      {log.user ? `${log.user.first_name} ${log.user.last_name}` : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{ROLE_LABELS[log.user?.role] ?? '-'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-xs ${info.color}`}>{info.label}</span></td>
                    <td className="px-5 py-3 text-gray-700 text-xs">{log.description ?? '-'}</td>
                  </tr>
                )
              })}
              {!loading && paginated.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">{t('logs.no_logs')}</td></tr>}
            </tbody>
          </table></div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
              <span>{t('common.showing')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} {t('common.of')} {sorted.length} {t('common.records')}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1).reduce<(number | '...')[]>((acc, n, i, arr) => { if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...'); acc.push(n); return acc }, []).map((n, i) => n === '...' ? <span key={`e${i}`} className="px-2">…</span> : <button key={n} onClick={() => setPage(n as number)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${page === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>{n}</button>)}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
