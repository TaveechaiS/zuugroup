'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const STATUS: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'รอยืนยันการขาย', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' },
  rejected: { label: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700' },
}

export default function AdminOrdersClient({ orders }: { orders: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [sortKey, setSortKey] = useState<'total_amount' | 'created_at' | 'status' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const router = useRouter()

  const toggleSort = (key: 'total_amount' | 'created_at' | 'status') => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }
  const SortIcon = ({ k }: { k: 'total_amount' | 'created_at' | 'status' }) => {
    if (sortKey !== k) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 inline" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-blue-500 ml-1 inline" />
      : <ChevronDown size={13} className="text-blue-500 ml-1 inline" />
  }

  const filtered = orders
    .filter((o) => statusFilter === 'all' || o.status === statusFilter)
    .filter((o) => {
      const haystack = [
        o.order_number, o.customer?.company_name,
        o.creator?.first_name, o.creator?.last_name,
        STATUS[o.status]?.label, o.status,
        String(o.total_amount ?? ''),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  const sorted = sortKey ? [...filtered].sort((a, b) => {
    if (sortKey === 'total_amount') {
      const av = Number(a.total_amount ?? 0), bv = Number(b.total_amount ?? 0)
      return sortDir === 'asc' ? av - bv : bv - av
    }
    if (sortKey === 'created_at') {
      const av = new Date(a.created_at).getTime(), bv = new Date(b.created_at).getTime()
      return sortDir === 'asc' ? av - bv : bv - av
    }
    const av = String(a[sortKey] ?? ''), bv = String(b[sortKey] ?? '')
    return sortDir === 'asc' ? av.localeCompare(bv, 'th') : bv.localeCompare(av, 'th')
  }) : filtered
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending_review">รอตรวจสอบ</option>
            <option value="processing">กำลังดำเนินการ</option>
            <option value="completed">สำเร็จ</option>
            <option value="rejected">ไม่ผ่าน</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <p className="ml-auto text-sm text-gray-500">{filtered.length} รายการ</p>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3">เลขที่</th>
              <th className="text-left px-5 py-3">ลูกค้า</th>
              <th className="text-left px-5 py-3">ผู้สร้าง</th>
              <th className="text-right px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('total_amount')}>มูลค่า<SortIcon k="total_amount" /></th>
              <th className="text-center px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('status')}>สถานะ<SortIcon k="status" /></th>
              <th className="text-left px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('created_at')}>วันที่<SortIcon k="created_at" /></th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((o) => (
              <tr key={o.id} onClick={() => router.push(`/dashboard/admin/orders/${o.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{o.order_number}</td>
                <td className="px-5 py-3.5 text-gray-900">{o.customer?.company_name ?? '-'}</td>
                <td className="px-5 py-3.5 text-gray-600">{o.creator?.first_name} {o.creator?.last_name}</td>
                <td className="px-5 py-3.5 text-right text-gray-900 font-medium">฿{o.total_amount?.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS[o.status]?.color}`}>{STATUS[o.status]?.label ?? o.status}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                  <div>{new Date(o.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-5 py-3.5"><ChevronRight size={16} className="text-gray-400" /></td>
              </tr>
            ))}
            {paginated.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">ไม่พบคำสั่งซื้อ</td></tr>}
          </tbody>
        </table></div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} จาก {sorted.length} รายการ</span>
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
