import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'

export default {
    name: 'shazam',
    alias: ['song', 'whatmusic', 'music'],
    category: 'tools',
    desc: 'Reconoce canciones de audios o videos.',

    run: async (conn, m) => {
        try {

            const q = m.quoted || m

            if (!q.message) {
                return m.reply(
                    `*${config.visuals.emoji2}* Responde a un audio o video.`
                )
            }

            const mime =
                q.msg?.mimetype ||
                q.message?.audioMessage?.mimetype ||
                q.message?.videoMessage?.mimetype ||
                ''

            if (!/audio|video/.test(mime)) {
                return m.reply(
                    `*${config.visuals.emoji2}* Responde a un audio o video.`
                )
            }

            await conn.sendMessage(m.chat, {
                react: {
                    text: '🎵',
                    key: m.key
                }
            })

            const media = await q.download()

            const form = new FormData()

            form.append(
                'file',
                Buffer.from(media),
                'audio.mp3'
            )

            form.append(
                'api_token',
                '9eb6d988ec1bf3ce2463405dff7a1fdd'
            )

            form.append(
                'return',
                'spotify,apple_music'
            )

            const { data } = await axios.post(
                'https://api.audd.io/',
                form,
                {
                    headers: form.getHeaders(),
                    maxBodyLength: Infinity
                }
            )

            if (!data?.result) {
                return m.reply(
                    '❌ No pude reconocer la canción.'
                )
            }

            const song = data.result

            let txt =
`🎵 *Canción encontrada*

📌 Título:
> ${song.title || '-'}

👤 Artista:
> ${song.artist || '-'}

💿 Álbum:
> ${song.album || '-'}

📅 Lanzamiento:
> ${song.release_date || '-'}`

            if (song.spotify?.external_urls?.spotify) {
                txt += `

🎧 Spotify:
> ${song.spotify.external_urls.spotify}`
            }

            if (song.apple_music?.url) {
                txt += `

🍎 Apple Music:
> ${song.apple_music.url}`
            }

            await m.reply(txt)

            await conn.sendMessage(m.chat, {
                react: {
                    text: '✅',
                    key: m.key
                }
            })

        } catch (e) {

            console.error(e)

            await conn.sendMessage(m.chat, {
                react: {
                    text: '✖️',
                    key: m.key
                }
            })

            m.reply(
                `❌ Error: ${e.message}`
            )
        }
    }
}
