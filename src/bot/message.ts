import { httpOpts, telegramBotApi } from "@/constants";

const sendMessage = async (chatId: number, content: string) => {
    const opts = {
        ...httpOpts,
        method: 'POST',
        body: JSON.stringify({
            chat_id: chatId,
            text: content,
        })
    }
    const resp = await fetch(`${telegramBotApi}/sendMessage`, opts);
    if (resp.status != 200) {
        console.error(`failed to send message\n${await resp.text()}`)
    }
    return resp
}

export { sendMessage }
