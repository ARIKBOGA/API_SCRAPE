import { PathRepo } from '../../../config/PathRepo';
import { writeExcelSafe } from '../../../io/utils/ExcelUtils';
import { ORJ_NO_EXCEL } from '../../../io/utils/ORJ_NO_Utils';
import { ORJ_NO_ExcelRow } from '../../../utils/Types';

async function getDuplicatedOENumbers() {
  const rows = await ORJ_NO_EXCEL();

  const duplicatedMap = new Map<string, number>();

  rows.reduce((map, row) => {
    const yvNo = row['yvNo'];
    const orjNo = row['orjNo'];
    const markaID = row['markaId'];
    const key = `${yvNo}_${orjNo}_${markaID}`;

    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, duplicatedMap);

  const duplicatedData = Array.from(duplicatedMap.entries())
    .filter(([_, count]) => count > 1)
    .map(([key, count]) => {
      const [yvNo, orjNo, markaID] = key.split('_');
      return { yvNo, orjNo, markaID, count };
    });

  console.log(`Toplam ${duplicatedData.length} adet mükerrer OE numarası bulundu.`,);

  console.table(duplicatedData);
}

async function removeDuplicatedAndWriteToExcel() {

    const rows = await ORJ_NO_EXCEL();

    const newRows: ORJ_NO_ExcelRow[] = [];
    const seenKeys = new Set<string>();

    for (const row of rows) {
        const yvNo = row['yvNo'];
        const orjNo = row['orjNo'];
        const markaID = row['markaId'];

        if(!yvNo || !orjNo) {
            continue;
        }


        const key = `${yvNo}_${orjNo}_${markaID}`;

        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            newRows.push(row);
        }

    }

    await writeExcelSafe(PathRepo.output('HealthCheck/ORJ_NO_RemovedDeduplicated.xlsx'), { name: 'Unique', data: newRows });
}

removeDuplicatedAndWriteToExcel();
