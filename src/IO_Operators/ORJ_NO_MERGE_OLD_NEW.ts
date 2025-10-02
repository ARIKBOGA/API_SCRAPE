import xlsx from 'xlsx';
import path from 'path';


type RowData = {
    ID: number
    OE: string;
    YV: string;
    markaId: number | null;
}

const old_input = path.resolve(__dirname, '../output/ALL/excels/OE/ORJ_NO_KATALOG_ESKİ.xlsx');
const new_input = path.resolve(__dirname, '../output/ALL/excels/OE/ORJ_NO_KATALOG_YENİ.xlsx');

function getRowdata(filepath: string) {
    const wb = xlsx.readFile(filepath, { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any = xlsx.utils.sheet_to_json(ws);
    return data as RowData[];
}

function mergeRowdata(oldData: RowData[], newData: RowData[]) {

    let counter = 0;

    oldData.forEach(oldRow => {
        const existingRow = newData.find(row => row.OE === oldRow.OE);
        if (!existingRow) {
            counter++;
            newData.push(oldRow);
        }
    })

    // sort by YV codes as string
    newData.sort((a, b) => a.YV.localeCompare(b.YV));
    console.log(counter);
    return newData;
}

function main() {
    const oldData = getRowdata(old_input);
    const newData = getRowdata(new_input);

    const mergedData = mergeRowdata(oldData, newData);
    const ws = xlsx.utils.json_to_sheet(mergedData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "ORJ_NO_MERGE_OLD_NEW");
    xlsx.writeFile(wb, path.resolve(__dirname, '../output/ALL/excels/OE/ORJ_NO_MERGE_OLD_NEW.xlsx'));
}

main();