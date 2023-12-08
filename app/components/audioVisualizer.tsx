import React, { useCallback, useEffect, useRef } from 'react'

const AudioVisualizer: React.FC<{ mediaRecorder: MediaRecorder | null }> = ({ mediaRecorder }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const dataArray = useRef<Uint8Array | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser.current || !dataArray.current) return
    const ctx = canvas.getContext('2d')
    analyser.current.getByteFrequencyData(dataArray.current)

    const barWidth = 16
    const numberOfBars = 12
    const radiusAtTopOfBar = 4
    const barSpacing = 4
    const totalBarWidth = barWidth + barSpacing
    const totalWidth = totalBarWidth * numberOfBars - barSpacing
    const startX = (canvas.width - totalWidth) / 2

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#F5F5F5' // "whitish"
    }

    for (let i = 0; i < numberOfBars; ++i) {
      const value = dataArray.current[i]
      const barHeight = (value * canvas.height) / (255 * 3) // 1/3 of the canvas height
      const barX = startX + i * totalBarWidth
      const barY = canvas.height - barHeight

      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(barX, canvas.height)
        ctx.lineTo(barX, barY + radiusAtTopOfBar)
        ctx.arcTo(barX, barY, barX + radiusAtTopOfBar, barY, radiusAtTopOfBar)
        ctx.lineTo(barX + barWidth - radiusAtTopOfBar, barY)
        ctx.arcTo(barX + barWidth, barY, barX + barWidth, barY + radiusAtTopOfBar, radiusAtTopOfBar)
        ctx.lineTo(barX + barWidth, canvas.height)
        ctx.closePath()
        ctx.fill()
      }
    }

    requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    if (mediaRecorder && mediaRecorder.stream) {
      audioContext.current = new AudioContext()
      analyser.current = audioContext.current.createAnalyser()
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount)

      const source = audioContext.current.createMediaStreamSource(mediaRecorder.stream)
      source.connect(analyser.current)

      draw()
    }

    return () => {
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [mediaRecorder, draw])

  return <canvas ref={canvasRef} className='w-full h-full rounded-full pointer-events-none' />
}

export default AudioVisualizer
