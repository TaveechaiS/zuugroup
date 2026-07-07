'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileText } from 'lucide-react'
import { ordersApi, customersApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

interface PrefillItem { product_id: string; quantity: number; unit_price: number; product_name?: string }
interface Prefill {
  customerId: string
  sourceQuotationId: string
  quotationNumber?: string
  items: PrefillItem[]
}
interface Props { customers: any[]; products: any[]; prefill?: Prefill }
interface OrderItem { product_id: string; quantity: number; unit_price: number }

export default function CreateOrderClient({ customers, products, prefill }: Props) {
  const router = useRouter()
  const { t } = useLanguage()
  const sourceQuotationId = prefill?.sourceQuotationId
  const [customerId, setCustomerId] = useState(prefill?.customerId ?? '')
  const [items, setItems] = useState<OrderItem[]>(
    (prefill?.items ?? []).map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }))
  )
  const [customerPrices, setCustomerPrices] = useState<Record<string, number>>({})
  const [vatPercent, setVatPercent] = useState(7)
  const [includeVat, setIncludeVat] = useState(true)
  const [discountPct, setDiscountPct] = useState(0)
  const [discountAmt, setDiscountAmt] = useState(0)
  const [hasOther, setHasOther] = useState(false)
  const [otherLabel, setOtherLabel] = useState('')
  const [otherAmt, setOtherAmt] = useState(0)
  const [notes, setNotes] = useState('')
  const [showTaxId, setShowTaxId] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const quotedProductIds = useMemo(
    () => new Set((prefill?.items ?? []).map((i) => i.product_id)),
    [prefill],
  )
  const groupedProducts = useMemo(() => {
    if (!prefill || quotedProductIds.size === 0) return null
    return {
      quoted: products.filter((p) => quotedProductIds.has(p.id)),
      others: products.filter((p) => !quotedProductIds.has(p.id)),
    }
  }, [products, prefill, quotedProductIds])

  const productOption = (p: any) => (
    <option key={p.id} value={p.id}>{p.name} ({t('doc.stock_remaining')} {p.quantity} {p.unit ?? ''})</option>
  )

  useEffect(() => {
    if (!customerId) { setCustomerPrices({}); return }
    customersApi.prices(customerId).then((data) => {
      const map = (data ?? []).reduce((acc: any, r: any) => ({ ...acc, [r.product_id]: r.custom_price }), {})
      setCustomerPrices(map)
    })
  }, [customerId])

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.unit_price * it.quantity, 0), [items])
  const totalDiscount = useMemo(() => +(((subtotal * discountPct) / 100) + discountAmt).toFixed(2), [subtotal, discountPct, discountAmt])
  const afterDiscount = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount])
  const vatAmount = useMemo(() => includeVat ? +(afterDiscount * vatPercent / 100).toFixed(2) : 0, [afterDiscount, vatPercent, includeVat])
  const other = useMemo(() => hasOther ? otherAmt : 0, [hasOther, otherAmt])
  const total = useMemo(() => +(afterDiscount + vatAmount + other).toFixed(2), [afterDiscount, vatAmount, other])

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    if (field === 'product_id') {
      const dup = newItems.findIndex((it, i) => i !== idx && it.product_id === value && value)
      if (dup !== -1) {
        alert(t('doc.duplicate_product'))
        return
      }
      const product = products.find((p) => p.id === value)
      if (product) newItems[idx].unit_price = customerPrices[value] ?? product.price_per_unit
    }
    setItems(newItems)
  }

  const insufficientItems = items
    .map((it, idx) => {
      const p = products.find((pp) => pp.id === it.product_id)
      return p && it.quantity > p.quantity
        ? { idx, name: p.name, requested: it.quantity, available: p.quantity, unit: p.unit ?? '' }
        : null
    })
    .filter(Boolean) as Array<{ idx: number; name: string; requested: number; available: number; unit: string }>
  const hasInsufficient = insufficientItems.length > 0

  const handleSubmit = async (asDraft: boolean = false) => {
    setError('')
    if (!customerId) { setError(t('doc.select_customer_err')); return }
    if (items.length === 0) { setError(t('doc.select_item_err')); return }
    if (items.some((i) => !i.product_id)) { setError(t('doc.select_product_err')); return }
    if (!asDraft && hasInsufficient) {
      setError(t('doc.insufficient_submit_err'))
      return
    }

    setSaving(true)
    try {
      await ordersApi.create({
        customer_id: customerId,
        items,
        vat_percent: vatPercent,
        include_vat: includeVat,
        discount_percent: discountPct,
        discount_amount: discountAmt,
        other_label: hasOther ? otherLabel || null : null,
        other_amount: hasOther ? otherAmt : 0,
        show_tax_id: showTaxId,
        source_quotation_id: sourceQuotationId ?? null,
        notes: notes || undefined,
        status: asDraft ? 'draft' : 'pending_review',
      })
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

        {prefill && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText size={16} className="text-indigo-600 shrink-0" />
              <p className="text-sm font-semibold text-indigo-900">
                {t('doc.from_quotation_title').replace('{number}', prefill.quotationNumber ? ` ${prefill.quotationNumber}` : '')}
              </p>
            </div>
            <p className="text-xs text-indigo-700 mb-2">
              {t('doc.from_quotation_hint')}
            </p>
            <p className="text-xs text-indigo-800 bg-indigo-100 rounded-md px-2.5 py-1.5 mb-3">
              {t('doc.from_quotation_skip')}
            </p>
            <div className="space-y-1 bg-white/60 rounded-lg p-3">
              {prefill.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-800">{it.product_name ?? '-'}</span>
                  <span className="text-gray-500 shrink-0">{it.quantity} × ฿{it.unit_price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('doc.order_info')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.customer_required')}</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('doc.select_customer')}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              {customerId && Object.keys(customerPrices).length > 0 && (
                <p className="text-xs text-blue-600 mt-1.5">
                  {t('doc.custom_price_note').replace('{count}', String(Object.keys(customerPrices).length))}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.date_label')}</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t('doc.items_title')}</h3>
            <button onClick={addItem} disabled={!customerId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition">
              <Plus size={14} /> {t('doc.add_product')}
            </button>
          </div>

          <div className="space-y-3">
            {!customerId && <p className="text-center text-gray-400 text-sm py-6">{t('doc.select_customer_first')}</p>}
            {items.map((item, idx) => {
              const product = products.find((p) => p.id === item.product_id)
              const hasCustomPrice = item.product_id && customerPrices[item.product_id] !== undefined
              const insufficient = product && item.quantity > product.quantity
              return (
                <div key={idx} className={`rounded-xl p-3 ${insufficient ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                      className="col-span-5 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">{t('doc.select_product')}</option>
                      {groupedProducts ? (
                        <>
                          <optgroup label={t('doc.products_from_quote')}>{groupedProducts.quoted.map(productOption)}</optgroup>
                          <optgroup label={t('doc.products_others')}>{groupedProducts.others.map(productOption)}</optgroup>
                        </>
                      ) : (
                        products.map(productOption)
                      )}
                    </select>
                    <input type="number" min="1" value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className={`col-span-2 px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 bg-white ${insufficient ? 'border-red-400 focus:ring-red-500 text-red-700 font-semibold' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder={t('doc.qty_placeholder')} />
                    <div className="col-span-2 px-2 py-1.5 text-sm text-gray-700">
                      ฿{item.unit_price.toLocaleString()}{hasCustomPrice && <span className="ml-1 text-xs text-green-600">✓</span>}
                    </div>
                    <div className="col-span-2 text-right text-sm text-gray-900 font-medium">฿{(item.unit_price * item.quantity).toLocaleString()}</div>
                    <button onClick={() => removeItem(idx)}
                      className="col-span-1 text-red-500 hover:bg-red-100 rounded-lg p-1.5 flex items-center justify-center transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {insufficient && (
                    <p className="text-xs text-red-700 mt-1.5 ml-1">
                      {t('doc.insufficient_row').replace('{available}', String(product!.quantity)).replace(/\{unit\}/g, product!.unit ?? '').replace('{requested}', String(item.quantity))}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="space-y-3">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('doc.notes_optional')}</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1.5 max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-gray-600"><span>{t('doc.subtotal_before_adj')}</span><span>฿{subtotal.toLocaleString()}</span></div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-red-600"><span>{t('doc.discount')}</span><span>-฿{totalDiscount.toLocaleString()}</span></div>
            )}
            {includeVat && (
              <div className="flex justify-between text-gray-600"><span>{t('doc.vat_line_noc').replace('{pct}', String(vatPercent))}</span><span>฿{vatAmount.toLocaleString()}</span></div>
            )}
            {hasOther && otherAmt > 0 && (
              <div className="flex justify-between text-gray-600"><span>{otherLabel || t('doc.other_misc')}</span><span>฿{other.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
              <span>{t('doc.grand_total_noc')}</span><span>฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {hasInsufficient && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-2">{t('doc.insufficient_title').replace('{count}', String(insufficientItems.length))}</p>
            <ul className="space-y-1 ml-5 list-disc">
              {insufficientItems.map((it) => (
                <li key={it.idx}>
                  {t('doc.insufficient_line').replace('{name}', it.name).replace('{requested}', String(it.requested)).replace(/\{unit\}/g, it.unit).replace('{available}', String(it.available))}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">{t('doc.insufficient_hint')}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-end">
          <button onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button onClick={() => handleSubmit(true)} disabled={saving}
            className="px-5 py-2.5 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-60">
            {saving ? t('doc.saving_ellipsis') : t('doc.save_draft')}
          </button>
          <button onClick={() => handleSubmit(false)} disabled={saving || hasInsufficient}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            title={hasInsufficient ? t('doc.insufficient_disabled_title') : undefined}>
            {saving ? t('doc.saving_ellipsis') : t('doc.submit_order')}
          </button>
        </div>
      </div>
    </div>
  )
}
