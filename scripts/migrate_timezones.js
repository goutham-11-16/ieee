const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:/project files/IEEE/club-event-management/src');
let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We use regex to carefully inject { timeZone: 'Asia/Kolkata' } into the options object

    // Case 1: toLocaleDateString('en-US') or ('en-GB')
    content = content.replace(/\.toLocaleDateString\((['"][a-zA-Z-]+['"])\)/g, ".toLocaleDateString($1, { timeZone: 'Asia/Kolkata' })");

    // Case 2: toLocaleDateString() Empty
    content = content.replace(/\.toLocaleDateString\(\)/g, ".toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })");

    // Case 3: toLocaleTimeString() with format but no options
    content = content.replace(/\.toLocaleTimeString\((['"][a-zA-Z-]+['"])\)/g, ".toLocaleTimeString($1, { timeZone: 'Asia/Kolkata' })");

    // Case 4: toLocaleTimeString() Empty
    content = content.replace(/\.toLocaleTimeString\(\)/g, ".toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })");

    // Case 5: toLocaleString() Empty
    content = content.replace(/\.toLocaleString\(\)/g, ".toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
}

console.log(`Successfully updated ${changedFiles} files with IST timezone forced formatting.`);
