'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminReportsClient from './AdminReportsClient'
import { reportsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminReportsPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  useEffect(() => { reportsApi.admin().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title={t('reports.title')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('reports.title')} />
      <AdminReportsClient orders={data.orders ?? []} products={data.products ?? []} customers={data.customers ?? []} orderItems={data.orderItems ?? []} />
    </div>
  )
}
