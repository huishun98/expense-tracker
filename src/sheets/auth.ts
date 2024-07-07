import { google } from 'googleapis'

const authenticate = (encodedCreds: string) => {
    const content = atob(encodedCreds)
    const credentials = JSON.parse(content);
    const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

export { authenticate }
