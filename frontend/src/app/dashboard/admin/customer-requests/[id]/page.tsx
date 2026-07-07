'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import RequestDetailClient from './RequestDetailClient'
import { customerRequestsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage()
  const [request, setRequest] = useState<any>(null)
  useEffect(() => { customerRequestsApi.get(params.id).then(setRequest).catch(() => setRequest(null)) }, [params.id])
  if (!request) return <div className="flex flex-col h-full"><TopBar title={t('cr.title')} /><div className="p-6 text-gray-400">{t('common.loading')}</div></div>
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('cr.title_review')} />
      <RequestDetailClient request={request} />
    </div>
  )
}
