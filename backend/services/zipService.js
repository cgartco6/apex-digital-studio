const JSZip = require('jszip');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ZipService {
  async createZipFromUrls(fileUrls, zipName) {
    const zip = new JSZip();
    for (let i = 0; i < fileUrls.length; i++) {
      const url = fileUrls[i];
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const fileName = path.basename(url);
      zip.file(fileName, response.data);
    }
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(__dirname, '../uploads/zips', `${zipName}.zip`);
    fs.writeFileSync(zipPath, content);
    return zipPath;
  }

  async createZipFromLocalFiles(filePaths, zipName) {
    const zip = new JSZip();
    for (const filePath of filePaths) {
      const data = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      zip.file(fileName, data);
    }
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(__dirname, '../uploads/zips', `${zipName}.zip`);
    fs.writeFileSync(zipPath, content);
    return zipPath;
  }
}
module.exports = new ZipService();
