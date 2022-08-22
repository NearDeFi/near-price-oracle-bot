const { sendToTelegram } = require("./telegram");
const config = require("../config");

module.exports = {
    notify: async function(message){
        let token = config.TELEGRAM_TOKEN;
        let chatId = config.TELEGRAM_CHAT_ID;

        if(token && chatId) {
            await sendToTelegram(message, token, chatId);
        }
    }
}