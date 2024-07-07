import pdf from 'pdf-parse';
import fs from 'fs';
import accounting from 'accounting'
import { spreadsheetInfo } from '@/constants';
import { sheets_v4 } from 'googleapis';

const exclusions = new Set(['Previous balance', 'Total outstanding balance', 'Closing balance', 'Credit card payment'])

// https://www.npmjs.com/package/pdf-parse
const extractExpenses = async (filepath: string, ...args: any[]) => {
    let dataBuffer = fs.readFileSync(filepath);

    const data = await pdf(dataBuffer)
    const pattern = /(\d{1,2} \w{3})(.+?)\n?(\+?\d{1,3}(?:,\d{3})*\.\d{2})/g;

    let matches;
    const results = [];

    while ((matches = pattern.exec(data.text)) !== null) {
        const date = matches[1].trim();
        const description = matches[2].trim();
        let credit = 0, debit = 0

        if (matches[3].charAt(0) == "+") {
            credit = accounting.unformat(matches[3]);
        } else {
            debit = accounting.unformat(matches[3]);
        }

        if (exclusions.has(description)) continue

        results.push([date, description, debit, credit, ...args]);
    }

    return results
}

const populateExpenses = async (sheets: sheets_v4.Sheets, filepath: string, ...args: any[]): Promise<number> => {
    const results = await extractExpenses(filepath, ...args)
    if (results.length <= 0) {
        return 404
    }

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

    return update.status
}

export { populateExpenses }
