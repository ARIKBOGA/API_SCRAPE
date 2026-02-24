import { PathRepo } from '../../../config/PathRepo';
import { readExcelSafe, writeExcelSafe } from '../../../io/utils/ExcelUtils';
import { ORJ_NO_ExcelRow } from '../../../utils/Types';


const inputFilePath = PathRepo.resources('/catalog/excels/ORJ_NO.xlsx');
const outputFilePath = PathRepo.output('/ALL/excels/OE/SUMMERIZED_ORJ_NO.xlsx');


async function summerize_ORJ_NO() {

    const summerizedData: ORJ_NO_ExcelRow[] = await readExcelSafe(inputFilePath);
    const son_kod_set = new Set<string>();
    const disc_drum_yvno_range = new Set<string>(Array.from({ length: 1580 }, (_, i) => String(i + 1).padStart(3, '0')));

    // Iterate through rows and perform summarization logic
    summerizedData.reduce((acc, row) => {
        const son_kod = row['yvNo']?.toString().substring(2).replace(/[^0-9]/g, '');
        const groupId = row['KATOLOG::grupId'];
        row['son_kod'] = son_kod || '';
        if (son_kod && (groupId === 1 || groupId === 2)) {
            son_kod_set.add(son_kod);
        }
        return acc;
    }, []);

    const uniqueSonKod = Array.from(son_kod_set).map((son_kod) => ({ son_kod }));
    const missingSonKod = Array.from(disc_drum_yvno_range).filter((code) => !son_kod_set.has(code)).map(code => ({ "Missing Codes": code }));

   

    await writeExcelSafe(outputFilePath,
        { name: 'YV_Summerized', data: summerizedData },
        { name: 'Unique_son_kod', data: uniqueSonKod },
        { name: 'Missing_son_kod', data: missingSonKod }
    )
    console.log(`Summarized data written to ${outputFilePath}`);
}

async function main() {
    await summerize_ORJ_NO().catch(console.error);
}

main();