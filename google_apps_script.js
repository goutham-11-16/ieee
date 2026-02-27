// ------------------------------------------------------------------
// Google Apps Script For Club Event Management Payment Screenshots
// ------------------------------------------------------------------
var TARGET_FOLDER_ID = '1MS0EKeNDpyCQlmsVY3JTYOfqIDjl_WF3';

function doPost(e) {
    try {
        var data;

        // Next.js fetch API sometimes sends it as raw JSON in contents, sometimes in parameter if it was a form
        if (e.postData && e.postData.contents) {
            data = JSON.parse(e.postData.contents);
        } else {
            data = e.parameter;
        }

        var base64Data = data.base64 || data.base64Data;
        var filename = data.filename || 'payment_screenshot.png';
        var mimeType = data.mimeType || 'image/png';
        var eventTitle = data.eventTitle || 'Unknown Event';

        if (!base64Data) {
            throw new Error("Missing Base64 Data in payload.");
        }

        // Decode base64 
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, mimeType, filename);

        // 1. Get the root target folder
        var rootFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);

        // 2. Find or create the Event folder inside the root folder
        var eventFolders = rootFolder.getFoldersByName(eventTitle);
        var eventFolder;
        if (eventFolders.hasNext()) {
            eventFolder = eventFolders.next();
        } else {
            eventFolder = rootFolder.createFolder(eventTitle);
        }

        // 3. Find or create the "Payments" folder inside the Event folder
        var paymentFolders = eventFolder.getFoldersByName("Payments");
        var paymentFolder;
        if (paymentFolders.hasNext()) {
            paymentFolder = paymentFolders.next();
        } else {
            paymentFolder = eventFolder.createFolder("Payments");
        }

        // 4. Create the file inside the Payments folder
        var file = paymentFolder.createFile(blob);

        // 5. Make the file publicly viewable so the Admin Dashboard can see the image
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            url: file.getUrl(),
            fileId: file.getId()
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doOptions(e) {
    return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
