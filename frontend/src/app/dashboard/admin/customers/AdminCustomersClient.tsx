'use client'

import { useState } from 'react'
import { Plus, Search, Eye, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerFormClient from '@/components/shared/CustomerFormClient'
import { CustomerDetailModal } from '@/components/shared/CustomersViewClient'

interface Props { customers: any[]; onReload: () => void }

export default function AdminCustomersClient({ customers, onReload }: Props) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<any>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [sortKey, setSortKey] = useState<'company_name' | 'customer_code' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const router = useRouter()

  const toggleSort = (key: 'company_name' | 'customer_code') => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }
  const SortIcon = ({ k }: { k: 'company_name' | 'customer_code' }) => {
    if (sortKey !== k) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 inline" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-blue-500 ml-1 inline" />
      : <ChevronDown size={13} className="text-blue-500 ml-1 inline" />
  }

  const filtered = customers.filter((c) => {
    const haystack = [
      c.customer_code, c.company_name, c.contact_name, c.phone, c.email,
      c.address, c.drug_license_number, c.tax_id,
      c.zone?.code, c.zone?.name, c.zone?.province, c.zone?.region,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })
  const sorted = sortKey ? [...filtered].sort((a, b) => {
    const av = String(a[sortKey] ?? ''), bv = String(b[sortKey] ?? '')
    return sortDir === 'asc' ? av.localeCompare(bv, 'th') : bv.localeCompare(av, 'th')
  }) : filtered
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (showForm) {
    return (
      <div>
        <div className="p-6 pb-0">
          <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 hover:text-blue-600">← กลับ</button>
        </div>
        <CustomerFormClient mode="create" onDone={() => { setShowForm(false); onReload() }} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> เพิ่มลูกค้า</button>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('company_name')}>บริษัท<SortIcon k="company_name" /></th>
              <th className="text-left px-5 py-3">ผู้ติดต่อ</th>
              <th className="text-left px-5 py-3">โทรศัพท์</th>
              <th className="text-left px-5 py-3">อีเมล</th>
              <th className="text-left px-5 py-3">ที่อยู่</th>
              <th className="text-center px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((c) => (
              <tr key={c.id} onClick={() => setViewing(c)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-medium text-gray-900">{c.company_name}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.contact_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.phone ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{c.email ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">
                  <div className="max-w-[220px] truncate" title={c.address ?? ''}>{c.address ?? '-'}</div>
                </td>
                <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setViewing(c)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                      <Eye size={14} /> ดูรายละเอียด
                    </button>
                    <button onClick={() => router.push(`/dashboard/admin/customers/${c.id}`)} className="text-xs text-gray-500 hover:text-blue-600">แก้ไข</button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่พบลูกค้า</td></tr>}

          </tbody>
        </table></div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} จาก {sorted.length} รายการ</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} className="px-2">…</span>
                    : <button key={n} onClick={() => setPage(n as number)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${page === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                        {n}
                      </button>
                )}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
            </div>
          </div>
        )}
      </div>

      {viewing && <CustomerDetailModal customer={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
