'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import { currentUser } from '@/lib/api/auth'
import { updateMe } from '@/features/auth/api'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SettingsPage() {
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  useEffect(() => {
    const u = currentUser()
    if (u) {
      setUser(u)
      setFirstName(u.first_name ?? '')
      setLastName(u.last_name ?? '')
      setPhone(u.phone ?? '')
    }
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true); setProfileError(''); setProfileSuccess('')
    try {
      const updated = await updateMe({ first_name: firstName, last_name: lastName, phone })
      setUser(updated)
      setProfileSuccess(t('settings.profile_saved'))
    } catch (err: any) {
      setProfileError(err.message || t('settings.save_failed'))
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (!newPassword) return
    if (newPassword !== confirmPassword) { setPwError(t('settings.password_mismatch')); return }
    setPwSaving(true)
    try {
      await updateMe({ new_password: newPassword })
      setNewPassword(''); setConfirmPassword('')
      setPwSuccess(t('settings.password_saved'))
    } catch (err: any) {
      setPwError(err.message || t('settings.save_failed'))
    } finally {
      setPwSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('settings.title')} />
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('settings.profile_info')}</h3>
            {profileError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{profileError}</div>}
            {profileSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{profileSuccess}</div>}
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.email')}</label>
                <input disabled value={user.email ?? ''} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none text-gray-500" />
                <p className="text-xs text-gray-400 mt-0.5">{t('settings.email_hint')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.first_name')}</label>
                  <input required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.last_name')}</label>
                  <input required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.phone')}</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.role')}</label>
                  <input disabled value={t(`role.${user.role}`)} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none text-gray-500" />
                </div>
                {user.team?.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.team')}</label>
                    <input disabled value={user.team.name} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={profileSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                  {profileSaving ? t('common.saving') : t('settings.save_profile')}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('settings.change_password')}</h3>
            {pwError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{pwError}</div>}
            {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{pwSuccess}</div>}
            <form onSubmit={savePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.new_password')}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.confirm_password')}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-0.5">{t('settings.password_hint')}</p>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={pwSaving || !newPassword}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                  {pwSaving ? t('common.saving') : t('settings.update_password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
