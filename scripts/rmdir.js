const fs = require('fs');
const path = require('path');

const directoryToDelete = process.argv[2];
if (!directoryToDelete) {
    throw new Error('Please give a valid directory path');
}

const directoryToDeletePath = path.join(__dirname, '..', directoryToDelete);
if (fs.existsSync(directoryToDeletePath)) {
    deleteFolderRecursive(directoryToDeletePath);
}

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            const curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
