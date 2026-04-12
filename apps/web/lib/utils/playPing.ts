/**
 * Play a short, pleasant ping tone using the Web Audio API.
 * No audio file required — generates an 880Hz (A5) sine wave for 150ms.
 * Safely no-ops in SSR and when AudioContext is unavailable.
 *
 * Used by useTripGuests to notify the Captain when a new guest registers.
 */
export function playPing() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = 880  // A5 — bright, attention-grabbing
    gain.gain.value = 0.3      // Moderate volume — not jarring

    // Smooth fade-out to prevent clicks
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)

    // Clean up AudioContext after playback
    osc.onended = () => ctx.close().catch(() => null)
  } catch {
    // AudioContext unavailable or blocked by autoplay policy — silent fail
  }
}
