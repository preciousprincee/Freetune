/**
 * hooks/usePlayer.js
 * Manages the single global HTMLAudioElement.
 * - Local (downloaded/imported) files: use track.blobUrl directly
 * - Streamed songs: use backend /api/stream/:videoId as audio src
 *   The browser streams the MP3 from the server in real-time.
 */
import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { streamUrl } from '../utils/api'
import { getSong } from '../utils/db'

export function usePlayer() {
  const audioRef = useRef(null)
  const {
    currentTrack, isPlaying, volume,
    setIsPlaying, setProgress, setDuration, setAudioEl, playNext,
  } = useStore()

  // Create audio element once on mount
  useEffect(() => {
    const audio       = new Audio()
    audio.preload     = 'none'
    audioRef.current  = audio
    setAudioEl(audio)

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress(audio.currentTime / audio.duration)
      }
    }
    const onMeta  = () => { if (!isNaN(audio.duration)) setDuration(audio.duration) }
    const onEnded = () => {
      const { repeat } = useStore.getState()
      if (repeat === 'one') { audio.currentTime = 0; audio.play().catch(() => {}) }
      else playNext()
    }
    const onError = () => {
      console.error('[player] Audio error:', audio.error?.message)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate',     onTimeUpdate)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended',          onEnded)
    audio.addEventListener('error',          onError)

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate',     onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended',          onEnded)
      audio.removeEventListener('error',          onError)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load track when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    let cancelled = false

    async function load() {
      audio.pause()
      setProgress(0)
      setDuration(0)

      // Check if there's a downloaded version in IndexedDB first
      let src = null
      try {
        const saved = await getSong(currentTrack.videoId)
        if (saved?.blobUrl) src = saved.blobUrl
      } catch {}

      // Fallback: local file blobUrl on the track object itself
      if (!src && currentTrack.blobUrl) src = currentTrack.blobUrl

      // Fallback: stream from backend
      if (!src) src = streamUrl(currentTrack.videoId)

      if (cancelled) return

      audio.src = src
      audio.load()
      try {
        await audio.play()
      } catch (err) {
        if (!cancelled) setIsPlaying(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentTrack?.videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume))
  }, [volume])

  // Expose seek for NowPlaying slider
  const seek = useCallback((ratio) => {
    const audio = audioRef.current
    if (audio && audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = ratio * audio.duration
    }
  }, [])

  return { seek }
}
