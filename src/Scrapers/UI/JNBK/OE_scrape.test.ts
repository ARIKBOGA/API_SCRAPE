/*

                console.log(`🔍 ${crossNumber} için ürünü işliyor...`);

                const specificationTitles = await page.locator("//*[@class='d-lg-flex']//div[@class='param-title']").allTextContents();
                const specificationValues = await page.locator("//*[@class='d-lg-flex']//div[@class='param-field']").allTextContents();

                const crossReferenceOwners = await page.locator("//div[@class='owner']").allTextContents();
                const crossReferenceNumbers = await page.locator("//div[@class='field']").allTextContents();


                const specificationMap = new Map<string, string>();

                for (let i = 0; i < specificationTitles.length; i++) {
                    const title = specificationTitles[i].trim();
                    const value = specificationValues[i].trim();
                    if (title && value) {
                        specificationMap.set(title, value);
                    }
                }

                const crossReferencePairs: { brand: string; oe: string }[] = [];

                for (let i = 0; i < crossReferenceOwners.length; i++) {
                    const owner = crossReferenceOwners[i].trim();
                    const number = crossReferenceNumbers[i].trim();

                    if (owner && number) {
                        crossReferencePairs.push({ brand: owner, oe: number });
                    }
                }

                const brand_oe_map_serializable: { [key: string]: string[] } = {};
                for (const pair of crossReferencePairs) {
                    const oeNumbers = brand_oe_map_serializable[pair.brand] || [];
                    oeNumbers.push(pair.oe);
                    brand_oe_map_serializable[pair.brand] = oeNumbers;
                }

                // Her iki map i de JSON formatında dosyaya yaz
                const dirPath = path.join(`src/output/${productKind}/jsons/OE/oe-numbers_${filterBrand}_${productID}.json`);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true }); // klasörü oluştur
                }
                const outputPath = path.resolve(dirPath, `JNBK_${productID}.json`);

                const outputData = {
                    reference: yvNo,
                    id: productID,
                    brand: filterBrand,
                    brand_oe_map: brand_oe_map_serializable, // artık dizi objesi
                    specifications: Object.fromEntries(specificationMap),
                };

                fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
                console.log(`✅ ${crossNumber} için ürün detayları başarıyla alındı ve ${outputPath} dosyasına yazıldı.`);

                */