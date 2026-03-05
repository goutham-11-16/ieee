async function testDriveUpload() {
    const url = 'https://script.google.com/macros/s/AKfycbwpkPbNnA58sQUfBq-okx320mCAxTPYZGnPSwfv6TxKgC7JNlYw1UBZL-WLY0Qsw75n/exec';

    // Very simple 1x1 base64 transparent PNG
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    const payload = {
        base64Data,
        filename: 'test.png',
        mimeType: 'image/png',
        targetFolder: 'TestFolder',
        eventTitle: 'Test Event'
    };

    console.log("Sending POST to", url);
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testDriveUpload();
