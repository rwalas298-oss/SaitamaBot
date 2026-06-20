import { config } from '../config.js'
import axios from 'axios'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

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
                    `*${config.visuals.emoji3}* Enlace detectado. Enviando video...`
                )

            } else {

                const { data: searchRes } = await http.get(
                    `https://api.delirius.store/search/ytsearch?q=${encodeURIComponent(text)}`
                )

                const list = searchRes?.data || searchRes?.result || []

                if (!list.length) return m.reply('No se encontraron resultados.')

                const firstResult = list[0]

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
            // 📥 DESCARGA DELIRIUS
            // =========================
            const qualities = ['1080p', '720p', '360p']

            let videoData = null
            let selectedQuality = null

            for (const q of qualities) {
                try {
                    const { data } = await http.get(
                        `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(videoUrl)}&format=${q}`
                    )

                    if (data?.data?.download || data?.download) {
                        videoData = data.data || data
                        selectedQuality = q
                        break
                    }
                } catch {}
            }

            let downloadUrl = videoData?.download || videoData?.url
            let filePath = null

            // =========================
            // ⚡ YT-DLP FALLBACK (ULTRA FIX)
            // =========================
            if (!downloadUrl) {

    await m.reply('⚙️ Activando yt-dlp ultra motor...')

    filePath = path.join(os.tmpdir(), `${Date.now()}.mp4`)

    await new Promise((resolve, reject) => {

    const cmd =
        `/usr/local/bin/yt-dlp ` +
        `-f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best" ` +
        `--merge-output-format mp4 ` +
        `--no-playlist ` +
        `--retries 5 ` +
        `--fragment-retries 5 ` +
        `-o "${filePath}" ` +
        `"${videoUrl}"`

    exec(cmd, (err, stdout, stderr) => {

        console.log("yt-dlp stdout:", stdout)
        console.log("yt-dlp stderr:", stderr)

        if (err) {
            return reject(
                stderr ||
                err.message ||
                "yt-dlp fallo sin error visible"
            )
        }

        resolve(true)
    })
})

    downloadUrl = filePath
                }

            // =========================
            // 📦 SIZE CHECK
            // =========================
            let sizeMB = 0

            try {
                if (downloadUrl.startsWith('http')) {
                    const head = await http.head(downloadUrl)
                    const size = Number(head.headers['content-length'] || 0)
                    sizeMB = size / (1024 * 1024)
                } else {
                    const stats = fs.statSync(downloadUrl)
                    sizeMB = stats.size / (1024 * 1024)
                }
            } catch {}

            const sizeGB = sizeMB / 1024

            if (sizeGB >= 3) {
                return m.reply('❌ Video demasiado pesado (3GB max).')
            }

            const caption =
`🎬 *${videoData?.title || 'Video'}*
📺 Autor: ${videoData?.author || 'Desconocido'}
🎞️ Calidad: ${selectedQuality || 'yt-dlp'}
📦 Tamaño: ${sizeMB.toFixed(2)} MB`

            // =========================
            // 📤 SEND (AUTO DOC >100MB)
            // =========================
            if (downloadUrl.startsWith('http')) {

                if (sizeMB >= 100) {

                    await conn.sendMessage(m.chat, {
                        document: { url: downloadUrl },
                        mimetype: 'video/mp4',
                        fileName: `${videoData?.title || 'video'}.mp4`,
                        caption
                    }, { quoted: m })

                } else {

                    await conn.sendMessage(m.chat, {
                        video: { url: downloadUrl },
                        mimetype: 'video/mp4',
                        caption
                    }, { quoted: m })
                }

            } else {

                const buffer = fs.readFileSync(downloadUrl)

                if (sizeMB >= 100) {

                    await conn.sendMessage(m.chat, {
                        document: buffer,
                        mimetype: 'video/mp4',
                        fileName: `${videoData?.title || 'video'}.mp4`,
                        caption
                    }, { quoted: m })

                } else {

                    await conn.sendMessage(m.chat, {
                        video: buffer,
                        mimetype: 'video/mp4',
                        caption
                    }, { quoted: m })
                }

                fs.unlinkSync(downloadUrl)
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
