const pack = {
    name: 'pack',
    noPrefix: true,

    run: async (conn, m) => {
        try {
            await conn.sendMessage(m.chat, {
                image: {
                    url: 'https://api.delirius.store/nsfw/girls'
                },

                caption: '📦 *Pack Girls*\n\n➡️ Pulsa para otra imagen aleatoria',

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
            }, { quoted: m })

        } catch (e) {
            console.log(e)
            m.reply('❌ Error al obtener imagen')
        }
    }
}

export default pack
