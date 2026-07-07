'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import DocumentsClient from './DocumentsClient'
import { quotationsApi, ordersApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SalesPage() {
  const { t } = useLanguage()
  const [quotations, setQuotations] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([quotationsApi.list({ scope: 'my' }), ordersApi.list({ scope: 'my' })])
      .then(([q, o]) => { setQuotations(q ?? []); setOrders(o ?? []) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('sidebar.my_documents')} />
      {loading ? <div className="p-6 text-gray-400 text-sm">{t('common.loading')}</div> :
        <DocumentsClient quotations={quotations} orders={orders} />}
    </div>
  )
}
