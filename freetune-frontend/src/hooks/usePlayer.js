/**
 * hooks/usePlayer.js
 * Manages the single global HTMLAudioElement.
 * - Local (downloaded/imported) files: use track.blobUrl directly
 * - Streamed songs: use backend /api/stream/:videoId as audio src
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
    audio.preload     = 'auto'
    audioRef.current  = audio
    setAudioEl(audio)

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress(audio.currentTime / audio.duration)
      }
    }
    const onMeta  = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration)
    }
    const onEnded = () => {
      const { repeat } = useStore.getState()
      if (repeat === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        playNext()
      }
    }
    const onError = () => {
      console.error('[player] Audio error code:', audio.error?.code, audio.error?.message)
      setIsPlaying(false)
    }
    const onCanPlay = () => {
      console.log('[player] canplay fired — attempting play')
      audio.play().catch(err => {
        console.error('[player] play() failed:', err.message)
        setIsPlaying(false)
      })
    }

    audio.addEventListener('timeupdate',     onTimeUpdate)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended',          onEnded)
    audio.addEventListener('error',          onError)
    audio.addEventListener('canplay',        onCanPlay)

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate',     onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended',          onEnded)
      audio.removeEventListener('error',          onError)
      audio.removeEventListener('canplay',        onCanPlay)
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
      setIsPlaying(true)

      // Check IndexedDB for downloaded version first
      let src = null
      try {
        const saved = await getSong(currentTrack.videoId)
        if (saved?.blobUrl) {
          src = saved.blobUrl
          console.log('[player] Using saved blob URL')
        }
      } catch {}

      // Use blobUrl on track object (local files)
      if (!src && currentTrack.blobUrl) {
        src = currentTrack.blobUrl
        console.log('[player] Using track blobUrl')
      }

      // Stream from backend
      if (!src) {
        src = streamUrl(currentTrack.videoId)
        console.log('[player] Streaming from backend:', src)
      }

      if (cancelled) return

      audio.src = src
      audio.load()
      // canplay listener above will trigger play()
    }

    load()
    return () => { cancelled = true }
  }, [currentTrack?.videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (isPlaying) {
      audio.play().catch(err => {
        console.error('[player] play() error:', err.message)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  const seek = useCallback((ratio) => {
    const audio = audioRef.current
    if (audio && audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = ratio * audio.duration
    }
  }, [])

  return { seek }
}
