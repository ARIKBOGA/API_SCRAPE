import { ORJ_NO_MAP_GroupedByID } from "../../../io/utils/ORJ_NO_Utils";
import { writeExcelSafe } from "../../../io/utils/ExcelUtils";
import { KATALOG } from "../../../config/API_Scrapers_Data";
import { PathRepo } from "../../../config/PathRepo";



/**
 * INFO: was created to check whether any OE number represents/belongs to more than one YV number.
 */
async function checkDoubleIndicatorsInOEnumbers() {

    const OUTPUT_PATH = PathRepo.output('HealthCheck/DoubleIndicatorsInOEnumbers.xlsx');

    const groupMap = KATALOG.PRODUCT_GROUPS_MAP;

    const excelSheets: { name: string; data: { OE: string; YV: string; }[]; }[] = [];

    for (const [key, value] of groupMap) {

        const resultMap = await ORJ_NO_MAP_GroupedByID(value);
        const duplicatedDataRows: { OE: string; YV: string }[] = [];

        for (const [resultKey, resultValue] of resultMap) {
            const yvSet = new Set(resultValue.map(yv => yv.replace(/[CSBH]/g, '')));
            if (yvSet.size > 1) {
                duplicatedDataRows.push({ OE: resultKey, YV: Array.from(yvSet).join(", ") });
            }
        }
        excelSheets.push({ name: key, data: duplicatedDataRows });
    }

    await writeExcelSafe(OUTPUT_PATH, ...excelSheets);
    console.log(`✨ Excel dosyası oluşturuldu: ${OUTPUT_PATH}`);

}

checkDoubleIndicatorsInOEnumbers();