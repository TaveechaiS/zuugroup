'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import UserDetailClient from './UserDetailClient'
import { usersApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  useEffect(() => { usersApi.get(params.id).then(setUser).catch(() => setUser(null)) }, [params.id])
  if (!user) return <div className="flex flex-col h-full"><TopBar title={t('users.title_detail')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={`${user.first_name} ${user.last_name}`} />
      <UserDetailClient user={user} />
    </div>
  )
}
