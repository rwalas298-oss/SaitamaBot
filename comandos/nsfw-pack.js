import axios from 'axios'

const pack = {
    name: 'pack',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            const { data } = await axios.get(
                'https://api.delirius.store/nsfw/girls'
            )

            const image = data?.data || data?.url

            if (!image) return m.reply('❌ No se pudo obtener imagen')

            await conn.sendMessage(m.chat, {
                text: '📦 *Pack Girls*',

                footer: 'Todleys Bot',

                cards: [
                    {
                        image: {
                            url: image
                        },

                        title: '📦 Pack Girls',

                        body: '➡️ Pulsa el botón para otra imagen',

                        footer: 'Todleys Bot',

                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '➡️ Siguiente Pack',
                                    id: '.pack'
                                })
                            }
                        ]
                    }
                ]
            }, { quoted: m })

        } catch (e) {
            console.log(e)
            m.reply('❌ Error al obtener pack')
        }
    }
}

export default pack
