import { PathRepo } from '../../../config/PathRepo';
import { writeJSONSafe } from '../../../io/utils/Json_Utils';
import { get_OE_YV_Map } from '../../../io/utils/ORJ_NO_Utils';

async function convertToJSonFromExcel() {

    const resultMap = await get_OE_YV_Map();
    const result: { OE: string, YV: string[] }[] = Array.from(resultMap.entries()).map(([key, value]) => ({ OE: key, YV: value }));

    const OUTPUT_PATH = PathRepo.resources('catalog/jsons/ORJ_NO.json');

    await writeJSONSafe(OUTPUT_PATH, result);

    console.log('\"ORJ_NO\" Excel dosyası nesne dizisi formatında JSON\'a dönüştürüldü ==>', OUTPUT_PATH);
}

convertToJSonFromExcel();