import { test, expect } from '@playwright/test';

// Kopyaladığın fetch isteğindeki URL ve parametreleri ayıklayalım.
const API_URL = "https://otoparcasan.com/Ajax/getCsrf/?_=1761232060058";
const REFERRER_URL = "https://otoparcasan.com/";

test('Tam Tarayıcı Headerları ile CSRF Token İsteği', async ({ request }) => {
    
    // Playwright'ın page.request'i yerine, APIContext'i doğrudan kullanmak, 
    // sayfa navigasyonu ihtiyacını ortadan kaldırır ve daha temiz bir yaklaşımdır.
    // Ancak sen page objesi üzerinden de yapabilirsin, bu kez page'i kullanmayıp request'i kullanalım.
    
    const customHeaders = {
        // Tarayıcıdan kopyalanan tüm önemli Header'lar
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        
        // Bu iki header sıklıkla kontrol edilir!
        "Referer": REFERRER_URL, // Önemli! referrer yerine Referer (büyük R)
        "X-Requested-With": "XMLHttpRequest", // Önemli! AJAX isteği olduğunu belirtir.
        
        // Güvenlik ve tarayıcı bilgileri (Anti-bot sistemlerini atlatmaya yardımcı olabilir)
        "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
        "sec-ch-ua-arch": "\"x86\"",
        "sec-ch-ua-bitness": "\"64\"",
        "sec-ch-ua-full-version": "\"141.0.7390.108\"",
        "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"141.0.7390.108\", \"Not?A_Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"141.0.7390.108\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-model": "\"\"",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-ch-ua-platform-version": "\"19.0.0\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Cookie": "csrf_ops_cookie=f7918ebd895328897fb0ee510d3a95a0; otoparcasan_session=l94nm4d3kr8ibodaco1um90rbkj4ol33"
        
        // Not: Orijinal fetch'teki "priority" header'ını atlıyorum, genellikle gereksizdir.
    };
    
    try {
        // Adım 1: Cookie'leri set etme
        // Tarayıcıdaki fetch'teki "credentials": "include" parametresi Playwright'ta 
        // ya bir page üzerinden otomatik yapılır ya da manuel olarak cookie'leri set etmeliyiz.
        // Taze cookie'ler manuel olarak set edilmeli.
        
        // ÖNEMLİ: Playwright'ta fetch isteği tarayıcı bağlamından bağımsız çalıştığında, 
        // Cookie'lerinizi "Cookie" header'ı olarak değil,
        // page.context().addCookies() veya request.storageState() gibi yöntemlerle yönetmek 
        // daha doğru olur. Ancak hızlı çözüm için direk header'a ekleyebiliriz.
        
        // Taze cookie'yi manuel olarak ekliyoruz (Senin tarayıcından kopyalanan, ama kodda olmayan kısmı)
        // Eğer tarayıcıda isteği yaparken cookie otomatik gittiyse, burada belirtmen lazım.
        // Buraya taze Cookie değerini manuel eklemelisin! (Önceki sorundan varsayımsal bir değer kullanıyorum)
        
        // Adım 2: GET isteğini yapma
        const response = await request.get(API_URL, {
            headers: customHeaders,
            // Playwright request metotları varsayılan olarak redirect'i takip eder.
        });

        // Adım 3: Yanıt kontrolü ve işleme
        
        // 403 alırsak, test burada patlar ve hatayı görürüz. 200/başarılı bekliyoruz.
        await expect(response.ok()).toBeTruthy();

        const resultText = await response.text();
        console.log(`Tam Header'lı API Yanıtı: ${resultText}`);

    } catch (error) {
        console.error("API isteği sırasında bir hata oluştu:", error);
        throw error;
    }
});