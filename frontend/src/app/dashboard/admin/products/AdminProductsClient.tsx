'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit2, Trash2, Upload, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

type SortKey = 'product_code' | 'quantity' | 'price_per_unit' | 'status'
type SortDir = 'asc' | 'desc'
import { productsApi } from '@/lib/api/services'

interface Props { products: any[]; categories: any[]; onReload: () => void }

export default function AdminProductsClient({ products, categories, onReload }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 inline" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-blue-500 ml-1 inline" />
      : <ChevronDown size={13} className="text-blue-500 ml-1 inline" />
  }
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', product_code: '',
    quantity: 0, price_per_unit: 0, cost_price: 0,
    category_id: '', unit: '', image_url: '', status: 'available',
    lot_number: '', manufacture_date: '', expiry_date: '',
  })

  const filtered = products.filter((p) => {
    const haystack = [
      p.product_code, p.name, p.unit, p.category?.name, p.lot_number,
      p.status === 'available' ? 'พร้อมขาย available' : 'ปิดการขาย unavailable ปิด',
      String(p.quantity ?? ''), String(p.price_per_unit ?? ''),
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  const sorted = sortKey ? [...filtered].sort((a, b) => {
    let av = a[sortKey] ?? ''
    let bv = b[sortKey] ?? ''
    if (sortKey === 'quantity' || sortKey === 'price_per_unit') {
      av = Number(av); bv = Number(bv)
      return sortDir === 'asc' ? av - bv : bv - av
    }
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv), 'th')
      : String(bv).localeCompare(String(av), 'th')
  }) : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const blankForm = {
    name: '', product_code: '',
    quantity: 0, price_per_unit: 0, cost_price: 0,
    category_id: '', unit: '', image_url: '', status: 'available',
    lot_number: '', manufacture_date: '', expiry_date: '',
  }
  const startAdd = () => { setEditing(null); setForm(blankForm); setShowForm(true); setError('') }
  const startEdit = (p: any) => {
    setEditing(p)
    setForm({
      name: p.name, product_code: p.product_code ?? '',
      quantity: p.quantity, price_per_unit: p.price_per_unit, cost_price: p.cost_price ?? 0,
      category_id: p.category_id ?? '', unit: p.unit ?? '', image_url: p.image_url ?? '', status: p.status,
      lot_number: p.lot_number ?? '', manufacture_date: p.manufacture_date ?? '', expiry_date: p.expiry_date ?? '',
    })
    setShowForm(true); setError('')
  }


  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { setError('ไฟล์ใหญ่เกิน 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => setForm((f) => ({ ...f, image_url: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      const body = { ...form, category_id: form.category_id || null, image_url: form.image_url || '' }
      if (editing) await productsApi.update(editing.id, body)
      else await productsApi.create(body)
      setShowForm(false); onReload()
    } catch (err: any) { setError(err.message) }
  }

  const remove = async (p: any) => {
    if (!confirm(`ลบสินค้า ${p.name}?`)) return
    await productsApi.remove(p.id); onReload()
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-gray-100">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="ค้นหา..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72" />
          </div>
          <button onClick={startAdd} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={14} /> เพิ่มสินค้า</button>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('product_code')}>รหัส<SortIcon k="product_code" /></th>
              <th className="text-left px-5 py-3">ชื่อสินค้า</th>
              <th className="text-left px-5 py-3">หมวดหมู่</th>
              <th className="text-right px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('quantity')}>คงเหลือ<SortIcon k="quantity" /></th>
              <th className="text-right px-5 py-3">ต้นทุน</th>
              <th className="text-right px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('price_per_unit')}>ราคาขาย<SortIcon k="price_per_unit" /></th>
              <th className="text-center px-5 py-3 cursor-pointer select-none hover:text-blue-600" onClick={() => toggleSort('status')}>สถานะ<SortIcon k="status" /></th>
              <th className="text-center px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-mono text-xs text-blue-700">{p.product_code ?? '-'}</td>
                <td className="px-5 py-3.5 font-medium text-gray-900 cursor-pointer" onClick={() => router.push(`/dashboard/admin/products/${p.id}`)}>{p.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{p.category?.name ?? '-'}</td>
                <td className={`px-5 py-3.5 text-right ${p.quantity < 10 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{p.quantity} {p.unit ?? ''}</td>
                <td className="px-5 py-3.5 text-right text-orange-700">฿{(p.cost_price ?? 0).toLocaleString()}</td>
                <td className="px-5 py-3.5 text-right text-gray-900">฿{p.price_per_unit.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'available' ? 'พร้อมขาย' : 'ปิด'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-blue-600 p-1.5"><Edit2 size={15} /></button>
                    <button onClick={() => remove(p)} className="text-gray-400 hover:text-red-600 p-1.5"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">ไม่พบสินค้า</td></tr>}
          </tbody>
        </table></div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ‹
              </button>
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
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
                  <input value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                    placeholder={editing ? '' : 'auto: PRD-0001'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                  <p className="text-xs text-gray-400 mt-0.5">ปล่อยว่างเพื่อ auto-gen</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย (เช่น กล่อง)</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนสินค้าคงเหลือ <span className="text-red-500">*</span></label>
                  <input required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  {editing && <p className="text-xs text-blue-500 mt-0.5">การเปลี่ยนจำนวนจะถูกบันทึกใน Stock Log</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เลขล็อต</label>
                  <input value={form.lot_number} onChange={(e) => setForm({ ...form, lot_number: e.target.value })}
                    placeholder="เช่น L240501"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันผลิต</label>
                  <input type="date" value={form.manufacture_date}
                    onChange={(e) => {
                      const mfg = e.target.value
                      // Auto-set expiry to mfg + 3 years (user can adjust afterward)
                      let expiry = form.expiry_date
                      if (mfg) {
                        const d = new Date(mfg)
                        if (!isNaN(d.getTime())) {
                          d.setFullYear(d.getFullYear() + 3)
                          const y = d.getFullYear()
                          const m = String(d.getMonth() + 1).padStart(2, '0')
                          const day = String(d.getDate()).padStart(2, '0')
                          expiry = `${y}-${m}-${day}`
                        }
                      }
                      setForm({ ...form, manufacture_date: mfg, expiry_date: expiry })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต้นทุน (บาท)</label>
                  <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                  <p className="text-xs text-orange-600 mt-0.5">เห็นได้แค่ Admin / CFO</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) <span className="text-red-500">*</span></label>
                  <input required type="number" step="0.01" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ไม่มีหมวด --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปสินค้า</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="hidden" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Upload size={14} /> อัพโหลดรูป
                  </button>
                  {form.image_url && (
                    <div className="relative">
                      <img src={form.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="available">พร้อมขาย</option>
                  <option value="unavailable">ปิดการขาย</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
