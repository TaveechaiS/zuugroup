'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { quotationsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props { customers: any[]; products: any[]; initial?: any }

interface LineItem {
  product_id: string
  quantity: number
  unit_price: number
  negotiated_price?: number
}

export default function CreateQuotationClient({ customers, products, initial }: Props) {
  const router = useRouter()
  const { t } = useLanguage()

  const [customerId, setCustomerId] = useState(initial?.customer_id ?? '')
  const [vatPercent, setVatPercent] = useState(initial?.vat_percent ?? 7)
  const [includeVat, setIncludeVat] = useState<boolean>(initial?.include_vat ?? true)
  const [discountPct, setDiscountPct] = useState<number>(initial?.discount_percent ?? 0)
  const [discountAmt, setDiscountAmt] = useState<number>(initial?.discount_amount ?? 0)
  const [otherLabel, setOtherLabel] = useState<string>(initial?.other_label ?? '')
  const [otherAmt, setOtherAmt] = useState<number>(initial?.other_amount ?? 0)
  const [hasOther, setHasOther] = useState<boolean>(!!(initial?.other_label || initial?.other_amount))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [contractDays, setContractDays] = useState(initial?.contract_period_days ?? 30)
  const [showTaxId, setShowTaxId] = useState<boolean>(initial?.show_tax_id ?? true)
  const [items, setItems] = useState<LineItem[]>(
    (initial?.items ?? []).map((it: any) => ({
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      negotiated_price: it.negotiated_price != null ? Number(it.negotiated_price) : undefined,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.negotiated_price ?? item.unit_price
      return sum + price * item.quantity
    }, 0)
    const discountByPct = (subtotal * discountPct) / 100
    const totalDiscount = discountByPct + discountAmt
    const afterDiscount = Math.max(0, subtotal - totalDiscount)
    const vat = includeVat ? (afterDiscount * vatPercent) / 100 : 0
    const other = hasOther ? otherAmt : 0
    return { subtotal, totalDiscount, afterDiscount, vat, other, total: afterDiscount + vat + other }
  }, [items, vatPercent, includeVat, discountPct, discountAmt, hasOther, otherAmt])

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    if (field === 'product_id') {
      const dup = newItems.findIndex((it, i) => i !== idx && it.product_id === value && value)
      if (dup !== -1) {
        alert(t('doc.duplicate_product'))
        return
      }
      const product = products.find((p) => p.id === value)
      if (product) newItems[idx].unit_price = product.price_per_unit
    }
    setItems(newItems)
  }

  const handleSubmit = async (asDraft: boolean) => {
    setError('')
    if (!customerId) { setError(t('doc.select_customer_err')); return }
    if (items.length === 0) { setError(t('doc.select_item_err')); return }
    if (items.some((i) => !i.product_id)) { setError(t('doc.select_product_err')); return }

    setSaving(true)
    try {
      const body = {
        customer_id: customerId,
        vat_percent: vatPercent,
        include_vat: includeVat,
        discount_percent: discountPct,
        discount_amount: discountAmt,
        other_label: hasOther ? otherLabel || null : null,
        other_amount: hasOther ? otherAmt : 0,
        notes,
        contract_period_days: contractDays,
        show_tax_id: showTaxId,
        status: asDraft ? 'draft' : 'pending',
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          negotiated_price: i.negotiated_price ?? null,
        })),
      }
      if (initial?.id) {
        await quotationsApi.update(initial.id, body)
      } else {
        await quotationsApi.create(body)
      }
      router.push('/dashboard/sales')
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('doc.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('doc.general_info')} {initial?.id && <span className="text-xs text-blue-600 font-normal">{t('doc.editing_draft')}</span>}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.customer_required')}</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('doc.select_customer')}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.date_label')}</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {selectedCustomer && (
            <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{selectedCustomer.company_name}</p>
              <p className="text-gray-600">{t('doc.contact_name')} {selectedCustomer.contact_name ?? '-'}</p>
              <p className="text-gray-600">{t('doc.address_label')} {selectedCustomer.address ?? '-'}</p>
              <p className="text-gray-600">{t('doc.phone_short')} {selectedCustomer.phone ?? '-'} | {t('doc.email_label')} {selectedCustomer.email ?? '-'}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t('doc.items_title')}</h3>
            <button onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              <Plus size={14} /> {t('doc.add_product')}
            </button>
          </div>

          <div className="space-y-3">
            {items.length === 0 && <p className="text-center text-gray-400 text-sm py-6">{t('doc.no_quotations_yet')}</p>}
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                  className="col-span-5 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t('doc.select_product')}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                  className="col-span-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder={t('doc.qty_placeholder')} />
                <input type="number" value={item.unit_price} disabled
                  className="col-span-2 px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none" placeholder={t('doc.col.unit_price_short')} />
                <input type="number" value={item.negotiated_price ?? ''}
                  onChange={(e) => updateItem(idx, 'negotiated_price', e.target.value ? Number(e.target.value) : undefined)}
                  className="col-span-2 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder={t('doc.col.negotiated_price')} />
                <div className="col-span-1 text-right text-sm text-gray-700 font-medium">
                  ฿{((item.negotiated_price ?? item.unit_price) * item.quantity).toLocaleString()}
                </div>
                <button onClick={() => removeItem(idx)}
                  className="col-span-1 text-red-500 hover:bg-red-50 rounded-lg p-1.5 flex items-center justify-center transition">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('doc.notes_optional')}</h3>
          <div className="space-y-3 mb-4">
            <div>
              <label
                className={`flex items-center gap-2 text-sm ${selectedCustomer?.tax_id ? '' : 'cursor-help'}`}
                title={
                  selectedCustomer?.tax_id
                    ? undefined
                    : customerId
                      ? t('doc.no_tax_id_hint')
                      : t('doc.select_customer_hint')
                }
              >
                <input
                  type="checkbox"
                  checked={showTaxId && !!selectedCustomer?.tax_id}
                  disabled={!selectedCustomer?.tax_id}
                  onChange={(e) => setShowTaxId(e.target.checked)}
                  className="rounded text-blue-600 disabled:opacity-50"
                />
                <span className={selectedCustomer?.tax_id ? 'text-gray-700' : 'text-gray-400'}>
                  {t('doc.show_tax_id')}
                </span>
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm border-t border-gray-100 pt-3">
              <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} className="rounded text-blue-600" />
              <span className="text-gray-700">{t('doc.include_vat')}</span>
              {includeVat && (
                <>
                  <span className="text-gray-400 mx-2">|</span>
                  <input type="number" min="0" max="100" step="0.1" value={vatPercent} onChange={(e) => setVatPercent(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-500 text-xs">%</span>
                </>
              )}
            </label>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('doc.discount_title')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('doc.discount_pct')}</label>
                  <input type="number" min="0" max="100" step="0.1" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('doc.discount_amt')}</label>
                  <input type="number" min="0" step="0.01" value={discountAmt} onChange={(e) => setDiscountAmt(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <label className="flex items-center gap-2 text-sm mb-2">
                <input type="checkbox" checked={hasOther} onChange={(e) => setHasOther(e.target.checked)} className="rounded text-blue-600" />
                <span className="text-gray-700">{t('doc.other_expenses')}</span>
              </label>
              {hasOther && (
                <div className="grid grid-cols-2 gap-3">
                  <input value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} placeholder={t('doc.item_name_placeholder')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="number" step="0.01" value={otherAmt} onChange={(e) => setOtherAmt(Number(e.target.value))} placeholder="0.00"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.contract_days')}</label>
              <input type="number" value={contractDays} onChange={(e) => setContractDays(Number(e.target.value))}
                className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">{t('doc.subtotal_before_adj')}</span>
              <span>฿{totals.subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-red-600"><span>{t('doc.discount')}</span>
                <span>-฿{totals.totalDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            )}
            {includeVat && (
              <div className="flex justify-between"><span className="text-gray-600">{t('doc.vat_line_noc').replace('{pct}', String(vatPercent))}</span>
                <span>฿{totals.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            )}
            {hasOther && otherAmt > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">{otherLabel || t('doc.other_misc')}</span>
                <span>฿{totals.other.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>{t('doc.grand_total_noc')}</span>
              <span>฿{totals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button onClick={() => handleSubmit(true)} disabled={saving}
            className="px-5 py-2.5 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-60">{t('doc.save_draft')}</button>
          <button onClick={() => handleSubmit(false)} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? t('doc.saving_dots2') : t('doc.submit_for_approval')}
          </button>
        </div>
      </div>
    </div>
  )
}
