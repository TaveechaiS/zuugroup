'use client'

import { useEffect, useMemo, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AdminReportsClient from '@/app/dashboard/admin/reports/AdminReportsClient'
import { reportsAdminApi, teamsApi, zonesApi } from '@/lib/api/services'
import { Calendar, Filter, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

type Quick = 'today' | 'week' | 'month' | 'year' | 'all'

function fmtDateLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CFOReportsPage() {
  const { t } = useLanguage()
  const STATUS_LABEL: Record<string, string> = {
    pending_review: t('doc.status.pending_review'),
    processing: t('status.processing'),
    completed: t('status.completed'),
    cancelled: t('status.cancelled'),
    rejected: t('status.rejected'),
  }
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(true)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [province, setProvince] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    zonesApi.list().then(setZones).catch(() => {})
    teamsApi.list().then(setTeams).catch(() => {})
  }, [])

  const provinces = useMemo(() => Array.from(new Set(zones.map((z) => z.province).filter(Boolean))).sort(), [zones])
  const regions = useMemo(() => Array.from(new Set(zones.map((z) => z.region).filter(Boolean))).sort(), [zones])

  const load = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    if (zoneId) params.zone_id = zoneId
    if (teamId) params.team_id = teamId
    if (province) params.province = province
    if (region) params.region = region
    if (status) params.status = status
    reportsAdminApi(params).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // initial load

  const applyQuick = (q: Quick) => {
    const today = new Date()
    if (q === 'today') {
      const s = fmtDateLocal(today)
      setFrom(s); setTo(s)
    } else if (q === 'week') {
      const start = new Date(today); start.setDate(today.getDate() - 7)
      setFrom(fmtDateLocal(start)); setTo(fmtDateLocal(today))
    } else if (q === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      setFrom(fmtDateLocal(start)); setTo(fmtDateLocal(today))
    } else if (q === 'year') {
      const start = new Date(today.getFullYear(), 0, 1)
      setFrom(fmtDateLocal(start)); setTo(fmtDateLocal(today))
    } else if (q === 'all') {
      setFrom(''); setTo('')
    }
  }

  const reset = () => {
    setFrom(''); setTo(''); setZoneId(''); setTeamId(''); setProvince(''); setRegion(''); setStatus('')
    setTimeout(load, 0)
  }

  const activeCount = [from, to, zoneId, teamId, province, region, status].filter(Boolean).length

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('reports.title')} />

      <div className="p-4 sm:p-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
            <Filter size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">{t('reports.filters')}</h3>
            {activeCount > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{activeCount}</span>}
            <div className="ml-auto flex items-center gap-2">
              {activeCount > 0 && (
                <button onClick={reset} className="text-xs text-gray-600 hover:text-red-600 inline-flex items-center gap-1">
                  <RotateCcw size={12} /> {t('reports.reset')}
                </button>
              )}
              <button onClick={() => setShowFilters((v) => !v)} className="text-xs text-blue-600 hover:underline">
                {showFilters ? t('reports.hide') : t('reports.show')}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center mr-1">{t('reports.quick_range')}</span>
                {(['today', 'week', 'month', 'year', 'all'] as Quick[]).map((q) => (
                  <button key={q} onClick={() => applyQuick(q)}
                    className="px-3 py-1 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-full text-xs text-gray-700">
                    {t(`reports.quick.${q}`)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.from_date')}</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.to_date')}</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.zone')}</label>
                  <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('reports.all_option')}</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.team')}</label>
                  <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('reports.all_option')}</option>
                    {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.province')}</label>
                  <select value={province} onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('reports.all_option')}</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.region')}</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('reports.all_option')}</option>
                    {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('reports.status')}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('reports.all_option')}</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button onClick={load} disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {loading ? t('reports.loading_ellipsis') : t('reports.apply_filters')}
                </button>
              </div>
            </div>
          )}
        </div>

        {!data && <div className="p-6 text-gray-400 text-center">{t('common.loading')}</div>}
        {data && (
          <AdminReportsClient
            orders={data.orders ?? []}
            products={data.products ?? []}
            customers={data.customers ?? []}
            orderItems={data.orderItems ?? []}
          />
        )}
      </div>
    </div>
  )
}
