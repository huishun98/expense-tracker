import type { NextApiRequest, NextApiResponse } from "next";
import { httpOpts, telegramBotApi, telegramWebhook } from "@/constants";

interface Response {
    ok: boolean
    result: boolean
    description: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response>,
) {
    // Initialize webhook
    const resp = await fetch(`${telegramBotApi}/setWebhook`, { ...httpOpts, method: 'POST', body: JSON.stringify({ url: telegramWebhook }) });
    const data = await resp.json() as Response
    res.status(resp.status).json(data);
}
