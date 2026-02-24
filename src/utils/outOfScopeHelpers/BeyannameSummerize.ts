import { PathRepo } from "../../config/PathRepo";
import { readExcelSafe, writeExcelSafe } from "../../io/utils/ExcelUtils";

type Beyanname = {
    "Tarih": string,
    "GB No": string,
    "Tescil No": string,
    "Tescil Tip": string,
    "Satır": string,
    "Durum": string,
    "Gen. Sek.": string,
    "İhracatçı": string,
    "İmalatçı": string,
    "Ülke": string,
    "Gümrük": string,
    "GTIP": string,
    "Miktar Net (KG)": number,
    "Miktar Brüt (KG)": number,
    "Miktar Kodu": string,
    "FOB USD": number,
    "Kalem Fiyatı": number,
    "Döviz Kod": string,
    "Teslim Şekli": string,
    "Gümrük Müşaviri Vergi Numarası": string,
    "Gümrük Müşaviri": string,
    [key: string]: any
};

async function summerize() {

    const INPUT_FILEPATH = PathRepo.utils(`outOfScopeHelpers/beyannameler_2025.xlsx`);
    const OUTPUT_PATH = PathRepo.utils(`outOfScopeHelpers/beyannameler_2025_summerized.xlsx`);
    const data: Beyanname[] = await readExcelSafe(INPUT_FILEPATH);

    const rowData: Beyanname[] = []

    let gbNoCurrent = ""
    data.forEach(async (row: Beyanname) => {
        if (row["GB No"] !== gbNoCurrent) {
            gbNoCurrent = row["GB No"];
            const [miktarNet, miktarBrut, fob, kalemFiyati] = await filterDataByGbNo(data, row["GB No"]);
            rowData.push({
                "Tarih": row["Tarih"],
                "GB No": row["GB No"],
                "Tescil No": row["Tescil No"],
                "Tescil Tip": row["Tescil Tip"],
                "Satır": row["Satır"],
                "Durum": row["Durum"],
                "Gen. Sek.": row["Gen. Sek."],
                "İhracatçı": row["İhracatçı"],
                "İmalatçı": row["İmalatçı"],
                "Ülke": row["Ülke"],
                "Gümrük": row["Gümrük"],
                "GTIP": row["GTIP"],
                "Miktar Net (KG)": miktarNet,
                "Miktar Brüt (KG)": miktarBrut,
                "Miktar Kodu": row["Miktar Kodu"],
                "FOB USD": fob,
                "Kalem Fiyatı": kalemFiyati,
                "Döviz Kod": row["Döviz Kod"],
                "Teslim Şekli": row["Teslim Şekli"],
                "Gümrük Müşaviri Vergi Numarası": row["Gümrük Müşaviri Vergi Numarası"],
                "Gümrük Müşaviri": row["Gümrük Müşaviri"],
            })
        }
    })

    await writeExcelSafe(OUTPUT_PATH, { name: "Beyanname", data: rowData });

}

async function filterDataByGbNo(data: Beyanname[], gbNo: string) {

    const filtered = data.filter(row => row["GB No"] === gbNo);
    const miktarNet = filtered.reduce((acc, row) => acc + row["Miktar Net (KG)"], 0);
    const miktarBrut = filtered.reduce((acc, row) => acc + row["Miktar Brüt (KG)"], 0);
    const fob = filtered.reduce((acc, row) => acc + row["FOB USD"], 0);
    const kalemFiyati = filtered.reduce((acc, row) => acc + row["Kalem Fiyatı"], 0);
    return [miktarNet, miktarBrut, fob, kalemFiyati];
}

summerize();