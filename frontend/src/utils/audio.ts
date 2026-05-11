/** Play a multi-tone chime using the Web Audio API. */
export function playChime(): void {
  try {
    const ctx = new AudioContext()
    // Three-tone descending chime, each note longer and louder
    const notes = [
      { freq: 880, offset: 0.0,  duration: 0.8 },
      { freq: 660, offset: 0.55, duration: 0.8 },
      { freq: 528, offset: 1.1,  duration: 1.2 },
    ]
    notes.forEach(({ freq, offset, duration }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(freq, ctx.currentTime + offset)
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, ctx.currentTime + offset)
      gain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + offset + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + duration)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + duration)
    })
    setTimeout(() => ctx.close(), 4000)
  } catch {
    // Silent fallback — audio not critical
  }
}
