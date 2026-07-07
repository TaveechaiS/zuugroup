'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ManagerReportsClient from './ManagerReportsClient'
import { reportsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ManagerReportsPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  useEffect(() => { reportsApi.manager().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title={t('reports.title_team')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('reports.title_team')} />
      <ManagerReportsClient quotations={data.quotations ?? []} orders={data.orders ?? []} teamMembers={data.teamMembers ?? []} />
    </div>
  )
}
