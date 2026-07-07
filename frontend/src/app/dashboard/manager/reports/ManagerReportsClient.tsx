'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'

const COLORS = ['#2563EB', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  quotations: any[]
  orders: any[]
  teamMembers: any[]
}

export default function ManagerReportsClient({ quotations, orders, teamMembers }: Props) {
  const { t, lang } = useLanguage()
  const [tab, setTab] = useState<'overview' | 'sales' | 'approval'>('overview')

  const salesPerMember = useMemo(() => {
    return teamMembers.map((m) => {
      const completed = orders.filter((o) => o.created_by === m.id && o.status === 'completed')
      return {
        name: `${m.first_name} ${m.last_name}`,
        sales: completed.reduce((s, o) => s + (o.total_amount ?? 0), 0),
        orderCount: completed.length,
      }
    })
  }, [orders, teamMembers])

  const qStatus = useMemo(() => {
    const map: Record<string, number> = {}
    quotations.forEach((q) => { map[q.status] = (map[q.status] ?? 0) + 1 })
    const labels: Record<string, string> = {
      draft: t('doc.status.draft'), pending: t('doc.status.pending'), approved: t('doc.status.approved'), rejected: t('doc.status.rejected_q'),
    }
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] ?? k, value: v }))
  }, [quotations, lang])

  const oStatus = useMemo(() => {
    const map: Record<string, number> = {}
    orders.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1 })
    const labels: Record<string, string> = {
      pending_review: t('doc.status.pending_review'), processing: t('status.processing'),
      completed: t('status.completed'), cancelled: t('status.cancelled'), rejected: t('status.rejected'),
    }
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] ?? k, value: v }))
  }, [orders, lang])

  return (
    <div className="p-4 sm:p-6">
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[
          { id: 'overview' as const, label: t('reports.tab.overview') },
          { id: 'sales' as const, label: t('reports.tab.team_sales') },
          { id: 'approval' as const, label: t('reports.tab.approval') },
        ].map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === tb.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t('reports.quotation_status')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={qStatus} cx="50%" cy="50%" labelLine={false} label={(e) => `${e.name}: ${e.value}`} outerRadius={80} dataKey="value">
                  {qStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t('reports.order_status')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={oStatus} cx="50%" cy="50%" labelLine={false} label={(e) => `${e.name}: ${e.value}`} outerRadius={80} dataKey="value">
                  {oStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{t('reports.sales_per_member')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesPerMember}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, t('dashboard.chart.tooltip_sales')]} />
                <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">{t('reports.col.employee')}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">{t('reports.col.order_count_full')}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">{t('reports.col.sales')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {salesPerMember.map((m) => (
                  <tr key={m.name} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 font-medium">{m.name}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{m.orderCount}</td>
                    <td className="px-5 py-3 text-right text-gray-900 font-medium">฿{m.sales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {tab === 'approval' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {qStatus.map((s, idx) => (
            <div key={s.name} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">{s.name}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: COLORS[idx % COLORS.length] }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
