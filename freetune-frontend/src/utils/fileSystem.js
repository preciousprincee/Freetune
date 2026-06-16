/**
 * utils/fileSystem.js
 * File System Access API — lets the app read existing MP3s from the user's phone.
 *
 * HOW IT WORKS:
 *  - Android Chrome: supports showDirectoryPicker() — user picks a folder,
 *    app reads all .mp3 files from it and loads them as object URLs.
 *  - iOS Safari: File System Access API not supported. Feature is hidden.
 *
 * This feature is ON by default but the user can disable it in Settings.
 * When disabled, only FreeTune-downloaded songs appear in the library.
 *
 * Files are never uploaded — everything stays on the device.
 */

/** Returns true if the browser supports directory picking */
export function supportsFilePicker() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/**
 * pickMusicFolder
 * Opens a system folder picker. User selects their Music folder.
 * Returns an array of { name, title, artist, blobUrl } objects.
 *
 * @returns {Promise<LocalTrack[]>}
 */
export async function pickMusicFolder() {
  if (!supportsFilePicker()) throw new Error('Not supported on this browser')

  const dirHandle = await window.showDirectoryPicker({ mode: 'read' })
  const tracks    = []

  for await (const entry of dirHandle.values()) {
    if (entry.kind !== 'file') continue
    if (!entry.name.toLowerCase().endsWith('.mp3') &&
        !entry.name.toLowerCase().endsWith('.m4a') &&
        !entry.name.toLowerCase().endsWith('.aac') &&
        !entry.name.toLowerCase().endsWith('.ogg')) continue

    try {
      const file    = await entry.getFile()
      const blobUrl = URL.createObjectURL(file)
      const title   = entry.name.replace(/\.[^.]+$/, '') // strip extension
      tracks.push({
        videoId:   `local_${entry.name}`,
        title,
        artist:    'Local file',
        duration:  0,
        thumbnail: null,
        blobUrl,
        isLocal:   true,
      })
    } catch {}
  }

  return tracks
}

/**
 * scanSubFolders
 * Recursively scan a directory handle for music files.
 * Useful if the user has a nested Music/Artist/Album structure.
 *
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {LocalTrack[]} acc
 * @returns {Promise<LocalTrack[]>}
 */
export async function scanSubFolders(dirHandle, acc = []) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'directory') {
      await scanSubFolders(entry, acc)
    } else if (entry.kind === 'file') {
      const n = entry.name.toLowerCase()
      if (!n.endsWith('.mp3') && !n.endsWith('.m4a') && !n.endsWith('.aac')) continue
      try {
        const file    = await entry.getFile()
        const blobUrl = URL.createObjectURL(file)
        acc.push({
          videoId:   `local_${entry.name}_${file.size}`,
          title:     entry.name.replace(/\.[^.]+$/, ''),
          artist:    'Local file',
          duration:  0,
          thumbnail: null,
          blobUrl,
          isLocal:   true,
        })
      } catch {}
    }
  }
  return acc
}
