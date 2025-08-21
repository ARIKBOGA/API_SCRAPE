import fs from 'fs';
import path from 'path';


type Product = { disc: string[], drum: string[], pad: string[] };

/**
 * 
 * @param superset The CODES prepared by us and given to them
 * @param subset The CODES gotten from the SERCONS as response
 * @returns an array of CODES which are on our list but not included in the draft sent by SERCONS
 */
function findMissingElements<T>(superset: T[], subset: T[]): T[] {
    const subsetSet = new Set(subset);
    return superset.filter(item => !subsetSet.has(item));
}

function getJsonFiles(): { response: Product, generated: Product } {
    return {
        response: {
            pad: require('../jsons/response/pad_response.json'),
            disc: require('../jsons/response/disc_response.json'),
            drum: require('../jsons/response/drum_response.json')
        },
        generated: {
            pad: require('../jsons/generated/pad_generated.json'),
            disc: require('../jsons/generated/disc_generated.json'),
            drum: require('../jsons/generated/drum_generated.json')
        }
    };
}


function main() {

    const { response, generated } = getJsonFiles();

    const missingPads = findMissingElements(generated.pad, response.pad);
    const missingDiscs = findMissingElements(generated.disc, response.disc);
    const missingDrums = findMissingElements(generated.drum, response.drum);

    fs.writeFileSync(path.resolve(__dirname, `../jsons/missing/pad_missing.json`), JSON.stringify(missingPads, null, 2));
    fs.writeFileSync(path.resolve(__dirname, `../jsons/missing/disc_missing.json`), JSON.stringify(missingDiscs, null, 2));
    fs.writeFileSync(path.resolve(__dirname, `../jsons/missing/drum_missing.json`), JSON.stringify(missingDrums, null, 2));
}

main();