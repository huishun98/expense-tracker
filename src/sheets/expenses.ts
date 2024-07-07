import pdf from 'pdf-parse';
import fs from 'fs';
import accounting from 'accounting'
import { spreadsheetInfo } from '@/constants';
import { sheets_v4 } from 'googleapis';
import { months } from './summary';

const exclusions = new Set(['Previous balance', 'Total outstanding balance', 'Closing balance'])

// https://www.npmjs.com/package/pdf-parse
const extractExpenses = async (text: string, ...args: any[]) => {
    const pattern = /(\d{1,2})\s(\w{3})\n?(.+?)(?:\n1\s\w{3}\s=\s[\d.,]+\sSGD\n[\d.,]+\s\w{3})?\n?(\+?\d{1,3}(?:,\d{3})*\.\d{2})/g;

    let matches;
    const results = [];

    while ((matches = pattern.exec(text)) !== null) {

        const day = matches[1].trim();

        const month = matches[2].trim();
        let monthIndex = months.indexOf(month.toLowerCase())
        if (monthIndex < 0) continue
        monthIndex = monthIndex + 1

        const description = matches[3].trim();
        let credit = 0, debit = 0

        const val = matches[4]
        if (val.charAt(0) == "+") {
            credit = accounting.unformat(val);
        } else {
            debit = accounting.unformat(val);
        }

        if (exclusions.has(description)) continue

        results.push([day, monthIndex, description, debit, credit, ...args]);
    }

    return results
}

const populateExpenses = async (sheets: sheets_v4.Sheets, filepath: string, ...args: any[]): Promise<number> => {
    let dataBuffer = fs.readFileSync(filepath);
    const { text } = await pdf(dataBuffer)
    const results = await extractExpenses(text, ...args)
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

const filterExpenses = async (sheets: sheets_v4.Sheets, month: number, year: number, opt?: string) => {
    // get old values
    const sheet = await sheets.spreadsheets.values.get({
        ...spreadsheetInfo,
        valueRenderOption: 'UNFORMATTED_VALUE',
    });
    let rows = sheet.data.values || [] as any[][];


    rows = rows.filter(row => {
        const condition = (opt === 'c' && row[4] - row[3] > 0) || (opt === 'd' && row[4] - row[3] < 0) || !opt
        return row[1] == month && row[6] == year && condition
    })
    return rows.sort((a, b) => a[0] - b[0]);
}

const formatExpenses = (expenses: any[][]): string => {
    return expenses.map((row, i) => {
        let day = row[0],
            description = row[2],
            expense = row[3] - row[4]
        return `${day}号 || ${expense > 0 ? `${expense}` : `(${expense * -1})`} || ${description.toLowerCase()}`
    }).join('\n');
}

export { populateExpenses, extractExpenses, filterExpenses, formatExpenses }
