import axios from 'axios'

const pack = {
    name: 'pack',
    alias: ['girls'],
    category: 'nsfw',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            await conn.sendMessage(m.chat, {
                react: {
                    text: '📦',
                    key: m.key
                }
            })

            const { data } = await axios.get(
                'https://api.delirius.store/nsfw/girls'
            )

            const image = data?.data?.url || data?.url

            if (!image) {
                return m.reply('❌ No se pudo obtener una imagen.')
            }

            await conn.sendMessage(
                m.chat,
                {
                    image: {
                        url: image
                    },

                    caption:
                        '📦 *Pack Girls*\n\n' +
                        'Presiona el botón para otra imagen aleatoria.',

                    footer: 'SaitamaBot-Sckt-MD',

                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '➡️ Siguiente Imagen',
                                id: '.pack'
                            })
                        }
                    ]
                },
                {
                    quoted: m
                }
            )

        } catch (error) {
            console.log(error)

            await conn.sendMessage(m.chat, {
                react: {
                    text: '❌',
                    key: m.key
                }
            })

            m.reply('❌ Error al obtener la imagen.')
        }
    }
}

export default pack
