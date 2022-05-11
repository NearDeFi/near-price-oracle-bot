const {TelegramClient} = require('messaging-api-telegram');

module.exports = {
    sendToTelegram: async function (message, accessToken, chatId) {
        try {
            if (accessToken && chatId) {
                const client = new TelegramClient({
                    accessToken
                });
                await client.sendMessage(chatId, message)
                    .catch(err => {
                        console.error(err);
                    });
            }
        }
        catch (err) {
            console.error(err)
        }
    },
}