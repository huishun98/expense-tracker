import type { NextApiRequest, NextApiResponse } from "next";
import { Data, httpOpts, telegramBotApi } from "./webhook";


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {
    // Initialize webhook
    const resp = await fetch(`${telegramBotApi}/setWebhook`, { ...httpOpts, method: 'POST', body: JSON.stringify({ url: process.env.TELEGRAM_WEBHOOK }) });
    const data = await resp.json()
    console.log({ data })
    res.status(resp.status).json({ status: resp.status });
}
