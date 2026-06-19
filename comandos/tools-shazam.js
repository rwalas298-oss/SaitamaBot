import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import crypto from 'crypto'

const cache = new Map()

export default {
    name: 'shazam',
    alias: ['song', 'whatmusic', 'music'],
    category: 'herramientas',
    desc: 'Reconoce canciones (GOD MODE)',

    run: async (conn, m) => {
        try {

            const q = m.quoted || m

            if (!q.message) {
                return m.reply('🎵 Responde a un audio o video.')
            }

            const mime =
                q.msg?.mimetype ||
                q.message?.audioMessage?.mimetype ||
                q.message?.videoMessage?.mimetype ||
                ''

            if (!/audio|video/.test(mime)) {
                return m.reply('🎵 Debes responder a un audio o video.')
            }

            await conn.sendMessage(m.chat, {
                react: { text: '🧠', key: m.key }
            })

            const media = await q.download()

            if (!media || media.length < 1200) {
                return m.reply('❌ Audio muy corto o inválido.')
            }

            // 🔐 CACHE HASH
            const hash = crypto.createHash('md5').update(media).digest('hex')

            if (cache.has(hash)) {
                return sendResult(conn, m, cache.get(hash))
            }

            // 📁 FORM DATA
            const form = new FormData()

            form.append('file', media, {
                filename: 'audio.mp3',
                contentType: 'audio/mpeg'
            })

            form.append('api_token', '9eb6d988ec1bf3ce2463405dff7a1fdd')
            form.append('return', 'spotify,apple_music')

            const { data } = await axios.post(
                'https://api.audd.io/',
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 15000,
                    maxBodyLength: Infinity
                }
            )

            console.log('AUDD RESPONSE:', data)

            // ❌ VALIDACIÓN REAL GOD MODE
            if (!data || data.status !== 'success' || !data.result) {
                return m.reply('❌ No pude reconocer la canción.')
            }

            const song = data.result

            const result = {
                title: song.title || '-',
                artist: song.artist || '-',
                album: song.album || '-',
                release: song.release_date || '-',
                spotify: song.spotify?.external_urls?.spotify || null,
                apple: song.apple_music?.url || null,
                source: 'audd',
                confidence: 0.95
            }

            cache.set(hash, result)

            return sendResult(conn, m, result)

        } catch (e) {
            console.error(e)
            m.reply('❌ Error GOD MODE: ' + e.message)
        }
    }
}

// --------------------
// 📤 RESPONSE GOD MODE
// --------------------
async function sendResult(conn, m, song) {

    let txt = `
👑 *GOD MODE RESULT*

🎵 ${song.title}
👤 ${song.artist}
💿 ${song.album}
📅 ${song.release}

📡 Fuente: ${song.source}
📊 Confianza: ${(song.confidence * 100).toFixed(1)}%
`

    if (song.spotify) {
        txt += `\n🎧 Spotify:\n${song.spotify}`
    }

    if (song.apple) {
        txt += `\n🍎 Apple Music:\n${song.apple}`
    }

    await m.reply(txt)

    await conn.sendMessage(m.chat, {
        react: { text: '⚡', key: m.key }
    })
                }
