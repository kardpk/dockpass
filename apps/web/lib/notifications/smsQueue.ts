import { Queue } from 'bullmq'
import Redis from 'ioredis'

// Attempt to construct the connection from our Env
const connection = new Redis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
})

export const smsQueue = new Queue('sms', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: false,
    removeOnFail: false,
  },
})

export async function queueCaptainSnapshot(tripId: string, captainPhone: string, body: string) {
  try {
    await smsQueue.add('captain_snapshot', {
      type: 'captain_snapshot',
      payload: { tripId, captainPhone, body, eventType: 'snapshot_ready' }
    }, {
      jobId: `snapshot-${tripId}`, // Important: Deduplicates identical requests
      delay: 0,
    })
    console.log(`[smsQueue] Enqueued captain snapshot for trip ${tripId}`)
  } catch (err: any) {
    console.error('[smsQueue] Failed to enqueue captain snapshot:', err.message)
  }
}
