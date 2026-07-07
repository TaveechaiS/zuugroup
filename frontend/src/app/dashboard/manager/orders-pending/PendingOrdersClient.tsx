'use client'

import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PendingOrdersClient({ orders }: { orders: any[] }) {
  const { t, lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const filtered = orders.filter((o) => {
    const haystack = [
      o.order_number, o.customer?.company_name,
      o.creator?.first_name, o.creator?.last_name, o.creator?.email,
      String(o.total_amount ?? ''),
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={t('common.search')}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <p className="ml-auto text-sm text-gray-500">{filtered.length} {t('common.records')}</p>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('doc.number')}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('doc.customer')}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('doc.creator')}</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('doc.value')}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('doc.date')}</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((o) => (
              <tr key={o.id} onClick={() => (window.location.href = `/dashboard/manager/orders-pending/${o.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{o.order_number}</td>
                <td className="px-5 py-3.5 text-gray-900">{o.customer?.company_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{o.creator?.first_name} {o.creator?.last_name}</td>
                <td className="px-5 py-3.5 text-right text-gray-900 font-medium">฿{o.total_amount?.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                  <div>{new Date(o.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-5 py-3.5"><ChevronRight size={16} className="text-gray-400" /></td>
              </tr>
            ))}
            {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t('doc.no_orders_pending')}</td></tr>}
          </tbody>
        </table></div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>{t('common.showing')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {t('common.of')} {filtered.length} {t('common.records')}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1).reduce<(number | '...')[]>((acc, n, i, arr) => { if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...'); acc.push(n); return acc }, []).map((n, i) => n === '...' ? <span key={`e${i}`} className="px-2">…</span> : <button key={n} onClick={() => setPage(n as number)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${page === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>{n}</button>)}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
