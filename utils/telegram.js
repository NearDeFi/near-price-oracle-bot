const {TelegramClient} = require('messaging-api-telegram');

module.exports = {
    sendToTelegram: async function (message, accessToken, chatId) {
        try {
            if (accessToken && chatId) {
                const client = new TelegramClient({
                    accessToken
                });
                let resp = await client.sendMessage(chatId, message)
                    .catch(err => {
                        console.error(err);
                    });

                if(!resp.hasOwnProperty("messageId")) {
                    console.log(`sendToTelegram notification failed: ${JSON.stringify(resp)}`);
                }
            }
        }
        catch (err) {
            console.error(err)
        }
    },
}