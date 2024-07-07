import { spreadsheetInfo } from "@/constants";
import { sheets_v4 } from "googleapis";

const months = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]

const getSummary = async (sheets: sheets_v4.Sheets): Promise<any[][]> => {
    const sheet = await sheets.spreadsheets.values.get({
        ...spreadsheetInfo,
        valueRenderOption: 'UNFORMATTED_VALUE',
        range: 'Summary!A:E',
    });
    return sheet.data.values || [] as any[][];
}

const formatSummary = (summary: any[][]): string => {
    return summary.map((row, i) => {
        if (i == 0) return
        let month = months[row[1] - 1],
            year = row[0],
            val = row[4].toFixed(2)
        month = month.charAt(0).toUpperCase() + month.slice(1);
        return `${month} ${year} — ${val}`
    }).join('\n');
}

export { getSummary, formatSummary, months }
