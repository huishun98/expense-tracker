// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Message } from "@/bot/types";
import { sendMessage } from "@/bot/message";
import { downloadFile } from "@/bot/document";
import { filterExpenses, formatExpenses, populateExpenses } from "@/sheets/expenses";
import { googleCreds, spreadsheetURL, telegramChatId, tmpDir } from "@/constants";
import { authenticate } from "@/sheets/auth";
import { formatSummary, getSummary } from "@/sheets/summary";

export type Data = {
  status: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {

  const { body } = req;
  if (!body || !body["message"]) {
    res.status(200).json({ status: 200 });
    return
  }

  const message = body["message"] as Message
  if (message.from.id != telegramChatId) {
    await sendMessage(message.chat.id, "unauthorized")
    res.status(401).json({ status: 401 });
    return
  }

  let status = 200

  let text = message.caption || message.text || ""
  text = text.toLowerCase().trim()

  let sheets, msg, match;

  switch (text) {
    case "/summary":
      sheets = authenticate(googleCreds);
      const summary = await getSummary(sheets)
      msg = `${formatSummary(summary)}\n\n${spreadsheetURL}`
      await sendMessage(message.chat.id, msg)
      break;
    case "trust":
      let { status, destination } = await downloadFile(message, tmpDir)
      if (status != 201 || !destination) break;

      sheets = authenticate(googleCreds)

      match = destination.match(/\b\d{4}\b/)
      const year: number = match ? Number(match[0]) : new Date().getFullYear();
      status = await populateExpenses(sheets, destination, text, year)
      if (status == 404) {
        await sendMessage(message.chat.id, "no data in file")
        break;
      }

      msg = `Done ${spreadsheetURL}`
      await sendMessage(message.chat.id, msg)
      break;
    default:
      // accepts monthyear e.g. 0324
      match = text.match(/^(\d{2})(\d{2})([dc])?$/);
      if (!match) break;
      sheets = authenticate(googleCreds);
      const expenses = await filterExpenses(sheets, Number(match[1]), Number(`20${match[2]}`), match[3]);
      msg = formatExpenses(expenses)
      await sendMessage(message.chat.id, msg)
  }

  res.status(status).json({ status });
}
