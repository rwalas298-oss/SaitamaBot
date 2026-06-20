const pack = {
    name: 'pack',
    alias: ['girls', 'packgirls'],
    category: 'nsfw',
    noPrefix: true,

    run: async (conn, m) => {
        try {

            // 📡 API que devuelve imagen directa
            const image = 'https://api.delirius.store/nsfw/girls'

            // 📦 Enviar mensaje con card (compatible con Todleys)
            await conn.sendMessage(m.chat, {
                text: '📦 *Pack Girls*',

                footer: 'SAITAMABOT packs',

                cards: [
                    {
                        image: {
                            url: image
                        },

                        title: '📦 Pack Girls',

                        body: '➡️ Presiona el botón para otra imagen aleatoria',

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

        } catch (error) {
            console.log(error)
            m.reply('❌ Error al obtener el pack')
        }
    }
}

export default pack
