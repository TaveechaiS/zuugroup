'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CustomerRequestsClient from './CustomerRequestsClient'
import { customerRequestsApi } from '@/lib/api/services'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminCustomerRequestsPage() {
  const { t } = useLanguage()
  const [requests, setRequests] = useState<any[]>([])
  useEffect(() => { customerRequestsApi.list().then(setRequests) }, [])
  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('cr.title')} />
      <CustomerRequestsClient requests={requests} />
    </div>
  )
}
