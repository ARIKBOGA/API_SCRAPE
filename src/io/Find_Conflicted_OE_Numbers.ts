import { getORJ_NO_DATA } from './utils/Reader_Utils';



const data: any = getORJ_NO_DATA();
console.log(data.length);

const allMap = new Map<string, string[]>();
const conflicted = new Map<string, string[]>();

data.filter((item: any) => item["KATOLOG::grupId"] == "1" || item["KATOLOG::grupId"] == "2")
    .forEach((row: any) => {
        const oe = row["orjNo"];
        const yv = row["yvNo"];

        if (allMap.has(oe)) {
            const existing = allMap.get(oe) || [];
            allMap.set(oe, [...existing, yv]);
        } else {
            allMap.set(oe, [yv]);
        }
    })

allMap.forEach((value, key) => {
    if (value.length > 1) {
        value = Array.from(new Set(value.map(yv => yv.replace(/[^0-9]/g, ''))));
        if (value.length > 1) {
            conflicted.set(key, value);
        }
    }
})


console.log(conflicted);