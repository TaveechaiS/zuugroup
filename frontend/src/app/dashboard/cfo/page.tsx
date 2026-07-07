'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CFODashboardClient from './DashboardClient'
import { dashboardApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CFODashboardPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  useEffect(() => { dashboardApi.cfo().then(setData) }, [])
  if (!data) return <div className="flex flex-col h-full"><TopBar title={t('dashboard.title')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('dashboard.title_cfo')} />
      <CFODashboardClient stats={data.stats} topProducts={data.topProducts} topCustomers={data.topCustomers} monthlyData={data.monthlyData} teams={data.teams} />
    </div>
  )
}
