// ------------------------------------------------------------------
// Google Apps Script For Club Event Management Payment Screenshots
// ------------------------------------------------------------------
// IMPORTANT INSTRUCTIONS:
// 1. Go to https://script.google.com/ and create a "New Project"
// 2. Name it "Club Event Management Uploads"
// 3. Paste this exact code, replacing everything in the editor.
// 4. IMPORTANT: Change the `TARGET_FOLDER_ID` below to the ID of a Google Drive folder you own!
//    (You get the folder ID from the URL: drive.google.com/drive/folders/[THIS_IS_THE_ID])
// 5. Click Deploy -> New Deployment.
// 6. Select Type: "Web App"
// 7. Execute as: "Me", Who has access: "Anyone"
// 8. Click Deploy, Authorize access, and COPY the "Web App URL" provided.
// 9. Reply to me with that URL!

var TARGET_FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

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
        var filename = data.filename || 'payment_screenshot.png'; // add default extension just in case
        var mimeType = data.mimeType || 'image/png';

        if (!base64Data) {
            throw new Error("Missing Base64 Data in payload. Make sure you are sending JSON with { 'base64': '...' }");
        }

        // Decode base64 
        var decoded = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decoded, mimeType, filename);

        var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
        var file = folder.createFile(blob);

        // Make the file publicly viewable so the Admin Dashboard can see the image
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

// Needed to handle CORS preflight requests from your Next.js app
function doOptions(e) {
    return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
