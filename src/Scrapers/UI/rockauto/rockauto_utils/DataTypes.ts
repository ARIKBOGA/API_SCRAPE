export type Result = {
    freeTextSearch: string;
    foundSupplierNumber: string;
    oeNumbers: string[];
    [key: string]: string[] | string;
}

export type ResultRow = {
    FreeTextSearch: string;
    FoundSupplierNumber: string;
    OE: string;
    [key: string]: string;
}

export type Reference = {
    manufacturer: string;
    crossNumber: string;
}
