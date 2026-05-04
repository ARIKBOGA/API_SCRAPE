import { FILTER_BRAND, PRODUCT_TYPE } from '../../config/env';
import { PathRepo } from '../../config/PathRepo';
import { writeExcelSafe } from '../../io/utils/ExcelUtils';
import { AttributeItem } from '../../utils/Types';


export async function scraped_Attributes_JsonToExcel(results: AttributeItem[]) {

    const OUTPUT_FILE = PathRepo.output(`${PRODUCT_TYPE}/excels/Attributes`, `Attributes_${PRODUCT_TYPE}_${FILTER_BRAND}.xlsx`);

    // Veriyi düz (flat) satır yapısına dönüştür.
    const rows = results.flatMap(item => {
        const { yvNo, crossNumber, supplier, attributes } = item;
        const attributeMap: Record<string, string> = Object.fromEntries(attributes.map(attr => [attr.name, attr.value]));

        

        // Ana verileri ve attribute'leri tek bir objede birleştir
        return {
            yvNo,
            crossNumber,
            supplier,
            ...attributeMap
        }
    });

    await writeExcelSafe(OUTPUT_FILE, { name: 'Attributes', data: rows });

}
