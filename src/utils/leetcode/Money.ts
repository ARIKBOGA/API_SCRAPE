

const BANKNOTES = [200, 100, 50, 20, 10, 5, 1]

function banknot(amount: number): Map<number, number> {


    const result = new Map<number, number>();

    for (let i = 0; i < BANKNOTES.length; i++) {

        const bankUnit = BANKNOTES[i];
        const count = Math.floor(amount / bankUnit);
        result.set(bankUnit, count);
        amount = amount % bankUnit;
    }


    return result;

}

console.log(banknot(10794))