/**
 * hooks/usePlayer.js
 * Creates and manages a single HTMLAudioElement for the lifetime of the app.
 * Wires it up to the Zustand store so components just read store state.
 *
 * How streaming works:
 *  1. User taps a track
 *  2. store.playTrack() sets currentTrack
 *  3. This hook watches currentTrack, calls Cobalt API to get audio URL
 *  4. Sets audio.src and plays
 *  5. Progress / duration updates flow back into the store
 */

import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { getAudioUrl } from '../utils/cobaltApi'

export function usePlayer() {
  const audioRef = useRef(null)

  const {
    currentTrack, isPlaying, volume, repeat,
    cobaltInstance, audioQuality,
    setIsPlaying, setProgress, setDuration, setAudioEl,
    playNext,
  } = useStore()

  // ── Create audio element once ────────────────────────────────────────
  useEffect(() => {
    const audio        = new Audio()
    audio.preload      = 'metadata'
    audio.crossOrigin  = 'anonymous'
    audioRef.current   = audio
    setAudioEl(audio)

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration)
      }
    }
    const onDuration   = () => setDuration(audio.duration || 0)
    const onEnded      = () => {
      const r = useStore.getState().repeat
      if (r === 'one') { audio.currentTime = 0; audio.play().catch(() => {}) }
      else playNext()
    }
    const onError      = () => setIsPlaying(false)

    audio.addEventListener('timeupdate',       onTimeUpdate)
    audio.addEventListener('loadedmetadata',   onDuration)
    audio.addEventListener('durationchange',   onDuration)
    audio.addEventListener('ended',            onEnded)
    audio.addEventListener('error',            onError)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate',     onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('ended',          onEnded)
      audio.removeEventListener('error',          onError)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load new track ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return

    const audio = audioRef.current

    async function loadTrack() {
      audio.pause()
      audio.src = ''
      setProgress(0)
      setDuration(0)

      try {
        // Check if song is downloaded (has blob URL stored in IndexedDB)
        const { getSong } = await import('../utils/db')
        const saved = await getSong(currentTrack.videoId)

        if (saved?.blobUrl) {
          // Offline: use stored blob URL
          audio.src = saved.blobUrl
        } else if (cobaltInstance) {
          // Online: get stream URL from Cobalt
          const url = await getAudioUrl({
            instance:   cobaltInstance,
            youtubeUrl: currentTrack.youtubeUrl,
            format:     'mp3',
            quality:    audioQuality,
          })
          audio.src = url
        } else {
          // No instance — can't stream
          setIsPlaying(false)
          return
        }

        audio.load()
        const playPromise = audio.play()
        if (playPromise) playPromise.catch(() => setIsPlaying(false))
      } catch (err) {
        console.error('Track load error:', err)
        setIsPlaying(false)
      }
    }

    loadTrack()
  }, [currentTrack?.videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play / pause ──────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Volume ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // ── Seek ──────────────────────────────────────────────────────────────
  const seek = useCallback((ratio) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    audio.currentTime = ratio * audio.duration
  }, [])

  return { seek }
}
