// =============== APP CONFIGURATION ===============

const httpOpts = { headers: { 'Content-Type': 'application/json' } };
const tmpDir = process.env.TMP_DIR || "/tmp/"

// =============== TELEGRAM BOT ===============

const telegramBotApi = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`
const telegramFileApi = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}`
const telegramWebhook = process.env.TELEGRAM_WEBHOOK
const telegramChatId = Number(process.env.TELEGRAM_CHAT_ID)

// =============== GOOGLE SPREADSHEET ===============

const googleCreds = process.env.GSHEET_CREDS || ""
const spreadsheetInfo = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Raw!A2:G',
}
const spreadsheetURL = `https://docs.google.com/spreadsheets/d/${spreadsheetInfo.spreadsheetId}`

export { httpOpts, telegramBotApi, telegramFileApi, spreadsheetInfo, telegramWebhook, tmpDir, telegramChatId, googleCreds, spreadsheetURL }
