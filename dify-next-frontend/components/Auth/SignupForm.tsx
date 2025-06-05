import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

export default function SignupForm() {
  const { t } = useTranslation();
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // TODO: Replace with your own registration API call
    if (email && password) {
      // Simulate registration success
      await signIn('credentials', { email, password, redirect: false })
      router.push('/')
    } else {
      setError('Please enter email and password')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder={t('email', { defaultValue: 'Email' }) || 'Email'}
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder={t('password', { defaultValue: 'Password' }) || 'Password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      {error && <div className="text-red-500">{t('signup_error', { defaultValue: error }) || error}</div>}
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">{t('signup')}</button>
    </form>
  )
}
