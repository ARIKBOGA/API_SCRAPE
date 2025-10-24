export interface Result {
    freeTextSearch: string;
    foundSupplierNumber: string;
    oeNumbers: string[];
    [key: string]: string[] | string;
}

export interface ResultRow {
    FreeTextSearch: string;
    FoundSupplierNumber: string;
    OE: string;
    [key: string]: string;
}

export interface Reference {
    manufacturer: string;
    crossNumber: string;
}
