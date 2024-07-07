# Expense Tracker

This is a personal expense tracker integrated with Telegram bots and Google Sheets.

Supports bank statements from:
- Trust bank

Details get auto-populated in your own google sheets when you forward a bank statement to your Telegram bot.

## Getting Started

Set required environment variables — see [constants.ts](./src/constants.ts).

```bash
# run the development server
pnpm dev

# in another terminal, run ngrok to expose a public webhook url
ngrok http 3000

# register your webhook with Telegram
curl https://api.telegram.org/bot<bot-token>/setWebhook?url=<ngrok-base-url>/api/webhook
```
