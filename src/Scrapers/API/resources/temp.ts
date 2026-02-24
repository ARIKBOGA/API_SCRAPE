const arr = [
  {
    yvNo: '24303',
    supplier: 'BREMBO',
    freeTextSearch: '09.9508.14, 09.A895.11',
  },
  {
    yvNo: '16337',
    supplier: 'BREMBO',
    freeTextSearch: '09.9574.10, 09.9574.40',
  },
  {
    yvNo: '18366',
    supplier: 'BREMBO',
    freeTextSearch: '09.5581.20, 09.7824.10',
  },
  {
    yvNo: '33379',
    supplier: 'BREMBO',
    freeTextSearch: '09.A235.20, 09.D017.11',
  },
  {
    yvNo: '13401',
    supplier: 'BREMBO',
    freeTextSearch: '09.A427.10, 09.A427.31',
  },
  {
    yvNo: '26403',
    supplier: 'BREMBO',
    freeTextSearch: '09.A716.20, 09.B596.10',
  },
  {
    yvNo: '28404',
    supplier: 'BREMBO',
    freeTextSearch: '09.8303.10, 09.C658.11, 09.C825.11',
  },
  {
    yvNo: '34408',
    supplier: 'BREMBO',
    freeTextSearch: '09.A130.20, 09.A130.10',
  },
  {
    yvNo: '25411',
    supplier: 'BREMBO',
    freeTextSearch: '09.A868.10, 09.D576.11',
  },
  {
    yvNo: '25526',
    supplier: 'BREMBO',
    freeTextSearch: '09.A148.10, 09.B647.10',
  },
  {
    yvNo: '15457',
    supplier: 'BREMBO',
    freeTextSearch: '08.7104.14, 08.5719.10',
  },
  {
    yvNo: '53476',
    supplier: 'BREMBO',
    freeTextSearch: '09.B355.10, 09.D391.11',
  },
  {
    yvNo: '18486',
    supplier: 'BREMBO',
    freeTextSearch: '09.A532.10, 09.A532.20, 09.A807.10, 09.D210.11',
  },
  {
    yvNo: '16492',
    supplier: 'BREMBO',
    freeTextSearch: '09.C171.10, 09.C173.11, 09.D227.11',
  },
  {
    yvNo: '28501',
    supplier: 'BREMBO',
    freeTextSearch: '08.9606.10, 08.7351.14',
  },
  {
    yvNo: '52523',
    supplier: 'BREMBO',
    freeTextSearch: '09.9173.14, 09.C894.11',
  },
  {
    yvNo: '13554',
    supplier: 'BREMBO',
    freeTextSearch: '09.9468.14, 09.C541.11',
  },
  {
    yvNo: '30478B',
    supplier: 'BREMBO',
    freeTextSearch: '08.B395.17, 08.B395.27',
  },
  {
    yvNo: '13578',
    supplier: 'BREMBO',
    freeTextSearch: '09.C542.11, 09.A728.10',
  },
  {
    yvNo: '27590',
    supplier: 'BREMBO',
    freeTextSearch: '09.B356.20, 09.D392.11',
  },
  {
    yvNo: '41624C',
    supplier: 'BREMBO',
    freeTextSearch: '08.9136.10, 08.5213.20',
  },
  {
    yvNo: '24626CS',
    supplier: 'BREMBO',
    freeTextSearch: '09.7960.11, 09.A353.11',
  },
  {
    yvNo: '62660C',
    supplier: 'BREMBO',
    freeTextSearch: '09.B858.11, 09.8877.30',
  },
  {
    yvNo: '16726',
    supplier: 'BREMBO',
    freeTextSearch: '09.A601.11, 09.B614.10',
  },
  {
    yvNo: '25733',
    supplier: 'BREMBO',
    freeTextSearch: '09.A637.20, 09.N264.11',
  },
  {
    yvNo: '52881C',
    supplier: 'BREMBO',
    freeTextSearch: '09.C405.13, 09.C406.13',
  },
  {
    yvNo: '36920',
    supplier: 'BREMBO',
    freeTextSearch: '09.C882.11, 09.A062.11, 09.A063.11',
  },
  {
    yvNo: '47944',
    supplier: 'BREMBO',
    freeTextSearch: '09.9363.20, 09.D209.11',
  },
  {
    yvNo: '15798',
    supplier: 'BREMBO',
    freeTextSearch: '09.C312.11, 09.C312.21',
  },
  {
    yvNo: '33962',
    supplier: 'BREMBO',
    freeTextSearch: '08.5086.21, 08.5086.34',
  },
  {
    yvNo: '52990',
    supplier: 'BREMBO',
    freeTextSearch: '09.D094.13, 09.D095.13',
  },
  {
    yvNo: '47944CS',
    supplier: 'BREMBO',
    freeTextSearch: '09.9363.20, 09.D209.11',
  },
  {
    yvNo: '241503CS',
    supplier: 'BREMBO',
    freeTextSearch: '09.A731.11, 09.A731.21',
  },
  {
    yvNo: '411504',
    supplier: 'BREMBO',
    freeTextSearch: '09.A201.10, 09.C892.11',
  },
  {
    yvNo: '551506',
    supplier: 'BREMBO',
    freeTextSearch: '09.N235.11, 09.N235.21',
  },
  {
    yvNo: '33197CS',
    supplier: 'BREMBO',
    freeTextSearch: '09.4939.2X, 09.C645.11',
  },
  {
    yvNo: '661510',
    supplier: 'BREMBO',
    freeTextSearch: '09.C985.21, 09.C986.21',
  },
  {
    yvNo: '52990C',
    supplier: 'BREMBO',
    freeTextSearch: '09.D094.13, 09.D095.13',
  },
  {
    yvNo: '52990CS',
    supplier: 'BREMBO',
    freeTextSearch: '09.D094.13, 09.D095.13',
  },
];

const results = arr.flatMap(({ yvNo, supplier, freeTextSearch }) => freeTextSearch
    .split(',')
    .map(str => str.trim())
    .map(search => ({ yvNo, supplier, freeTextSearch: search })));

console.log(results);