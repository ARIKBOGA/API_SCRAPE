import { PRODUCT_TYPE } from '../../config/env';
import { PathRepo } from "../../config/PathRepo";
import { readJSONSafe, writeJSONSafe } from "../../io/utils/Json_Utils";
import { OERoot } from "../../utils/Types";
import { normalize_OE } from "./Utils";


async function convertScrapedOENumbersJsonTo_OE_YV_map(filename: string) {

    const inputFilepath = PathRepo.output(`${PRODUCT_TYPE}/jsons/OE/oe-numbers_${filename}.json`);
    const outputFilepath = PathRepo.resources(`catalog/jsons/OE_YV_MAP_${filename}.json`);

    const data: OERoot[] = await readJSONSafe(inputFilepath);

    const resultMap: { OE: string, YV: string[] }[] = [];

    data.forEach((item: OERoot) => {
        item.oeNumbers.forEach(oeElement => {
            oeElement.numbers.forEach(oe => {
                const normalizedOE = normalize_OE(oe);
                if (!resultMap.find(result => result.OE === normalizedOE)) {
                    resultMap.push({ OE: normalizedOE, YV: [item.yvNo] });
                } else {
                    if (!resultMap.find(result => result.OE === normalizedOE)?.YV.includes(item.yvNo)) {
                        resultMap.find(result => result.OE === normalizedOE)?.YV.push(item.yvNo);
                    }
                }
            })
        })
    })

    await writeJSONSafe(outputFilepath, resultMap);
}