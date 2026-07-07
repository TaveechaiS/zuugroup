'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import TeamsClient from './TeamsClient'
import { teamsApi, usersApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminTeamsPage() {
  const { t } = useLanguage()
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const reload = () => Promise.all([teamsApi.list(), usersApi.list()]).then(([tm, u]) => { setTeams(tm ?? []); setUsers(u ?? []) })
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('teams.title')} />
      <TeamsClient teams={teams} allUsers={users} onReload={reload} />
    </div>
  )
}
