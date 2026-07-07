'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import UsersClient from './UsersClient'
import { usersApi, teamsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const reload = () => {
    Promise.all([usersApi.list(), teamsApi.list()])
      .then(([u, tm]) => { setUsers(u ?? []); setTeams(tm ?? []) })
  }
  useEffect(() => { reload() }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('users.title')} />
      <UsersClient users={users} teams={teams} onReload={reload} />
    </div>
  )
}
