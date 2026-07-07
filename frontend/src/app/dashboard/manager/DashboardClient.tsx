'use client'

import { FileText, ShoppingCart, Clock, AlertCircle, DollarSign } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  stats: {
    teamQuotationCount: number
    teamOrderCount: number
    pendingQuotations: number
    pendingOrders: number
    rejectedCount: number
    totalSales: number
    monthlyData?: { monthIdx: number; orders: number; revenue: number }[]
    statusBreakdown?: { key: string; value: number; color: string }[]
  }
}

const MONTH_KEYS = ['month.jan','month.feb','month.mar','month.apr','month.may','month.jun','month.jul','month.aug','month.sep','month.oct','month.nov','month.dec']

export default function ManagerDashboardClient({ stats }: Props) {
  const { t } = useLanguage()
  const monthlyData = (stats.monthlyData ?? []).map((m) => ({ month: t(MONTH_KEYS[m.monthIdx]), sales: m.revenue }))
  const statusData = (stats.statusBreakdown ?? []).map((s) => ({ ...s, name: t(`status.${s.key}`) }))
  const hasMonthly = monthlyData.some((m) => m.sales > 0)
  const hasStatus = statusData.length > 0
  const cards = [
    { label: t('dashboard.stat.total_quotations'), value: stats.teamQuotationCount, icon: <FileText size={20} />, color: 'bg-blue-50 text-blue-600' },
    { label: t('dashboard.stat.total_orders'), value: stats.teamOrderCount, icon: <ShoppingCart size={20} />, color: 'bg-purple-50 text-purple-600' },
    { label: t('dashboard.stat.pending_approval'), value: stats.pendingQuotations, icon: <Clock size={20} />, color: 'bg-yellow-50 text-yellow-600' },
    { label: t('dashboard.stat.pending_review'), value: stats.pendingOrders, icon: <AlertCircle size={20} />, color: 'bg-orange-50 text-orange-600' },
    { label: t('dashboard.stat.rejected'), value: stats.rejectedCount, icon: <AlertCircle size={20} />, color: 'bg-red-50 text-red-600' },
    { label: t('dashboard.stat.team_sales'), value: `฿${stats.totalSales.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{t('dashboard.chart.team_sales')}</h3>
            {!hasMonthly && <span className="text-xs text-gray-400">{t('dashboard.empty.no_sales')}</span>}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, t('dashboard.chart.tooltip_sales')]} />
              <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.chart.quotation_status')}</h3>
          {hasStatus ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, _n, p: any) => [v, p?.payload?.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{s.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 text-sm py-12">{t('dashboard.empty.no_quotations')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
