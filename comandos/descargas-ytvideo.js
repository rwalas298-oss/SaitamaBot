import { config } from '../config.js'
import axios from 'axios'

const http = axios.create({
    timeout: 15000
})

const youtubeVideo = {
    name: 'play2',
    alias: ['ytv', 'ytmp4','video'],
    category: 'descargas',
    desc: 'Busca, muestra info y descarga el video de YouTube.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {

        if (!text) {
            return m.reply(
                `*${config.visuals.emoji2}* Por favor, ingresa el nombre del video o el enlace.`
            )
        }

        await conn.sendMessage(m.chat, {
            react: { text: '🔍', key: m.key }
        })

        try {
            let videoUrl = ''

            const isUrl =
                /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(text)

            // =========================
            // 🔎 SEARCH
            // =========================
            if (isUrl) {

                videoUrl = text

                await m.reply(
                    `*${config.visuals.emoji3}* ✿ Enlace detectado. Enviando video, espera un momento...`
                )

            } else {

                const { data: searchRes } = await http.get(
                    `https://api.delirius.store/search/ytsearch?q=${encodeURIComponent(text)}`
                )

                const list = searchRes?.data || searchRes?.result || []

                if (!list.length) {
                    return m.reply('No se encontraron resultados.')
                }

                const firstResult = list[0]

                if (!firstResult?.url || firstResult.duration === '0:00') {
                    return m.reply('❌ Video no válido.')
                }

                videoUrl = firstResult.url

                const infoText =
`*${config.visuals.emoji3} YouTube Video ${config.visuals.emoji3}*

*= Título* »
> ${firstResult.title}
*= Canal* »
> ${firstResult.author?.name || 'Desconocido'}
*= Publicado* »
> ${firstResult.publishedAt || 'Desconocido'}
*= Duración* »
> ${firstResult.duration || 'Desconocida'}
*= Vistas* »
> ${(firstResult.views || 0).toLocaleString()}
*= Enlace* »
> ${videoUrl}

_Enviando video, espere un momento..._`

                await conn.sendMessage(m.chat, {
                    image: { url: firstResult.image },
                    caption: infoText
                }, { quoted: m })
            }

            // =========================
            // 📥 DESCARGA PRO (FIX)
            // =========================
            const qualities = ['720p', '360p', '1080p']

            let videoData = null
            let selectedQuality = null

            for (const quality of qualities) {
                try {
                    const { data } = await http.get(
                        `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(videoUrl)}&format=${quality}`
                    )

                    if (data?.data?.download || data?.download) {
                        videoData = data.data || data
                        selectedQuality = quality
                        break
                    }

                } catch (e) {
                    console.log(`❌ fallo ${quality}:`, e.message)
                }
            }

            if (!videoData) {
                return m.reply('❌ No se pudo obtener el video.')
            }

            const downloadUrl = videoData.download || videoData.url

            if (!downloadUrl) {
                return m.reply('❌ Enlace de descarga inválido.')
            }

            // =========================
            // 📦 SIZE CHECK
            // =========================
            let sizeMB = 0

            try {
                const head = await http.head(downloadUrl)
                const size = Number(head.headers['content-length'] || 0)
                sizeMB = size / (1024 * 1024)
            } catch {}

            const sizeGB = sizeMB / 1024

            if (sizeGB >= 3) {
                return m.reply('❌ El video supera los 3 GB permitidos.')
            }

            const caption =
`🎬 *${videoData.title || 'Video'}*
📺 Autor: ${videoData.author || 'Desconocido'}
👁️ Vistas: ${videoData.views || '0'}
🎞️ Calidad: ${selectedQuality}
📦 Tamaño: ${sizeMB.toFixed(2)} MB`

            // =========================
            // 📤 SEND
            // =========================
            if (sizeMB >= 200) {

                await conn.sendMessage(m.chat, {
                    document: {
                        url: downloadUrl
                    },
                    mimetype: 'video/mp4',
                    fileName: `${videoData.title || 'video'}.mp4`,
                    caption
                }, { quoted: m })

            } else {

                await conn.sendMessage(m.chat, {
                    video: {
                        url: downloadUrl
                    },
                    mimetype: 'video/mp4',
                    caption
                }, { quoted: m })
            }

            await conn.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (e) {

            console.error('YT ERROR:', e)

            await conn.sendMessage(m.chat, {
                react: { text: '✖️', key: m.key }
            })

            m.reply(
                `*${config.visuals.emoji2}* Error: ${e.response?.data?.error || e.message}`
            )
        }
    }
}

export default youtubeVideo;