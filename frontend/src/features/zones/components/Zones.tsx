'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react'
import { zonesApi } from '@/features/zones/api'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  zones: any[]
  canEdit: boolean
  canDelete: boolean
  onReload: () => void
}

const empty = { code: '', name: '', region: '', province: '', description: '' }

export default function Zones({ zones, canEdit, canDelete, onReload }: Props) {
  const { t } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const startAdd = () => { setEditing(null); setForm(empty); setShowForm(true); setError('') }
  const startEdit = (z: any) => {
    setEditing(z)
    setForm({ code: z.code, name: z.name, region: z.region ?? '', province: z.province ?? '', description: z.description ?? '' })
    setShowForm(true); setError('')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      if (editing) await zonesApi.update(editing.id, form)
      else await zonesApi.create(form)
      setShowForm(false); onReload()
    } catch (err: any) {
      setError(err.message || t('cf.save_failed'))
    } finally { setSaving(false) }
  }

  const remove = async (z: any) => {
    if (!confirm(t('zones.confirm_delete').replace('{code}', z.code).replace('{name}', z.name))) return
    try {
      await zonesApi.remove(z.id); onReload()
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('zones.title')} ({zones.length})</h2>
          <button onClick={startAdd} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Plus size={14} /> {t('zones.add')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3">{t('zones.col.code')}</th>
                <th className="text-left px-5 py-3">{t('zones.col.name')}</th>
                <th className="text-left px-5 py-3">{t('zones.col.province')}</th>
                <th className="text-left px-5 py-3">{t('zones.col.region')}</th>
                <th className="text-center px-5 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-blue-700">{z.code}</td>
                  <td className="px-5 py-3.5 text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {z.name}
                    </div>
                    {z.description && <p className="text-xs text-gray-500 mt-0.5 ml-6">{z.description}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{z.province ?? '-'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{z.region ?? '-'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && (
                        <button onClick={() => startEdit(z)} className="text-gray-400 hover:text-blue-600 p-1.5" title={t('common.edit')}>
                          <Edit2 size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => remove(z)} className="text-gray-400 hover:text-red-600 p-1.5" title={t('common.delete')}>
                          <Trash2 size={15} />
                        </button>
                      )}
                      {!canEdit && !canDelete && <span className="text-xs text-gray-400">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">{t('zones.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editing ? t('zones.edit') : t('zones.add_new')}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('zones.field.code')} <span className="text-red-500">*</span></label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder={t('zones.placeholder.code')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('zones.field.name')} <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('zones.placeholder.name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('zones.field.province')}</label>
                  <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                    placeholder={t('zones.placeholder.province')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('zones.field.region')}</label>
                  <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('common.optional')}</option>
                    <option value="ภาคกลาง">{t('zones.region.central')}</option>
                    <option value="ภาคเหนือ">{t('zones.region.north')}</option>
                    <option value="ภาคใต้">{t('zones.region.south')}</option>
                    <option value="ภาคตะวันออก">{t('zones.region.east')}</option>
                    <option value="ภาคตะวันออกเฉียงเหนือ">{t('zones.region.northeast')}</option>
                    <option value="ภาคตะวันตก">{t('zones.region.west')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('zones.field.description')}</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? t('common.saving_dots') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
