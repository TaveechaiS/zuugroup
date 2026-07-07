'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import ManagerDashboardClient from './DashboardClient'
import { dashboardApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ManagerDashboardPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasTeam, setHasTeam] = useState(true)

  useEffect(() => {
    dashboardApi.manager().then((data) => {
      if (!data) setHasTeam(false)
      else setStats(data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex flex-col h-full"><TopBar title={t('dashboard.title')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  if (!hasTeam) return (
    <div className="flex flex-col h-full"><TopBar title={t('dashboard.title')} />
      <div className="p-4 sm:p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          {t('dashboard.no_team')}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('dashboard.title_manager')} />
      <ManagerDashboardClient stats={stats} />
    </div>
  )
}
