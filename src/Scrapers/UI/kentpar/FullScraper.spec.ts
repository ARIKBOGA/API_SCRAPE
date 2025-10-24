import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

export interface KentparProduct {
    oe: string;
    compatibility: string;
    years: string;
    engine: string;
}
export interface KentparItem {
    KENTPAR_NO: string;
    products: KentparProduct[];
}
const outputFilePath = path.resolve(__dirname, 'jsons/kentpar_products.jsonl');
const links = [
    "/tr-TR/Product/Details/2hS7FFkubVuYLm96azbjRgY6B!7yY6B!7y/Binek-Krank-Kasn-152K2341S",
    "/tr-TR/Product/Details/Ub4pD9NXx95XkPCDsBs7Uvlu52NQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1131",
    "/tr-TR/Product/Details/oNhbZQzwdU2Ex95XkPCx2OjCcWYBx95XkPCBrAY6B!7yY6B!7y/Binek-Krank-Kasn-152K11401",
    "/tr-TR/Product/Details/kPydL0LJGPgHgVyPROpPFAY6B!7yY6B!7y/Binek-Krank-Kasn-152K1141S",
    "/tr-TR/Product/Details/HVWx2qsspDZ6wKYnxveHwwY6B!7yY6B!7y/Binek-Krank-Kasn-152K11501",
    "/tr-TR/Product/Details/cVLHJNRCdpxJ8SZPRFvZagY6B!7yY6B!7y/Binek-Krank-Kasn-152K1151S",
    "/tr-TR/Product/Details/otJWx95XkPCOQ3tZVgnAJGoxgKxwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K11601",
    "/tr-TR/Product/Details/qsiMHomiCrHT62x95XkPCL6z32YQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1161S",
    "/tr-TR/Product/Details/x2OjCUZIzLIWarVylNlBayUiYgY6B!7yY6B!7y/Binek-Krank-Kasn-152K11701",
    "/tr-TR/Product/Details/J38a8TpC0x2OjC3InPrh8xx95XkPC8JQY6B!7yY6B!7y/Binek-Krank-Kasn-152K11801",
    "/tr-TR/Product/Details/b1aD4EPbVKPZqlH1ULqjpAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K11901",
    "/tr-TR/Product/Details/50STTWyGwPXhKVPxKz8lwAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1191S",
    "/tr-TR/Product/Details/xSs4lXvusJnP4p7RiQ9PDgY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K12001",
    "/tr-TR/Product/Details/pObBQRHnj7s3yPoRmqYTwwY6B!7yY6B!7y/Binek-Krank-Kasn-152K12101",
    "/tr-TR/Product/Details/h5E3pFl72QXF4UZgNfASOQY6B!7yY6B!7y/Binek-Krank-Kasn-152K1211S",
    "/tr-TR/Product/Details/TCz5EOW0Ww7vgz0tbBTjRgY6B!7yY6B!7y/Binek-Krank-Kasn-152K12201",
    "/tr-TR/Product/Details/UMPJyAojNXpBDtNNMHyMYwY6B!7yY6B!7y/Binek-Krank-Kasn-152K1221S",
    "/tr-TR/Product/Details/LDRxgUeOXhgEERZ81uYIUAY6B!7yY6B!7y/Binek-Krank-Kasn-152K12301",
    "/tr-TR/Product/Details/T2oZGXN5KbUeMYx95XkPC59pbf0QY6B!7yY6B!7y/Binek-Krank-Kasn-152K1231S",
    "/tr-TR/Product/Details/4HY2AX7Yq0dXuUseqUG6NAY6B!7yY6B!7y/Binek-Viskoz-Kra-152K12401",
    "/tr-TR/Product/Details/B6ARMT8gp2xrh5tcpyliHgY6B!7yY6B!7y/Binek-Viskoz-Kra-152K1241S",
    "/tr-TR/Product/Details/GxBksgDOzhFq654bDPlmx95XkPCgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K12501",
    "/tr-TR/Product/Details/cTFmD4x95XkPC4x95XkPCx95XkPC4NSx2OjCHGDioiXQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1251S",
    "/tr-TR/Product/Details/zPQ6LE8jjEkwzsa8JBGywgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K12601",
    "/tr-TR/Product/Details/uwx95XkPCNEmsriqAcx95XkPCcKNgFztoQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1261S",
    "/tr-TR/Product/Details/A4aoODcx2OjCmlNJlo1DYUBmgwY6B!7yY6B!7y/Binek-Krank-Kasn-152K24901",
    "/tr-TR/Product/Details/0udW8XOVoK9LlzzmM8ZvRwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K25701",
    "/tr-TR/Product/Details/iNwL24CnU6CZeoXABTJfxAY6B!7yY6B!7y/Binek-Krank-Kasn-152K24801",
    "/tr-TR/Product/Details/IDxcx2OjCukl945QIpNb2x4ylQY6B!7yY6B!7y/Ticari-Krank-Kasn-152K25401",
    "/tr-TR/Product/Details/uN6tx2OjCOZgA0mFdneGIqqD3gY6B!7yY6B!7y/Binek-Krank-Kasn-152K25301",
    "/tr-TR/Product/Details/LsSkrArqL8wq9ewpWritLgY6B!7yY6B!7y/Binek-Torsiyonel-152K10101",
    "/tr-TR/Product/Details/khG5r5R6hQoDS99v4tjcwgY6B!7yY6B!7y/Binek-Torsiyonel-152K1011S",
    "/tr-TR/Product/Details/x2OjCnnOIg5bCe1s3uE6j8m63QY6B!7yY6B!7y/Binek-Krank-Kasn-152K10201",
    "/tr-TR/Product/Details/8I9NowCNiOhC1ZtRQp04swY6B!7yY6B!7y/Binek-Krank-Kasn-152K10301",
    "/tr-TR/Product/Details/ZnwT2Rgn1bhdmP6JoUx95XkPCoeQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K10401",
    "/tr-TR/Product/Details/5EkZwHwsr50sk8yaXe45bQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1041S",
    "/tr-TR/Product/Details/fKHhFBtGifUYkDReqx95XkPCIF0AY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K10501",
    "/tr-TR/Product/Details/v5zbFSJtoSebk7NCPv3yBAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1051S",
    "/tr-TR/Product/Details/drVOcehbxGxpNuclvK4ObwY6B!7yY6B!7y/Binek-Krank-Kasn-152K10801",
    "/tr-TR/Product/Details/6NiREUsBGcvQ7h4FkSfmwwY6B!7yY6B!7y/Binek-Krank-Kasn-152K1081S",
    "/tr-TR/Product/Details/IzH97DTe4ox95XkPCiIqXabhS1RQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K10901",
    "/tr-TR/Product/Details/wPtSPx2OjCYN1qy2O4x95XkPCCHM9cawY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1091S",
    "/tr-TR/Product/Details/4GJ7ljqtgUBC5DI9c3AndgY6B!7yY6B!7y/Binek-Krank-Kasn-152K11001",
    "/tr-TR/Product/Details/86QJ6FuFjQzbN3pRFSUDEAY6B!7yY6B!7y/Binek-Krank-Kasn-152K1101S",
    "/tr-TR/Product/Details/Ka5S3HyTodxElBtaEx41x95XkPCgY6B!7yY6B!7y/Binek-Krank-Kasn-152K11101",
    "/tr-TR/Product/Details/kLTdk6lJ79NQRKJRFJ0Mx95XkPCgY6B!7yY6B!7y/Binek-Krank-Kasn-152K1111S",
    "/tr-TR/Product/Details/5b3HT6ttPD9ghjuurrU9x2OjCQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K11201",
    "/tr-TR/Product/Details/958hWVUSEMOmHJzwT4yLYwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1121S",
    "/tr-TR/Product/Details/ZZ95XH0hsx95XkPCO6K7x2OjC2QHto9QY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K11301",
    "/tr-TR/Product/Details/Ub4pD9NXx95XkPCDsBs7Uvlu52NQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1131S",
    "/tr-TR/Product/Details/oNhbZQzwdU2Ex95XkPCx2OjCcWYBx95XkPCBrAY6B!7yY6B!7y/Binek-Krank-Kasn-152K11401",
    "/tr-TR/Product/Details/kPydL0LJGPgHgVyPROpPFAY6B!7yY6B!7y/Binek-Krank-Kasn-152K1141S",
    "/tr-TR/Product/Details/HVWx2qsspDZ6wKYnxveHwwY6B!7yY6B!7y/Binek-Krank-Kasn-152K11501",
    "/tr-TR/Product/Details/cVLHJNRCdpxJ8SZPRFvZagY6B!7yY6B!7y/Binek-Krank-Kasn-152K1151S",
    "/tr-TR/Product/Details/otJWx95XkPCOQ3tZVgnAJGoxgKxwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K11601",
    "/tr-TR/Product/Details/qsiMHomiCrHT62x95XkPCL6z32YQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1161S",
    "/tr-TR/Product/Details/x2OjCUZIzLIWarVylNlBayUiYgY6B!7yY6B!7y/Binek-Krank-Kasn-152K11701",
    "/tr-TR/Product/Details/J38a8TpC0x2OjC3InPrh8xx95XkPC8JQY6B!7yY6B!7y/Binek-Krank-Kasn-152K11801",
    "/tr-TR/Product/Details/b1aD4EPbVKPZqlH1ULqjpAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K11901",
    "/tr-TR/Product/Details/50STTWyGwPXhKVPxKz8lwAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1191S",
    "/tr-TR/Product/Details/xSs4lXvusJnP4p7RiQ9PDgY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K12001",
    "/tr-TR/Product/Details/pObBQRHnj7s3yPoRmqYTwwY6B!7yY6B!7y/Binek-Krank-Kasn-152K12101",
    "/tr-TR/Product/Details/h5E3pFl72QXF4UZgNfASOQY6B!7yY6B!7y/Binek-Krank-Kasn-152K1211S",
    "/tr-TR/Product/Details/TCz5EOW0Ww7vgz0tbBTjRgY6B!7yY6B!7y/Binek-Krank-Kasn-152K12201",
    "/tr-TR/Product/Details/UMPJyAojNXpBDtNNMHyMYwY6B!7yY6B!7y/Binek-Krank-Kasn-152K1221S",
    "/tr-TR/Product/Details/LDRxgUeOXhgEERZ81uYIUAY6B!7yY6B!7y/Binek-Krank-Kasn-152K12301",
    "/tr-TR/Product/Details/T2oZGXN5KbUeMYx95XkPC59pbf0QY6B!7yY6B!7y/Binek-Krank-Kasn-152K1231S",
    "/tr-TR/Product/Details/4HY2AX7Yq0dXuUseqUG6NAY6B!7yY6B!7y/Binek-Viskoz-Kra-152K12401",
    "/tr-TR/Product/Details/B6ARMT8gp2xrh5tcpyliHgY6B!7yY6B!7y/Binek-Viskoz-Kra-152K1241S",
    "/tr-TR/Product/Details/GxBksgDOzhFq654bDPlmx95XkPCgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K12501",
    "/tr-TR/Product/Details/cTFmD4x95XkPC4x95XkPCx95XkPC4NSx2OjCHGDioiXQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1251S",
    "/tr-TR/Product/Details/zPQ6LE8jjEkwzsa8JBGywgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K12601",
    "/tr-TR/Product/Details/uwx95XkPCNEmsriqAcx95XkPCcKNgFztoQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1261S",
    "/tr-TR/Product/Details/nMA3YLhx95XkPCgx95XkPCHpPgQ85W4x2OjCrgY6B!7yY6B!7y/Binek-Torsiyonel-152K12701",
    "/tr-TR/Product/Details/iuwytXBqYpJCpR27kXMmIgY6B!7yY6B!7y/Binek-Torsiyonel-152K1271S",
    "/tr-TR/Product/Details/W0vPwarx2OjCiGOhkQmlNY4d4gY6B!7yY6B!7y/Binek-Torsiyonel-152K12801",
    "/tr-TR/Product/Details/fyKpAUAifZRiUSqgvNuyywY6B!7yY6B!7y/Binek-Torsiyonel-152K1281S",
    "/tr-TR/Product/Details/UZYBICpx95XkPCxHx95XkPCXFYdPSjshx95XkPCAY6B!7yY6B!7y/Binek-Krank-Kasn-152K12901",
    "/tr-TR/Product/Details/EpZ33VjhgpY14obxynIsewY6B!7yY6B!7y/Binek-Torsiyonel-152K13001",
    "/tr-TR/Product/Details/EgCOzJ1PhOXs15vnkEJ8DgY6B!7yY6B!7y/Binek-Torsiyonel-152K1301S",
    "/tr-TR/Product/Details/noNw9YiLagPegmMjOeZG1QY6B!7yY6B!7y/Binek-Torsiyonel-152K13101",
    "/tr-TR/Product/Details/H7ZJZDrMtfhoBhG84Tb7RAY6B!7yY6B!7y/Binek-Krank-Kasn-152K13201",
    "/tr-TR/Product/Details/eheV8yVrOsmQeJyQr9j65gY6B!7yY6B!7y/Binek-Krank-Kasn-152K1321S",
    "/tr-TR/Product/Details/wfVuYInKJPFkqELhhX2MogY6B!7yY6B!7y/Binek-Torsiyonel-152K13301",
    "/tr-TR/Product/Details/ZFwuaO7ESSO2UTCsJ4bZZgY6B!7yY6B!7y/Binek-Torsiyonel-152K1331S",
    "/tr-TR/Product/Details/PVXOAYn7Oq8qVgNxlDwcpAY6B!7yY6B!7y/Binek-Torsiyonel-152K13401",
    "/tr-TR/Product/Details/sqimnU9NaBoQF25oExx2OjCQcQY6B!7yY6B!7y/Binek-Torsiyonel-152K1341S",
    "/tr-TR/Product/Details/AQQr0TW5Rx2OjCAD4I5Hi5eYx2OjCgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K13501",
    "/tr-TR/Product/Details/hWSTYmi31UQiCx4JnhqjlgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1351S",
    "/tr-TR/Product/Details/tUNtfqA49kEc8XKpXux2OjC5GAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K13601",
    "/tr-TR/Product/Details/KaHxCE5zX7HM8pwEMbfyowY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1361S",
    "/tr-TR/Product/Details/sQmlA1o5ySkvIw4x95XkPCHIZPjAY6B!7yY6B!7y/Binek-Krank-Kasn-152K13701",
    "/tr-TR/Product/Details/maPuqTbYdtn8x95XkPCH4NxILPCgY6B!7yY6B!7y/Binek-Krank-Kasn-152K1371S",
    "/tr-TR/Product/Details/6sLHx95XkPCRgx95XkPC2xjYDS8In5Ew8wY6B!7yY6B!7y/Binek-Torsiyonel-152K13801",
    "/tr-TR/Product/Details/OUDBP8tijKRqkx2OjC6J52sM0wY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K13901",
    "/tr-TR/Product/Details/LWJvJLsZOa9iNBXTN7l8swY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1391S",
    "/tr-TR/Product/Details/3AhAsjROojk1ZsNLcfnzEQY6B!7yY6B!7y/Binek-Torsiyonel-152K14001",
    "/tr-TR/Product/Details/IOrIox2OjCx9nRbLlUKrEJLM1gY6B!7yY6B!7y/Binek-Torsiyonel-152K1401S",
    "/tr-TR/Product/Details/x95XkPCQs0COEvYCntxLx1x2OjCbkB2gY6B!7yY6B!7y/Binek-Krank-Kasn-152K14101",
    "/tr-TR/Product/Details/eJnGiaOdbblylGHhrjsXzAY6B!7yY6B!7y/Binek-Krank-Kasn-152K1411S",
    "/tr-TR/Product/Details/mXG5y6F9ma7rXCLLgdS8ewY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K14201",
    "/tr-TR/Product/Details/e3FxAyNvFfpoxUtIa0KmQAY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1421S",
    "/tr-TR/Product/Details/TW24H9LyFIs36IilqnzBXQY6B!7yY6B!7y/Binek-Torsiyonel-152K14301",
    "/tr-TR/Product/Details/nx2OjC6DQqlAQx95XkPCAWPzmC8eylogY6B!7yY6B!7y/Binek-Torsiyonel-152K1431S",
    "/tr-TR/Product/Details/w8BPx9V4qpyEx95XkPCoA8cyxx2OjC0AY6B!7yY6B!7y/Binek-Torsiyonel-152K14401",
    "/tr-TR/Product/Details/GyNM86clbGPQvQJPhxnyBgY6B!7yY6B!7y/Binek-Torsiyonel-152K1441S",
    "/tr-TR/Product/Details/MT7cuNnrJkGxrFLsh9Kr8wY6B!7yY6B!7y/Binek-Torsiyonel-152K14501",
    "/tr-TR/Product/Details/UYAju4Wp5x95XkPCnvuAI8O5SCzwY6B!7yY6B!7y/Binek-Torsiyonel-152K1451S",
    "/tr-TR/Product/Details/yvpNx95XkPCrUj1xcxUlKIaRZAawY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K14601",
    "/tr-TR/Product/Details/vn6V0JQfx95XkPCx95XkPCJXG3rDoaQxtwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1461S",
    "/tr-TR/Product/Details/5hf9GuAsqu3clQCe6GNXbQY6B!7yY6B!7y/Binek-Torsiyonel-152K14701",
    "/tr-TR/Product/Details/v2wTv1anMquXhgtdpS7UBgY6B!7yY6B!7y/Binek-Torsiyonel-152K1471S",
    "/tr-TR/Product/Details/ax2OjCRx2OjCQOFgVXaRqbnx2OjCOeR91QY6B!7yY6B!7y/Binek-Krank-Kasn-152K14801",
    "/tr-TR/Product/Details/1Tt76HtBvUxi61dfZItx2OjCowY6B!7yY6B!7y/Binek-Krank-Kasn-152K1481S",
    "/tr-TR/Product/Details/TkB1Ubx2OjCAmC0x2OjClYm8KRSMEwY6B!7yY6B!7y/Binek-Torsiyonel-152K14901",
    "/tr-TR/Product/Details/8xNhCLzytZvBmUPFx95XkPC0PGMQY6B!7yY6B!7y/Binek-Torsiyonel-152K1491S",
    "/tr-TR/Product/Details/jWySvx95XkPCylc1Slx95XkPCg6PqUXx6wY6B!7yY6B!7y/Binek-Krank-Kasn-152K15001",
    "/tr-TR/Product/Details/NIuv5gtw9dbII84MYWYpx95XkPCQY6B!7yY6B!7y/Binek-Krank-Kasn-152K15101",
    "/tr-TR/Product/Details/2u3O5BwkhwUwmfPvmL9xx2OjCwY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K15201",
    "/tr-TR/Product/Details/rZPlLFj79OFYvK9hhwBPVAY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K15301",
    "/tr-TR/Product/Details/rNl7nQEm4kdnM8pUZeO22gY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1531S",
    "/tr-TR/Product/Details/aJ5HPnZmvOMbY6YTzYfzrAY6B!7yY6B!7y/Binek-Torsiyonel-152K15401",
    "/tr-TR/Product/Details/j1xW3GSLeuxpTqaWQbcJIAY6B!7yY6B!7y/Binek-Krank-Kasn-152K15501",
    "/tr-TR/Product/Details/m1DKoFv5yGU2nE8RJx2OjCDrawY6B!7yY6B!7y/Binek-Torsiyonel-152K15601",
    "/tr-TR/Product/Details/byNhZMIHCPCSTCwm6mOTdwY6B!7yY6B!7y/Binek-Viskoz-Kra-152K15701",
    "/tr-TR/Product/Details/Q6x95XkPC6envKKGx2OjCC1SlELWNpxgY6B!7yY6B!7y/Binek-Viskoz-Kra-152K1571S",
    "/tr-TR/Product/Details/z57504w5RICcrjFxH2v62gY6B!7yY6B!7y/Binek-Krank-Kasn-152K15801",
    "/tr-TR/Product/Details/5udQCPNFqwPWd4IJWToOBwY6B!7yY6B!7y/Binek-Krank-Kasn-152K1581S",
    "/tr-TR/Product/Details/bL6Js1e7x2OjCAPuDN2kM3NB2gY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K15901",
    "/tr-TR/Product/Details/0vZR09gkqauDjif9GN9AWwY6B!7yY6B!7y/Binek-Torsiyonel-152K16001",
    "/tr-TR/Product/Details/phPJCULavUkQ6dwkCMqW0QY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K16101",
    "/tr-TR/Product/Details/etY8tgx95XkPCkx2OjCtDAHewGbf5zlwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1611S",
    "/tr-TR/Product/Details/eHWy2IdDJiXjir7crULWwAY6B!7yY6B!7y/Binek-Krank-Kasn-152K16201",
    "/tr-TR/Product/Details/Fxx1DXLSpmAzk6HpDpNDpwY6B!7yY6B!7y/Binek-Krank-Kasn-152K16301",
    "/tr-TR/Product/Details/ZDFSTu5Sig1PvgQYSKbI8QY6B!7yY6B!7y/Binek-Krank-Kasn-152K16401",
    "/tr-TR/Product/Details/6x2OjCa88x95XkPCTUlWZLEmtyzTF9LgY6B!7yY6B!7y/Binek-Krank-Kasn-152K1641S",
    "/tr-TR/Product/Details/IRg6fTdx2OjC9yK2IprxmvA96QY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K16501",
    "/tr-TR/Product/Details/5qSQGxjcuLazbETquV0aegY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1651S",
    "/tr-TR/Product/Details/2nNsV3UIdZJcw47oOnEGXgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K16601",
    "/tr-TR/Product/Details/tZfOdM2c4Uj425bTZKgFRAY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K1661S",
    "/tr-TR/Product/Details/sbzRdmP26UBWtVO40qELEgY6B!7yY6B!7y/Binek-Krank-Kasn-152K16701",
    "/tr-TR/Product/Details/21Xx2OjCqox95XkPCIeDYrpk4dJyMoywY6B!7yY6B!7y/Binek-Krank-Kasn-152K16801",
    "/tr-TR/Product/Details/i4lsW65DGerXiLP3zgnpHgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K16901",
    "/tr-TR/Product/Details/S0AyrpdZ6zx2OjCs0yeNxKLAkwY6B!7yY6B!7y/Binek-Viskoz-Kra-152K17001",
    "/tr-TR/Product/Details/vzeOEJzh00BDMTj0OKP0xQY6B!7yY6B!7y/Binek-Viskoz-Kra-152K1701S",
    "/tr-TR/Product/Details/vjGKcFO5rYOvx2OjCy99lT8ZTQY6B!7yY6B!7y/Binek-Viskoz-Kra-152K17101",
    "/tr-TR/Product/Details/1zYDYSiZhRZtcc9Vi9KfdgY6B!7yY6B!7y/Binek-Viskoz-Kra-152K1711S",
    "/tr-TR/Product/Details/2brmdHZqaPEKxtaBenFufgY6B!7yY6B!7y/Binek-Torsiyonel-152K17201",
    "/tr-TR/Product/Details/cdbCmr9pEUuwCEfEmr6jMwY6B!7yY6B!7y/Binek-Torsiyonel-152K17301",
    "/tr-TR/Product/Details/7I7Wt6NFocddAatk1aXrQgY6B!7yY6B!7y/Binek-Torsiyonel-152K1731S",
    "/tr-TR/Product/Details/cGgx95XkPClkpZk9RJx6cx2OjCkx95XkPCjTWwY6B!7yY6B!7y/Binek-Devirdaim--152K17401",
    "/tr-TR/Product/Details/0ng6CDCUSYvt4UsyGMBinwY6B!7yY6B!7y/Binek-Krank-Kasn-152K17501",
    "/tr-TR/Product/Details/RSp1rbvjLQznx2OjCnmdKILfwAY6B!7yY6B!7y/Binek-Krank-Kasn-152K17601",
    "/tr-TR/Product/Details/bwPn5syzGae0uUbTM54KAgY6B!7yY6B!7y/Binek-Krank-Kasn-152K1761S",
    "/tr-TR/Product/Details/rORnuXvGre0x2OjCOtP5Kpic2QY6B!7yY6B!7y/Binek-Krank-Kasn-152K17701",
    "/tr-TR/Product/Details/eKSt7xx95XkPCH2DnRRcCVi39oZQY6B!7yY6B!7y/Binek-Krank-Kasn-152K17801",
    "/tr-TR/Product/Details/3t6vT8J7dsnZSUaTM48GxAY6B!7yY6B!7y/Binek-Krank-Kasn-152K1781S",
    "/tr-TR/Product/Details/eweUxS4Br9PcVUiWTdl0HgY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K17901",
    "/tr-TR/Product/Details/FXt05Uix95XkPCYx95XkPCRBmeOt4G57KwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1791S",
    "/tr-TR/Product/Details/NQsOUjih310iOx2OjCm4wJfn2AY6B!7yY6B!7y/Binek-Krank-Kasn-152K18001",
    "/tr-TR/Product/Details/bNjtdKx2OjCZjv4Iyso6UBBENQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K18101",
    "/tr-TR/Product/Details/kN4x95XkPCqkcqsW5eL80yuflT3QY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K1811S",
    "/tr-TR/Product/Details/wwVQNvPevmRta8kGRh6ucwY6B!7yY6B!7y/Binek-Krank-Kasn-152K18601",
    "/tr-TR/Product/Details/Ix2OjCBx95XkPC3cmCUFoR7zLxkUSI3wY6B!7yY6B!7y/Binek-Krank-Kasn-152K18701",
    "/tr-TR/Product/Details/IlQhiF7DkkgwPgu4mxQMGQY6B!7yY6B!7y/Binek-Krank-Kasn-152K18801",
    "/tr-TR/Product/Details/V6ZDJImneGXBAc4EErQk6gY6B!7yY6B!7y/Binek-Krank-Kasn-152K18901",
    "/tr-TR/Product/Details/5nx95XkPCVUJO56EB6SFab9UlwEgY6B!7yY6B!7y/Binek-Krank-Kasn-152K19001",
    "/tr-TR/Product/Details/SNQIwjcmbnax95XkPCzJeQTGsKFQY6B!7yY6B!7y/Binek-Krank-Kasn-152K19101",
    "/tr-TR/Product/Details/cFMERPv3LSvAlVRYCPR3LgY6B!7yY6B!7y/Binek-Krank-Kasn-152K19201",
    "/tr-TR/Product/Details/CkJx95XkPCRY4fkK0K0HJBrZJ8awY6B!7yY6B!7y/Binek-Krank-Kasn-152K19301",
    "/tr-TR/Product/Details/r3soGS58sWOzPdx95XkPCGv5E99QY6B!7yY6B!7y/Binek-Krank-Kasn-152K19401",
    "/tr-TR/Product/Details/n1xksDH7oKFrbyRFvUUacgY6B!7yY6B!7y/Binek-Torsiyonel-152K19501",
    "/tr-TR/Product/Details/0fQE9ys1oRM1LPSx2OjCihc8MAY6B!7yY6B!7y/Binek-Torsiyonel-152K1012S",
    "/tr-TR/Product/Details/oV6TtV9yL9yYx95XkPCV8tDxFQLgY6B!7yY6B!7y/Binek-Torsiyonel-152K18201",
    "/tr-TR/Product/Details/a0uSx95XkPCXzPyqvgJxD6y8I0AQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K20601",
    "/tr-TR/Product/Details/Eg96vQKb27jfTZTBd5uLFAY6B!7yY6B!7y/Binek-Krank-Kasn-152K19601",
    "/tr-TR/Product/Details/EqzmGjS8mO7qEHzOyCF3x2OjCQY6B!7yY6B!7y/Binek-Krank-Kasn-152K19701",
    "/tr-TR/Product/Details/XBgaFT1sFrCYQfg3o6VkXAY6B!7yY6B!7y/Binek-Krank-Kasn-152K19801",
    "/tr-TR/Product/Details/x2OjCtDThoSCE2J8eDdCn3DfywY6B!7yY6B!7y/Binek-Krank-Kasn-152K19901",
    "/tr-TR/Product/Details/xrSf96arJ7ZSrfYqZGQ2QQY6B!7yY6B!7y/Binek-Torsiyonel-152K20201",
    "/tr-TR/Product/Details/j2VDOV7xPwu80x95XkPCNiAk9YXAY6B!7yY6B!7y/Binek-Torsiyonel-152K20001",
    "/tr-TR/Product/Details/UtRgAuVRs1XDdHtHMVHGrQY6B!7yY6B!7y/Binek-Krank-Kasn-152K20101",
    "/tr-TR/Product/Details/Ry3IyH06hWSDVJn8m1llBwY6B!7yY6B!7y/Binek-Krank-Kasn-152K20801",
    "/tr-TR/Product/Details/T5VF227aLGgNXhMZ9jDJkAY6B!7yY6B!7y/Binek-Krank-Kasn-152K20901",
    "/tr-TR/Product/Details/2cpbfNjPDcBw7ukgrgbnNAY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K21001",
    "/tr-TR/Product/Details/GsTcx95XkPCLdZIVY4Hx2OjCKh9qzW9gY6B!7yY6B!7y/Binek-Torsiyonel-152K20301",
    "/tr-TR/Product/Details/5qgjPp6IlGgW7x2OjCZKIl8KmAY6B!7yY6B!7y/Binek-Torsiyonel-152K20401",
    "/tr-TR/Product/Details/mEXNf742AxA5x95XkPCu8uwUKqSwY6B!7yY6B!7y/Binek-Torsiyonel-152K20501",
    "/tr-TR/Product/Details/ibkMXYXngvUE47gPWMZl5wY6B!7yY6B!7y/Binek-Torsiyonel-152K20701",
    "/tr-TR/Product/Details/OrFkw1I7xcnuBCYqK0EdQAY6B!7yY6B!7y/Binek-Torsiyonel-152K2001S",
    "/tr-TR/Product/Details/ZiQNhJwY0iEQKpBx2OjCP3ZWhgY6B!7yY6B!7y/Binek-Krank-Kasn-152K1921S",
    "/tr-TR/Product/Details/Qx2OjCkPMaRIDgqWbcfaWDSQUgY6B!7yY6B!7y/Binek-Krank-Kasn-152K1922S",
    "/tr-TR/Product/Details/JdEPSqKkRx2OjCOFntoaa4B24AY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K21301",
    "/tr-TR/Product/Details/Vj5imvlHm9qLzQOiYG1P3wY6B!7yY6B!7y/Binek-Krank-Kasn-152K1782S",
    "/tr-TR/Product/Details/WbYx95XkPCyx4Dwmfx2OjCQI4WWRbiPQY6B!7yY6B!7y/Binek-Krank-Kasn-152K21701",
    "/tr-TR/Product/Details/leRtq2lSBJx2OjCbBqprkXZkpgY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K21501",
    "/tr-TR/Product/Details/vjYx95XkPCmQrDoKlc6DIT0BqGJQY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K21601",
    "/tr-TR/Product/Details/Lix95XkPC5qCV7PJFvItGM8LaVFAY6B!7yY6B!7y/Binek-Viskoz-Kra-152K21101",
    "/tr-TR/Product/Details/o90HITOlla7lntoo7FXbDAY6B!7yY6B!7y/Binek-Torsiyonel-152K21401",
    "/tr-TR/Product/Details/smwwFErlmx95XkPCNfKXow7tO9HgY6B!7yY6B!7y/Binek-Viskoz-Kra-152K21201",
    "/tr-TR/Product/Details/Zx7sg9dDD4dLiujswouLxQY6B!7yY6B!7y/Binek-Torsiyonel-152K2141S",
    "/tr-TR/Product/Details/DrOKSzYRmTgdiqSa6fbGewY6B!7yY6B!7y/Binek-Viskoz-Kra-152K2121S",
    "/tr-TR/Product/Details/AuFzf6hK8D9eOhevdK9qNwY6B!7yY6B!7y/Binek-Viskoz-Kra-152K2111S",
    "/tr-TR/Product/Details/j1BwonkZ4O7L89awXWHEUQY6B!7yY6B!7y/Binek-Torsiyonel-152K21901",
    "/tr-TR/Product/Details/GBkGIYohPgjCkY86qBllzwY6B!7yY6B!7y/Binek-Krank-Kasn-152K22001",
    "/tr-TR/Product/Details/9kLo4JHN2obZCYknib3PgAY6B!7yY6B!7y/Binek-Krank-Kasn-152K21801",
    "/tr-TR/Product/Details/T5YbTp7CNskvKanjJzu0dgY6B!7yY6B!7y/Binek-Torsiyonel-152K22401",
    "/tr-TR/Product/Details/Od44iopjbx2OjCXaXLIfe3x2OjCPdgY6B!7yY6B!7y/Binek-Krank-Kasn-152K22601",
    "/tr-TR/Product/Details/t5DvabIgjVStK4DXFWzPOwY6B!7yY6B!7y/Binek-Krank-Kasn-152K22501",
    "/tr-TR/Product/Details/NKkekdmPQNx2OjCeWQ5lXmp1sQY6B!7yY6B!7y/Binek-Krank-Kasn-152K22701",
    "/tr-TR/Product/Details/9nZJRJCD4itGeD2cK0o4DQY6B!7yY6B!7y/Binek-Krank-Kasn-152K22201",
    "/tr-TR/Product/Details/LTYXc9MQ7aDkxuRKkbHPFAY6B!7yY6B!7y/Binek-Krank-Kasn-152K22101",
    "/tr-TR/Product/Details/zuUA7vHn0euGg6w8DRN6jQY6B!7yY6B!7y/Binek-Krank-Kasn-152K22301",
    "/tr-TR/Product/Details/eShfsMH5lGZC84pQNx95XkPCNjx95XkPCAY6B!7yY6B!7y/Binek-Krank-Kasn-152K22801",
    "/tr-TR/Product/Details/dFhDnWjOvnyOq4mNiwKXwQY6B!7yY6B!7y/Binek-Krank-Kasn-152K23101",
    "/tr-TR/Product/Details/oA67ZgncQup7MRJVypYK0AY6B!7yY6B!7y/Binek-Krank-Kasn-152K23201",
    "/tr-TR/Product/Details/JwizdJpfkLeVOLdShCdmXQY6B!7yY6B!7y/Binek-Krank-Kasn-152K23401",
    "/tr-TR/Product/Details/24pSGoJ4764uW24zc8HsxQY6B!7yY6B!7y/Binek-Torsiyonel-152K1821S",
    "/tr-TR/Product/Details/EcKbtx95XkPChMBMxnixDxX7cDbAY6B!7yY6B!7y/Binek-Torsiyonel-152K2031S",
    "/tr-TR/Product/Details/SikcjYWOKj3MZvALfKsxAQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K2131S",
    "/tr-TR/Product/Details/6GCue9tjKwg6yeodnyx17gY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K2151S",
    "/tr-TR/Product/Details/PkX01UiugKwx95XkPCYMgpY3JS2AY6B!7yY6B!7y/HAFIF-TICA-Torsiyonel-152K2161S",
    "/tr-TR/Product/Details/MTx2OjCDXYdHPFFikerjDtd2zAY6B!7yY6B!7y/Binek-Torsiyonel-152K2191S",
    "/tr-TR/Product/Details/2Yx2OjClTXZjqW1RwRx2OjCksHD1UgY6B!7yY6B!7y/Binek-Krank-Kasn-152K2271S",
    "/tr-TR/Product/Details/x95XkPCDjLOaQaJILbAL5iR2EHcAY6B!7yY6B!7y/Binek-Torsiyonel-152K2041S",
    "/tr-TR/Product/Details/Iax8lfwgoZxTC3upAKni9QY6B!7yY6B!7y/Binek-Krank-Kasn-152K1342S",
    "/tr-TR/Product/Details/grQzHcbgiI2MgEcpvx95XkPCa8uAY6B!7yY6B!7y/Binek-Krank-Kasn-152K24101",
    "/tr-TR/Product/Details/x2OjCfOFw55szcELRSpoNHqmsAY6B!7yY6B!7y/Binek-Krank-Kasn-152K23901",
    "/tr-TR/Product/Details/vL1BRrpEca9QQFV3vkfXZAY6B!7yY6B!7y/Binek-Krank-Kasn-152K24401",
    "/tr-TR/Product/Details/rmrai0b1kWdBa8dmgZj6xgY6B!7yY6B!7y/Binek-Krank-Kasn-152K25201",
    "/tr-TR/Product/Details/dFmzKx2OjCw0xrdQVKPXke7oOwY6B!7yY6B!7y/Binek-Krank-Kasn-152K25501",
    "/tr-TR/Product/Details/bC5eokc38piBCnm7maSRoAY6B!7yY6B!7y/Binek-Krank-Kasn-152K23501",
    "/tr-TR/Product/Details/Z3ln2aVal4W09WXWjjtFwAY6B!7yY6B!7y/Binek-Krank-Kasn-152K23701",
    "/tr-TR/Product/Details/fibtD28aAHKjxtZHpZDbHgY6B!7yY6B!7y/Binek-Krank-Kasn-152K24601",
    "/tr-TR/Product/Details/pRcX7ytbPFcCBeRVbtkXygY6B!7yY6B!7y/Binek-Krank-Kasn-152K25001",
    "/tr-TR/Product/Details/HFJLXOwpLZu2eRYpXC9A9QY6B!7yY6B!7y/Binek-Krank-Kasn-152K24501",
    "/tr-TR/Product/Details/lX7hNrNpmvoheh6JLDkU3gY6B!7yY6B!7y/Binek-Krank-Kasn-152K24201",
    "/tr-TR/Product/Details/RkIMn4x95XkPCpS2bGq70x2OjCKaIPEQY6B!7yY6B!7y/Binek-Krank-Kasn-152K24301",
    "/tr-TR/Product/Details/yccpnx2OjC4dvhF7Ff4XzWzPlQY6B!7yY6B!7y/Ticari-Krank-Kasn-152K25601",
    "/tr-TR/Product/Details/gvwtiItZDIlgHWW5QOhJLwY6B!7yY6B!7y/Binek-Krank-Kasn-152K23801",
    "/tr-TR/Product/Details/GwSCBqKsT42x2OjCz4bKje74tgY6B!7yY6B!7y/Binek-Krank-Kasn-152K24001",
    "/tr-TR/Product/Details/OiQkWbS8u4gISbAxX8N7iQY6B!7yY6B!7y/Binek-Motor-Tako-152T01101",
    "/tr-TR/Product/Details/JucAZjlLhDKF4pmx06i4WQY6B!7yY6B!7y/Binek-Motor-Tako-152T01201",
    "/tr-TR/Product/Details/2h7NrCKx2OjCAr2cjbZymsQoMQY6B!7yY6B!7y/Binek-Torsiyonel-152K26101",
    "/tr-TR/Product/Details/MAQWhbgEKtFV6b0GoNx95XkPCpPAY6B!7yY6B!7y/Binek-Torsiyonel-152K2611S",
    "/tr-TR/Product/Details/uWz1wvbAjeqBG9AgQ9NN0AY6B!7yY6B!7y/Binek-Torsiyonel-152K26201",
    "/tr-TR/Product/Details/x95XkPCyUM4O4eTLNuvX3sOAqzzgY6B!7yY6B!7y/Binek-Torsiyonel-152K2621S",
    "/tr-TR/Product/Details/m7x2OjChQQj1p4cTex2OjCFxfx95XkPCprjAY6B!7yY6B!7y/Binek-Torsiyonel-152K26301",
    "/tr-TR/Product/Details/Tx95XkPCPvyKbQQ11BS6fG1kTJbgY6B!7yY6B!7y/Binek-Torsiyonel-152K2631S",
    "/tr-TR/Product/Details/q8fqFTjjxx95XkPCbmtflJQoXBNQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K26401",
    "/tr-TR/Product/Details/4GWqHba7uA043GKQXexL8wY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K26501",
    "/tr-TR/Product/Details/eIvNyQzn14nMqzx95XkPCxaS4YWQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K2651S",
    "/tr-TR/Product/Details/yx95XkPC7Y6ydaZSngwrelYEi3EgY6B!7yY6B!7y/Binek-Krank-Kasn-152K26701",
    "/tr-TR/Product/Details/iuHhIpx95XkPCSG7IAx0dZWB0VgQY6B!7yY6B!7y/Binek-Motor-Tako-152T01301",
    "/tr-TR/Product/Details/0PNa9djti0Tro4nDH4smlAY6B!7yY6B!7y/HAFIF-TICA-Motor-Tako-152T01401",
    "/tr-TR/Product/Details/x2OjCx2OjC5psvAfe4Ia1ksYwx2OjCS8mQY6B!7yY6B!7y/Binek-Motor-Tako-152T01501",
    "/tr-TR/Product/Details/4p25q9PQcpOwlixqfx2OjCy4ZQY6B!7yY6B!7y/Binek-Krank-Kasn-152K26001",
    "/tr-TR/Product/Details/x2OjCVSHFLvjlQ159HBu4x2OjClM6QY6B!7yY6B!7y/Binek-Krank-Kasn-152K2601S",
    "/tr-TR/Product/Details/EVFBcNGiNaFzuDrasYaqpQY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K26601",
    "/tr-TR/Product/Details/yx95XkPCsNl6bW3BS2GCVokgQ7zwY6B!7yY6B!7y/HAFIF-TICA-Krank-Kasn-152K2661S",

]

const baseURL = "https://www.kentpar.com.tr";


test.describe("Kentpar Full Scraper", () => {
    for (const link of Array.from(new Set(links))) {
        test(`Product page scraper for ${link}`, async ({ request }) => {
            const products: KentparProduct[] = [];
            const requestURL = `${baseURL}${link}`;
            //console.log(`Scraping URL: ${requestURL}`);

            const responseHTML = await (await request.get(requestURL)).text();
            const $ = cheerio.load(responseHTML);

            const selector = ".c-pager__custom > a";

            const len = $(selector).length < 3 ? $(selector).length : $(selector).length - 1;
            console.log(`Found ${len} pages.`);

            expect(len).toBeGreaterThan(0);

            for (let i = 0; i < len; i++) {
                const searchParams = "?oemPage=" + (i + 1) + "#oemTableTitle"
                const innerRequestURL = `${baseURL}${link}${searchParams}`;
                //console.log(`Scraping inner URL: ${innerRequestURL}`);

                const productDetailsHTML = await (await request.get(innerRequestURL)).text();
                const $$ = cheerio.load(productDetailsHTML);

                const ul_selector = ".p-product__detail-list-body";
                $$(ul_selector).each((index, ul) => {

                    const $li_elements = $$(ul).find("li");
                    const texts: string[] = [];
                    $li_elements.each((li_index, li) => {
                        texts.push($$(li).text().trim());
                    })
                    const product: KentparProduct = {
                        oe: texts[0] || "",
                        compatibility: texts[1] || "",
                        years: texts[2] || "",
                        engine: texts[3] || "",
                    }
                    products.push(product);
                });
            }
            fs.promises.appendFile(outputFilePath, JSON.stringify({ KENTPAR_NO: requestURL.slice(requestURL.lastIndexOf("-") + 1), products: products }, null, 2) + ",\n");
        });
    }

});
