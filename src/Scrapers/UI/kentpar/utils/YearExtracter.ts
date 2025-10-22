// Önceki gibi tip tanımlarımızı koruyoruz.
interface YearRange {
    startYear: string | null;
    endYear: string | null;
}

/**
 * Verilen string'den sadece yılın son iki hanesini (YY) çıkarır.
 * Örn: "07.2010", "03/2019", "2014" -> "10", "19", "14"
 *
 * @param dateStr - Tarih formatındaki string (AY.YIL, AY/YIL, YIL vb. olabilir)
 * @returns Yılın son iki hanesi veya null.
 */
function extractYear(dateStr: string | undefined): string | null {
    if (!dateStr) return null;

    // YIL (4 hane) formatını arıyoruz: YYYY
    const yearMatch = dateStr.match(/(\d{4})/);

    if (yearMatch && yearMatch[1]) {
        // Yıl bulunduğunda son iki hanesini döndür.
        return yearMatch[1].slice(-2);
    }

    return null;
}

/**
 * Otomotiv parçası uyumluluk verisindeki dağınık 'years' string'ini ayrıştırır.
 * Yeni formatları kapsar: "- - 03/2019" (Sadece Bitiş), "- 02.2008" (Sadece Bitiş)
 * ve sadece tire olanları ("- -", "-").
 *
 * @param yearsStr - JSON verisinden gelen 'years' string'i.
 * @returns Başlangıç ve bitiş yılının son iki hanesini içeren bir obje.
 */
export function parseCompatibilityYears(yearsStr: string): YearRange {
    const defaultResult: YearRange = { startYear: null, endYear: null };
    
    if (!yearsStr || typeof yearsStr !== 'string') {
        return defaultResult;
    }

    // 1. String'i ayırıcıya göre bölme: Çoğu durumda ayırıcı " - -" veya sadece "-" dir.
    // Çoklu tire ve boşlukları dikkate alarak bölüyoruz.
    const parts = yearsStr.split(/\s*-\s*-?\s*/).filter(p => p.trim() !== '');

    if (parts.length === 0) {
        // Örn: Sadece "-", "- -" gibi boş string'e indirgenenler
        return defaultResult;
    }

    if (parts.length === 1) {
        // Tek bir tarih parçası varsa, bu ya sadece başlangıçtır ya da baştan kayan bitiş.

        // Orijinal string, "- -" ile başlıyorsa, bu tek parça BİTİŞ'tir.
        // Örn: "- - 03/2019" -> parts: ["03/2019"]
        if (yearsStr.trim().startsWith('-')) {
             // "- -" , "- " veya sadece "-" ile başlayan formatlar (yani sadece bitiş var)
            return {
                startYear: null,
                endYear: extractYear(parts[0]),
            };
        } else {
            // Örn: "07.2010 - -" -> parts: ["07.2010"]
            // Bu, sadece başlangıç tarihi demektir.
            return {
                startYear: extractYear(parts[0]),
                endYear: null,
            };
        }
    }

    // parts.length === 2: Başlangıç ve Bitiş Tarihleri ayrılmıştır.
    // Örn: "07.2010 - - 12,2014" -> parts: ["07.2010", "12,2014"]
    if (parts.length >= 2) {
        return {
            startYear: extractYear(parts[0]),
            endYear: extractYear(parts[1]),
        };
    }
    
    // Nadir durumlar için varsayılan dönüş
    return defaultResult;
}