'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminDashboardClient from './DashboardClient'
import { dashboardApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminDashboardPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  useEffect(() => { dashboardApi.admin().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title={t('dashboard.title')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('dashboard.title_admin')} />
      <AdminDashboardClient stats={data.stats} />
    </div>
  )
}
