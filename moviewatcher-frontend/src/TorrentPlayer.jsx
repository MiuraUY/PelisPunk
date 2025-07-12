import { useEffect, useRef, useState } from 'react'

export default function TorrentPlayer({ magnetURI, onClose }) {
  const videoRef = useRef(null)
  const clientRef = useRef(null)
  const torrentRef = useRef(null)
  const intervalsRef = useRef([])

  const [torrent, setTorrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [peers, setPeers] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [status, setStatus] = useState('Iniciando...')
  const [videoFile, setVideoFile] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-20), { message, type, timestamp }])
    console.log(`[${timestamp}] ${message}`)
  }

  const clearIntervals = () => {
    intervalsRef.current.forEach(clearInterval)
    intervalsRef.current = []
  }

  // Crear cliente una vez al montar el componente
  useEffect(() => {
    if (!window.WebTorrent) {
      setError('WebTorrent no está disponible. Incluye: <script src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"></script>')
      return
    }

    const client = new window.WebTorrent()
    clientRef.current = client
    addLog('Cliente WebTorrent creado', 'success')

    client.on('error', (err) => {
      addLog(`Error en cliente: ${err.message}`, 'error')
      setError(`Error en cliente WebTorrent: ${err.message}`)
    })

    return () => {
      addLog('Limpiando cliente...', 'info')
      clearIntervals()
      if (client && !client.destroyed) {
        client.destroy()
      }
    }
  }, [])

  // Agregar torrent cuando cambia magnetURI
  useEffect(() => {
    if (!magnetURI || !clientRef.current) return

    addLog(`Procesando magnet URI: ${magnetURI.substring(0, 50)}...`, 'info')
    setLoading(true)
    setError(null)
    setProgress(0)
    setPeers(0)
    setDownloadSpeed(0)
    setStatus('Conectando al torrent...')
    
    const client = clientRef.current
    clearIntervals()

    // Limpiar torrent anterior
    if (torrentRef.current) {
      addLog('Removiendo torrent anterior...', 'info')
      try {
        client.remove(torrentRef.current.infoHash)
      } catch (err) {
        addLog(`Error al remover torrent: ${err.message}`, 'warning')
      }
      torrentRef.current = null
      setTorrent(null)
      setVideoFile(null)
    }

    addLog('Agregando nuevo torrent...', 'info')
    
    // Configurar opciones del torrent para streaming
    const torrentOptions = {
      announce: [
        'wss://tracker.btorrent.xyz',
        'wss://tracker.openwebtorrent.com',
        'wss://tracker.fastcast.nz',
        'wss://tracker.webtorrent.io'
      ],
      path: '/tmp/webtorrent/',
      strategy: 'sequential', // Descarga secuencial para streaming
      maxWebConns: 10, // Más conexiones web
      downloadLimit: -1, // Sin límite de descarga
      uploadLimit: -1 // Sin límite de subida
    }

    const newTorrent = client.add(magnetURI, torrentOptions)
    
    // Configurar eventos ANTES de que el torrent esté listo
    newTorrent.on('error', (err) => {
      addLog(`Error en torrent: ${err.message}`, 'error')
      setError(`Error: ${err.message}`)
      setLoading(false)
    })

    newTorrent.on('infoHash', () => {
      addLog(`InfoHash obtenido: ${newTorrent.infoHash}`, 'success')
      setStatus('Obteniendo metadatos...')
    })

    newTorrent.on('metadata', () => {
      addLog(`Metadatos obtenidos: ${newTorrent.name}`, 'success')
      addLog(`Archivos: ${newTorrent.files.length}, Tamaño: ${Math.round(newTorrent.length / 1024 / 1024)}MB`, 'info')
      
      torrentRef.current = newTorrent
      setTorrent(newTorrent)
      setStatus('Buscando archivo de video...')

      // Buscar archivo de video
      const videoFiles = newTorrent.files
        .filter(f => {
          const name = f.name.toLowerCase()
          return name.includes('.mp4') || name.includes('.mkv') || name.includes('.webm') || 
                 name.includes('.avi') || name.includes('.mov') || name.includes('.m4v') ||
                 name.includes('.flv') || name.includes('.wmv')
        })
        .sort((a, b) => b.length - a.length)

      let selectedFile = videoFiles[0] || newTorrent.files[0]
      
      if (!selectedFile) {
        addLog('No se encontró archivo de video', 'error')
        setError('No hay archivos de video en este torrent')
        setLoading(false)
        return
      }

      addLog(`Archivo seleccionado: ${selectedFile.name} (${Math.round(selectedFile.length / 1024 / 1024)}MB)`, 'success')
      setVideoFile(selectedFile)
      setStatus(`Preparando: ${selectedFile.name}`)

      // Priorizar solo este archivo para streaming
      selectedFile.select()
      newTorrent.files.forEach(file => {
        if (file !== selectedFile) {
          file.deselect()
        }
      })

      // Configurar estrategia de descarga para streaming
      if (newTorrent.strategy) {
        newTorrent.strategy = 'sequential' // Descarga secuencial para streaming
      }

      // Configurar reproducción streaming INMEDIATA
      let hasStartedStreaming = false

      const startStreaming = () => {
        if (hasStartedStreaming) return
        
        addLog('Iniciando streaming inmediato...', 'info')
        hasStartedStreaming = true
        
        const videoElement = videoRef.current
        if (videoElement) {
          try {
            // Método 1: Intentar streamTo para streaming en tiempo real
            addLog('Probando streamTo para streaming en tiempo real...', 'info')
            selectedFile.streamTo(videoElement, (err) => {
              if (err) {
                addLog(`StreamTo falló: ${err.message}, probando getBlobURL...`, 'warning')
                // Fallback a getBlobURL
                selectedFile.getBlobURL((err, url) => {
                  if (err) {
                    addLog(`Error en Blob URL: ${err.message}`, 'error')
                    setError('No se pudo procesar el video')
                    setLoading(false)
                    return
                  }
                  
                  addLog('Blob URL creado como fallback', 'success')
                  videoElement.src = url
                  videoElement.load()
                  setLoading(false)
                  setStatus('¡Listo para reproducir!')
                })
              } else {
                addLog('StreamTo exitoso - streaming en tiempo real activo', 'success')
                setLoading(false)
                setStatus('¡Streaming en tiempo real!')
              }
            })
          } catch (err) {
            addLog(`Error en streamTo: ${err.message}`, 'error')
            // Fallback directo a getBlobURL
            selectedFile.getBlobURL((err, url) => {
              if (err) {
                addLog(`Error en Blob URL: ${err.message}`, 'error')
                setError('No se pudo procesar el video')
                setLoading(false)
                return
              }
              
              addLog('Blob URL creado como fallback', 'success')
              videoElement.src = url
              videoElement.load()
              setLoading(false)
              setStatus('¡Listo para reproducir!')
            })
          }
        }
      }

      // Configurar prioridad de descarga para streaming
      const setupStreamingPriority = () => {
        if (selectedFile && selectedFile.length > 0) {
          // Priorizar los primeros chunks del archivo para streaming
          const chunkSize = 1024 * 1024 // 1MB chunks
          const priorityChunks = Math.min(10, Math.ceil(selectedFile.length / chunkSize))
          
          addLog(`Configurando prioridad para streaming: ${priorityChunks} chunks iniciales`, 'info')
          
          // Configurar prioridad alta para los primeros chunks
          for (let i = 0; i < priorityChunks; i++) {
            try {
              selectedFile._torrent.critical(i, i + 1)
            } catch (err) {
              // Método alternativo si critical no funciona
              break
            }
          }
        }
      }

      // Iniciar streaming inmediatamente
      startStreaming()
      setupStreamingPriority()

      // Monitorear descarga para logging
      const monitorDownload = () => {
        if (newTorrent.destroyed) return
        
        const downloaded = selectedFile.downloaded
        const total = selectedFile.length
        const percent = (downloaded / total) * 100
        
        addLog(`Descargado: ${Math.round(downloaded / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB (${percent.toFixed(1)}%)`, 'info')
      }

      // Monitorear cada 3 segundos
      const monitorInterval = setInterval(monitorDownload, 3000)
      intervalsRef.current.push(monitorInterval)
    })

    newTorrent.on('ready', () => {
      addLog('Torrent listo para descargar', 'success')
      setStatus('Torrent listo, comenzando descarga...')
    })

    newTorrent.on('download', () => {
      if (!newTorrent.destroyed) {
        const speed = Math.round(newTorrent.downloadSpeed / 1024)
        if (speed > 0) {
          addLog(`Descargando... Speed: ${speed}KB/s`, 'info')
        }
      }
    })

    newTorrent.on('wire', (wire) => {
      addLog(`Nuevo peer conectado: ${wire.remoteAddress || 'Desconocido'}`, 'success')
      setStatus(`Descargando... (${newTorrent.numPeers} peers)`)
    })

    newTorrent.on('noPeers', () => {
      addLog('No hay peers disponibles', 'warning')
      setStatus('Buscando peers...')
    })

    // Timeout más agresivo para detectar problemas
    const timeout = setTimeout(() => {
      if (!newTorrent.destroyed) {
        if (newTorrent.numPeers === 0) {
          addLog('Timeout: No se encontraron peers', 'error')
          setError('No se pudieron encontrar peers. Verifica tu conexión o prueba otro torrent.')
          setLoading(false)
        } else if (!newTorrent.ready) {
          addLog('Timeout: Torrent no está listo', 'error')
          setError('El torrent no pudo cargarse completamente. Intenta con otro magnet link.')
          setLoading(false)
        }
      }
    }, 60000) // 60 segundos

    // Mostrar estadísticas
    const statsInterval = setInterval(() => {
      if (newTorrent && !newTorrent.destroyed) {
        setProgress(Math.round(newTorrent.progress * 100))
        setPeers(newTorrent.numPeers)
        setDownloadSpeed(Math.round(newTorrent.downloadSpeed / 1024))
        
        // Log periódico de estado
        if (newTorrent.numPeers > 0) {
          addLog(`Estado: ${newTorrent.numPeers} peers, ${Math.round(newTorrent.progress * 100)}% descargado`, 'info')
        }
      }
    }, 5000) // Cada 5 segundos

    intervalsRef.current.push(statsInterval)

    return () => {
      clearTimeout(timeout)
      clearIntervals()
      if (torrentRef.current && client && !client.destroyed) {
        try {
          client.remove(torrentRef.current.infoHash)
        } catch (err) {
          addLog(`Error en cleanup: ${err.message}`, 'warning')
        }
        torrentRef.current = null
      }
    }
  }, [magnetURI])

  // Configurar eventos del video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      addLog(`Video cargado: ${Math.round(video.duration)}s de duración`, 'success')
      setLoading(false)
      setStatus('¡Listo para reproducir!')
    }

    const handleCanPlay = () => {
      addLog('Video puede reproducirse', 'success')
      setLoading(false)
    }

    const handleError = (e) => {
      const errorMsg = video.error ? `Error ${video.error.code}: ${video.error.message}` : 'Error desconocido'
      addLog(`Error en video: ${errorMsg}`, 'error')
      setError('Error al reproducir el video')
      setLoading(false)
    }

    const handlePlay = () => {
      addLog('Video comenzó a reproducirse', 'success')
      setStatus('¡Reproduciendo!')
    }

    const handleWaiting = () => {
      addLog('Video en buffer...', 'warning')
      setStatus('Buffering...')
    }

    const handlePlaying = () => {
      addLog('Video reproduciendo normalmente', 'success')
      setStatus('¡Reproduciendo!')
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '10px 15px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        ✕ Cerrar
      </button>
      
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', gap: '20px' }}>
        {/* Video y controles principales */}
        <div style={{ flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h3>{status}</h3>
              <div style={{ 
                width: 60, 
                height: 60, 
                border: '4px solid #333',
                borderTop: '4px solid #00ffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '20px auto'
              }} />
              
              {progress > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: '#333',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    margin: '10px 0'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: '#00ffff',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>Progreso: {progress}%</span>
                    <span>Peers: {peers}</span>
                    <span>Velocidad: {downloadSpeed} KB/s</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(255, 68, 68, 0.2)',
              border: '2px solid #ff4444',
              padding: 20,
              borderRadius: 10,
              marginBottom: 20,
              textAlign: 'center'
            }}>
              <h3>❌ Error</h3>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 10,
                  padding: '8px 16px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer'
                }}
              >
                🔄 Reintentar
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            controls
            autoPlay
            muted
            preload="none"
            style={{
              width: '100%',
              maxHeight: '70vh',
              borderRadius: 10,
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
              display: loading ? 'none' : 'block'
            }}
          />
          
          {torrent && !loading && (
            <div style={{ 
              marginTop: 15, 
              padding: '15px',
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4>📹 {torrent.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                <span>📁 {torrent.files.length} archivos</span>
                <span>💾 {Math.round(torrent.length / 1024 / 1024)} MB</span>
                <span>👥 {peers} peers</span>
              </div>
            </div>
          )}
        </div>

        {/* Panel de logs */}
        <div style={{
          width: '300px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00ffff' }}>🔍 Debug Log</h4>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{
                marginBottom: '5px',
                padding: '5px',
                borderLeft: `3px solid ${
                  log.type === 'success' ? '#4CAF50' : 
                  log.type === 'error' ? '#f44336' : 
                  log.type === 'warning' ? '#ff9800' : '#2196f3'
                }`,
                paddingLeft: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ color: '#888', fontSize: '10px' }}>
                  [{log.timestamp}]
                </div>
                <div style={{ 
                  color: log.type === 'success' ? '#4CAF50' : 
                        log.type === 'error' ? '#f44336' : 
                        log.type === 'warning' ? '#ff9800' : '#fff'
                }}>
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `
      }} />
    </div>
  )
}