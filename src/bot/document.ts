import fs from 'fs';
import { DocumentInfo, Message } from "@/bot/types";
import { sendMessage } from "@/bot/message";
import { httpOpts, telegramBotApi, telegramFileApi } from '@/constants';
import path from 'path';
const { Readable } = require('stream');
const { finished } = require('stream/promises');

interface Response {
    status: number
    destination?: string
}

const downloadFile = async (message: Message, directory: string): Promise<Response> => {
    if (!message.document) return { status: 404 }

    let resp = await fetch(`${telegramBotApi}/getFile?file_id=${message.document.file_id}`, { ...httpOpts });
    let { result } = await resp.json()

    if (!result) {
        await sendMessage(message.chat.id, "failed to get file")
        return { status: 500 }
    }

    const file = result as DocumentInfo
    if (file.file_path.split('.').pop() != "pdf") {
        await sendMessage(message.chat.id, "not a pdf file")
        return { status: 200 }
    }

    resp = await fetch(`${telegramFileApi}/${file.file_path}`, { ...httpOpts });
    if (!resp.body) {
        await sendMessage(message.chat.id, "failed to fetch file")
        return { status: 500 }
    }

    // download file
    const destination = path.resolve(directory, message.document.file_name)
    // if (fs.existsSync(destination)) fs.unlinkSync(destination);
    const pdfFiles = require("glob").globSync("*.pdf", { cwd: directory });
    for (const filename of pdfFiles) fs.unlinkSync(path.resolve(directory, filename));

    const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
    await finished(Readable.fromWeb(resp.body).pipe(fileStream));
    return { status: 201, destination }
}

export { downloadFile }
