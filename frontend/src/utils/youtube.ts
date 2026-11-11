const videoIdPattern = /^[A-Za-z0-9_-]{11}$/

export function youtubeVideoId(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    let candidate: string | null = null
    if (host === 'youtu.be') candidate = url.pathname.split('/').filter(Boolean)[0] ?? null
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      candidate = url.searchParams.get('v')
      if (!candidate) {
        const parts = url.pathname.split('/').filter(Boolean)
        if (['embed', 'shorts', 'live'].includes(parts[0] ?? '')) candidate = parts[1] ?? null
      }
    }
    return candidate && videoIdPattern.test(candidate) ? candidate : null
  } catch {
    return null
  }
}

export const youtubeThumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
export const youtubeEmbed = (videoId: string) => `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&cc_load_policy=1`
