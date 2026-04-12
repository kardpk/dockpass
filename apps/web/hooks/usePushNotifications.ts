import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    // Check support natively
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  async function requestSubscription(
    targetType: 'guest' | 'operator' | 'captain',
    targetId: string
  ): Promise<boolean> {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false

    try {
      setIsSubscribing(true)

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        // Request new subscription
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      // Sync subscription with backend generically
      const res = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSubscription: sub.toJSON(),
          targetType,
          targetId,
        }),
      })

      if (!res.ok) throw new Error('Failed to save subscription')

      setPermission(Notification.permission)
      return true
    } catch (error) {
      console.error('[Push] Error subscribing:', error)
      // They could have blocked it
      setPermission(Notification.permission)
      return false
    } finally {
      setIsSubscribing(false)
    }
  }

  return { isSupported, permission, isSubscribing, requestSubscription }
}

// Boilerplate standard VAPID conversion
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
