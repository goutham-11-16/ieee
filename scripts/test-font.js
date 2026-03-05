async function testFetchFont(family) {
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'curl/7.81.0'
        }
    });
    const css = await res.text();
    console.log("CSS RESPONSE for", family);
    console.log(css);
}

testFetchFont('Montserrat');
