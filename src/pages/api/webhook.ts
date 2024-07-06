// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from 'fs';
import pdf from 'pdf-parse';
import { google } from 'googleapis'
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const telegramBotApi = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`
const telegramFileApi = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}`
const pdfFile = "test.pdf"
const httpOpts = { headers: { 'Content-Type': 'application/json' } };
const exclusions = new Set(['Previous balance', 'Total outstanding balance', 'Closing balance'])
const spreadsheetInfo = {
  spreadsheetId: process.env.SPREADSHEET_ID,
  range: 'Sheet1!A2:E',
}

type Data = {
  status: number;
};

interface Message {
  message_id: number
  from: From
  chat: Chat
  date: number
  text?: string
  document?: Document
}

interface From {
  id: number
  is_bot: boolean
  first_name: string
  language_code: string
}

interface Chat {
  id: number
  first_name: string
  type: string
}

interface Document {
  file_name: string
  mime_type: string
  file_id: string
  file_unique_id: string
  file_size: number
}

interface File {
  file_path: string
  file_id: string
  file_unique_id: string
  file_size: number
}

// Initialize webhook
fetch(`${telegramBotApi}/setWebhook`, { ...httpOpts, method: 'POST', body: JSON.stringify({ url: process.env.TELEGRAM_WEBHOOK }) });

const sendMessage = async (chatId: number, content: string) => {
  const resp = await fetch(`${telegramBotApi}/sendMessage`,
    {
      ...httpOpts,
      method: 'POST',
      body: JSON.stringify({
        chat_id: chatId,
        text: content
      })
    }
  );
  if (resp.status != 200) {
    console.error(`failed to send message, status: ${resp.status}`)
  }
  return resp
}

// https://www.npmjs.com/package/pdf-parse
const extractInfo = async (pdfUrl: string, year: number) => {
  let dataBuffer = fs.readFileSync(pdfUrl);

  function render_page(pageData: any) {
    //check documents https://mozilla.github.io/pdf.js/
    let render_options = {
      //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
      normalizeWhitespace: false,
      //do not attempt to combine same line TextItem's. The default value is `false`.
      disableCombineTextItems: false
    }

    return pageData.getTextContent(render_options)
      .then((textContent: any) => {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        return text;
      });
  }

  const data = await pdf(dataBuffer, { pagerender: render_page })
  const pattern = /(\d{1,2} \w{3})([A-Za-z0-9 \/\&]+?)(\d+\.\d{2})/g;

  let matches;
  const results = [];

  while ((matches = pattern.exec(data.text)) !== null) {
    const date = matches[1].trim();
    const description = matches[2].trim();
    const amount = parseFloat(matches[3]);

    if (exclusions.has(description)) continue

    results.push([year, date, description, amount]);
  }

  return results
}

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
  if (message.from.id != Number(process.env.TELEGRAM_CHAT_ID)) {
    await sendMessage(message.chat.id, "unauthorized")
    res.status(401).json({ status: 401 });
    return
  }

  if (!message.document) {
    res.status(200).json({ status: 200 });
    return
  }

  let resp = await fetch(`${telegramBotApi}/getFile?file_id=${message.document.file_id}`, { ...httpOpts });
  let { result } = await resp.json()

  if (!result) {
    await sendMessage(message.chat.id, "failed to get file")
    res.status(500).json({ status: 500 });
    return
  }

  const file = result as File
  if (file.file_path.split('.').pop() != "pdf") {
    await sendMessage(message.chat.id, "not a pdf file")
    res.status(200).json({ status: 200 });
    return
  }

  resp = await fetch(`${telegramFileApi}/${file.file_path}`, { ...httpOpts });
  if (!resp.body) {
    await sendMessage(message.chat.id, "failed to download file")
    res.status(500).json({ status: 500 });
    return
  }

  const destination = path.resolve("./", pdfFile);
  if (fs.existsSync(destination)) fs.unlinkSync(destination);

  const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
  await finished(Readable.fromWeb(resp.body).pipe(fileStream));

  const results = await extractInfo(destination, 2024)
  if (results.length <= 0) {
    await sendMessage(message.chat.id, "no data in file")
    res.status(200).json({ status: 200 });
    return
  }

  // connect to db
  const content = atob(`${process.env.GSHEET_CREDS}`)
  const credentials = JSON.parse(content);

  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // get old values
  const sheet = await sheets.spreadsheets.values.get({
    ...spreadsheetInfo,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  let rows = sheet.data.values || [] as any[][];

  // remove duplicates
  const checker = new Set(results.map(innerArray => JSON.stringify(innerArray)))
  rows = rows.filter(row => !checker.has(JSON.stringify(row)))
  rows.push(...results)

  // update spreadsheet
  const update = await sheets.spreadsheets.values.update({
    ...spreadsheetInfo,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  })

  await sendMessage(message.chat.id, "Done")

  res.status(update.status).json({ status: update.status });
}
