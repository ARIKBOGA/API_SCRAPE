async function testit() {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer P5s9scqqtddUrut-yC2AT7MDj4I");
    myHeaders.append("Cookie", "JSESSIONID=B9359463EDFAD2301C46B4B8D01F2B89");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        //redirect: "follow"
    };

    try {
        const response = await fetch("https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers?globalCarPark=true&targetTypeCodes=passengerCar ", requestOptions);
        const result = await response.text();
        console.log(result)
    } catch (error) {
        console.error(error);
    };
}

testit()