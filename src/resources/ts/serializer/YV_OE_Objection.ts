import { PathRepo } from "../../../config/PathRepo";
import { writeJSONSafe } from "../../../io/utils/Json_Utils";
import { get_YV_OE_Map } from "../../../io/utils/ORJ_NO_Utils";

async function convertToJSONFromExcelAsYV_OE() {
    const resultMap = await get_YV_OE_Map();
    const result: { YV: string, OE: string[] }[] = Array.from(resultMap.entries())
                                                        .map(([key, value]) => ({ YV: key, OE: value }));

    const OUTPUT_PATH = PathRepo.resources('catalog/jsons/YV_OE_Objection.json');

    await writeJSONSafe(OUTPUT_PATH, result);

    console.log('"YV_OE_Objection" Excel dosyası nesne dizisi formatında JSON\'a dönüştürüldü ==>', OUTPUT_PATH);
}

convertToJSONFromExcelAsYV_OE();