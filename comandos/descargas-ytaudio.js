import { config } from '../config.js'
import axios from 'axios'

const http = axios.create({
    timeout: 15000
})

const youtubeAudio = {
    name: 'play',
    alias: ['audio', 'yta', 'ytmp3'],
    category: 'descargas',
    desc: 'Busca, muestra info y descarga audio de YouTube.',
    noPrefix: true,

    run: async (conn, m, args, usedPrefix, commandName, text) => {

        if (!text) {
            return m.reply(
                `*${config.visuals.emoji2}* Por favor, ingresa el nombre de una canción o un enlace.`
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
                    `*${config.visuals.emoji3}* ✿ Enlace detectado. Enviando audio, espera un momento...`
                )

            } else {

                const { data: searchRes } = await http.get(
                    `https://api.delirius.store/search/ytsearch?q=${encodeURIComponent(text)}`
                )

                const list = searchRes?.data || searchRes?.result || []

                if (!list.length) {
                    return m.reply('❌ No se encontraron resultados.')
                }

                const firstResult = list[0]

                if (!firstResult?.url) {
                    return m.reply('❌ Resultado inválido.')
                }

                if (firstResult.duration === '0:00') {
                    return m.reply('❌ Video no válido.')
                }

                videoUrl = firstResult.url

                const infoText =
`*${config.visuals.emoji3} YouTube Audio ${config.visuals.emoji3}*

*= Título* »
> ${firstResult.title}
*= Canal* »
> ${firstResult.author?.name || 'Desconocido'}
*= Publicado* »
> ${firstResult.publishedAt || 'Desconocido'}
*= Duración* »
> ${firstResult.duration}
*= Vistas* »
> ${(firstResult.views || 0).toLocaleString()}
*= Enlace* »
> ${videoUrl}

_Descargando audio, espere un momento..._`

                await conn.sendMessage(m.chat, {
                    image: { url: firstResult.image },
                    caption: infoText
                }, { quoted: m })
            }

            // =========================
            // 🎧 DESCARGA FIX (ANTI 502)
            // =========================

            let audioData = null

            const endpoints = [
                `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(videoUrl)}&format=128`,
                `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
            ]

            for (const url of endpoints) {
                try {
                    const { data } = await http.get(url)

                    if (data?.data?.download || data?.download) {
                        audioData = data.data || data
                        break
                    }

                } catch (e) {
                    console.log('YTMP3 FAIL:', e.message)
                }
            }

            if (!audioData) {
                return m.reply('❌ No se pudo obtener el audio (API caída o 502).')
            }

            const audioUrl = audioData.download || audioData.url

            if (!audioUrl) {
                return m.reply('❌ Enlace de audio inválido.')
            }

            // =========================
            // 📤 SEND AUDIO
            // =========================

            await conn.sendMessage(m.chat, {
                audio: {
                    url: audioUrl
                },
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${audioData.title || 'audio'}.mp3`
            }, { quoted: m })

            await conn.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (e) {

            console.error('YT AUDIO ERROR:', e)

            await conn.sendMessage(m.chat, {
                react: { text: '✖️', key: m.key }
            })

            m.reply(
                `*${config.visuals.emoji2}* Error: ${e.response?.data?.error || e.message}`
            )
        }
    }
}

export default youtubeAudio;