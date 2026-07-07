'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, FileText, ShoppingCart } from 'lucide-react'
import { quotationsApi } from '@/lib/api/services'
import { buildQuotationHtml, generateQuotationPdf, type DocData } from '@/lib/pdf/documentPdf'
import PdfPreviewModal from '@/components/shared/PdfPreviewModal'
import { useLanguage } from '@/contexts/LanguageContext'

export default function QuotationApprovalClient({ quotation }: { quotation: any }) {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const STATUS_INFO: Record<string, { label: string; color: string }> = {
    draft: { label: t('doc.status.draft'), color: 'bg-gray-100 text-gray-700' },
    pending: { label: t('doc.status.pending'), color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: t('doc.status.approved'), color: 'bg-green-100 text-green-700' },
    ordered: { label: t('doc.status.ordered'), color: 'bg-purple-100 text-purple-700' },
    rejected: { label: t('doc.status.rejected_q'), color: 'bg-red-100 text-red-700' },
  }
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentStatus, setCurrentStatus] = useState(quotation.status)
  const [previewPdf, setPreviewPdf] = useState<{ html: string; filename: string; title: string; data: DocData } | null>(null)

  const openPdf = () => {
    const data: DocData = {
      number: quotation.quotation_number,
      createdAt: quotation.created_at,
      customer: {
        company_name: quotation.customer?.company_name ?? '-',
        address: quotation.customer?.address,
        contact_name: quotation.customer?.contact_name,
        phone: quotation.customer?.phone,
        email: quotation.customer?.email,
        tax_id: quotation.customer?.tax_id,
        drug_license_number: quotation.customer?.drug_license_number,
      },
      creator: quotation.creator,
      items: (quotation.items ?? []).map((it: any) => ({
        name: it.product?.name ?? '-',
        quantity: it.quantity,
        unit: it.product?.unit,
        unit_price: it.negotiated_price ?? it.unit_price,
        total_price: it.total_price,
        image_url: it.product?.image_url,
      })),
      subtotal: quotation.subtotal,
      vat_percent: quotation.vat_percent,
      vat_amount: quotation.vat_amount,
      include_vat: quotation.include_vat,
      discount_percent: quotation.discount_percent,
      discount_amount: quotation.discount_amount,
      other_label: quotation.other_label,
      other_amount: quotation.other_amount,
      total_amount: quotation.total_amount,
      notes: quotation.notes,
      contract_period_days: quotation.contract_period_days,
      show_tax_id: quotation.show_tax_id,
    }
    setPreviewPdf({
      html: buildQuotationHtml(data),
      filename: `${quotation.quotation_number}.pdf`,
      title: `${t('doc.quotation')} ${quotation.quotation_number}`,
      data,
    })
  }

  const approve = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await quotationsApi.approve(quotation.id)
      const newStatus = (res as any)?.data?.status ?? 'approved'
      setCurrentStatus(newStatus)
      setSuccess(t('doc.approve_ok'))
      setSaving(false)
    } catch (err: any) { setError(err.message || t('doc.approve_failed')); setSaving(false) }
  }

  const reject = async () => {
    if (!reason.trim()) { setError(t('doc.reason_required')); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await quotationsApi.reject(quotation.id, reason)
      setCurrentStatus('rejected')
      setSuccess(t('doc.reject_ok'))
      setTimeout(() => { window.location.href = '/dashboard/manager/quotations-pending' }, 800)
    } catch (err: any) { setError(err.message || t('doc.reject_failed')); setSaving(false) }
  }

  const statusInfo = STATUS_INFO[currentStatus] ?? { label: currentStatus, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('doc.quotation')} {quotation.quotation_number}</h2>
              <p className="text-sm text-gray-500 mt-1">{new Date(quotation.created_at).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={openPdf} className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium">
                <FileText size={14} /> {t('doc.view_download_pdf')}
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{t('doc.creator_full')}</p>
              <p className="font-medium text-gray-900">{quotation.creator?.first_name} {quotation.creator?.last_name}</p>
              <p className="text-xs text-gray-500">{quotation.creator?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{t('doc.customer')}</p>
              <p className="font-medium text-gray-900">{quotation.customer?.company_name}</p>
              <p className="text-xs text-gray-500">{t('doc.phone_short')} {quotation.customer?.phone ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-900">{t('doc.items_title')}</div>
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-center px-3 py-2.5 w-12">#</th>
                <th className="text-left px-5 py-2.5">{t('doc.col.product')}</th>
                <th className="text-right px-5 py-2.5">{t('doc.col.qty')}</th>
                <th className="text-right px-5 py-2.5">{t('doc.col.unit_price')}</th>
                <th className="text-right px-5 py-2.5">{t('doc.col.negotiated_price')}</th>
                <th className="text-right px-5 py-2.5">{t('doc.col.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(quotation.items ?? []).map((it: any, i: number) => (
                <tr key={it.id}>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs font-mono">{i + 1}</td>
                  <td className="px-5 py-3 text-gray-900">{it.product?.name}</td>
                  <td className="px-5 py-3 text-right">{it.quantity} {it.product?.unit ?? ''}</td>
                  <td className="px-5 py-3 text-right text-gray-600">฿{it.unit_price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-blue-600 font-medium">{it.negotiated_price ? `฿${it.negotiated_price.toLocaleString()}` : '-'}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{it.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">{t('doc.subtotal_total_noc')}</span><span>฿{quotation.subtotal?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('doc.vat_line_noc').replace('{pct}', String(quotation.vat_percent))}</span><span>฿{quotation.vat_amount?.toLocaleString()}</span></div>
              <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-gray-900"><span>{t('doc.grand_total_noc')}</span><span>฿{quotation.total_amount?.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        {quotation.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-2">{t('doc.notes_title')}</p>
            <p className="text-sm text-gray-600">{quotation.notes}</p>
          </div>
        )}

        {currentStatus !== 'pending' ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <p className="text-sm text-gray-600">{t('doc.current_status')} <span className="font-semibold">{statusInfo.label}</span></p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {currentStatus === 'approved' && (
                <button onClick={() => router.push(`/dashboard/manager/create-order?fromQuotation=${quotation.id}`)} className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                  <ShoppingCart size={15} /> {t('doc.convert_to_order')}
                </button>
              )}
              <button onClick={() => router.push('/dashboard/manager/quotations-pending')} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">{t('doc.back_to_list')}</button>
            </div>
          </div>
        ) : !showReject ? (
          <div className="flex gap-3 justify-end">
            <button onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
            <button onClick={() => setShowReject(true)} disabled={saving} className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 disabled:opacity-60"><X size={16} /> {t('doc.not_approve')}</button>
            <button onClick={approve} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"><Check size={16} /> {saving ? t('doc.saving_dots2') : t('doc.approve')}</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
            <p className="text-sm font-medium text-gray-900">{t('doc.reject_reason_deny')}</p>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" placeholder={t('doc.reason_placeholder')} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowReject(false)} className="px-4 py-2 text-sm text-gray-600">{t('common.cancel')}</button>
              <button onClick={reject} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? t('doc.saving_dots2') : t('doc.confirm_not_approve')}</button>
            </div>
          </div>
        )}
      </div>

      {previewPdf && (
        <PdfPreviewModal
          html={previewPdf.html}
          filename={previewPdf.filename}
          title={previewPdf.title}
          onClose={() => setPreviewPdf(null)}
          generatePdf={() => generateQuotationPdf(previewPdf.data)}
        />
      )}
    </div>
  )
}
