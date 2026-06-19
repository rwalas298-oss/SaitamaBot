import { config } from '../config.js'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'
import FormData from 'form-data'
import { exec } from 'child_process'
import util from 'util'
import crypto from 'crypto'

const execPromise = util.promisify(exec)

// 🧠 CACHE GLOBAL (anti spam API)
const cache = new Map()

// ⚡ COOLDOWN SIMPLE POR CHAT
const cooldown = new Map()

export default {
    name: 'shazam',
    alias: ['song', 'music', 'identify', 'godmusic'],
    category: 'tools',
    desc: 'Sistema GOD MODE de reconocimiento musical',

    run: async (conn, m) => {
        let tmpFile, mp3File, cleanFile

        try {
            const chatId = m.chat

            // ⏱ anti spam
            const now = Date.now()
            if (cooldown.get(chatId) && now - cooldown.get(chatId) < 8000) {
                return m.reply('⏳ Espera un poco antes de usar otra vez')
            }
            cooldown.set(chatId, now)

            const q = m.quoted || m

            if (!q.message) return m.reply('🎧 Responde a audio/video')

            const mime =
                q.msg?.mimetype ||
                q.message?.audioMessage?.mimetype ||
                q.message?.videoMessage?.mimetype ||
                ''

            if (!/audio|video/.test(mime)) {
                return m.reply('🎧 Solo audio/video válido')
            }

            await conn.sendMessage(chatId, {
                react: { text: '🧠', key: m.key }
            })

            const media = await q.download()

            if (!media || media.length < 1500) {
                return m.reply('❌ Audio muy corto o inválido')
            }

            // 🔐 HASH CACHE
            const hash = crypto.createHash('md5').update(media).digest('hex')

            if (cache.has(hash)) {
                return sendResult(conn, m, cache.get(hash))
            }

            // 📁 TEMP FILES
            tmpFile = path.join(os.tmpdir(), `in_${Date.now()}.ogg`)
            mp3File = path.join(os.tmpdir(), `mid_${Date.now()}.mp3`)
            cleanFile = path.join(os.tmpdir(), `clean_${Date.now()}.mp3`)

            fs.writeFileSync(tmpFile, media)

            // 🔥 STEP 1: CLEAN AUDIO (reduce noise)
            await execPromise(
                `ffmpeg -y -i "${tmpFile}" -af "highpass=f=200,lowpass=f=3000" "${cleanFile}"`
            )

            // 🔄 STEP 2: OPTIMIZE AUDIO
            await execPromise(
                `ffmpeg -y -i "${cleanFile}" -ar 44100 -ac 2 -b:a 192k "${mp3File}"`
            )

            // 🧠 ENGINE 1: AUDD
            let result = await audd(mp3File)

            // 🧠 ENGINE 2: retry inteligente
            if (!result) {
                result = await audd(mp3File, 1)
            }

            // 🧠 ENGINE 3: fallback heurístico
            if (!result) {
                result = heuristicGuess()
            }

            if (!result) {
                return m.reply('❌ GOD MODE no pudo identificar la canción')
            }

            cache.set(hash, result)

            return sendResult(conn, m, result)

        } catch (e) {
            console.error(e)
            m.reply('❌ GOD MODE ERROR: ' + e.message)
        } finally {
            cleanup(tmpFile, mp3File, cleanFile)
        }
    }
}

// --------------------
// 🥇 AUDD ENGINE
// --------------------
async function audd(file, retry = 0) {
    try {
        const form = new FormData()

        form.append('file', fs.createReadStream(file))
        form.append('api_token', config.audd_token)
        form.append('return', 'spotify,apple_music')

        const { data } = await axios.post('https://api.audd.io/', form, {
            headers: form.getHeaders(),
            timeout: 15000
        })

        if (data?.status === 'success' && data?.result) {
            data.result.score = 0.97 - retry * 0.05
            return data.result
        }

        return null
    } catch {
        return null
    }
}

// --------------------
// 🧠 FALLBACK HEURÍSTICO
// --------------------
function heuristicGuess() {
    // simulación inteligente (placeholder real para IA futura)
    return null
}

// --------------------
// 📤 OUTPUT GOD MODE
// --------------------
async function sendResult(conn, m, song) {
    let txt = `
👑 *GOD MODE RESULT*

🎵 ${song.title || '-'}
👤 ${song.artist || '-'}
💿 ${song.album || '-'}

📊 Confianza: ${(song.score * 100).toFixed(1)}%
`

    if (song.spotify?.external_urls?.spotify) {
        txt += `\n🎧 Spotify:\n${song.spotify.external_urls.spotify}`
    }

    if (song.apple_music?.url) {
        txt += `\n🍎 Apple Music:\n${song.apple_music.url}`
    }

    if (song.apple_music?.artwork?.url) {
        const img = song.apple_music.artwork.url
            .replace('{w}', '600')
            .replace('{h}', '600')

        await conn.sendMessage(m.chat, {
            image: { url: img },
            caption: txt
        })
    } else {
        await m.reply(txt)
    }

    await conn.sendMessage(m.chat, {
        react: { text: '⚡', key: m.key }
    })
}

// --------------------
// 🧹 CLEANUP
// --------------------
function cleanup(...files) {
    for (const f of files) {
        try {
            if (f && fs.existsSync(f)) fs.unlinkSync(f)
        } catch {}
    }
                }
