const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '../public/logos/yuyutei.png');
const svgPath = path.join(__dirname, '../public/logos/yuyutei.svg');

const b64 = fs.readFileSync(pngPath).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="50" fill="#ffffff"/>
  <image href="data:image/png;base64,${b64}" x="6" y="6" width="88" height="88"/>
</svg>`;

fs.writeFileSync(svgPath, svg, 'utf-8');
console.log('Successfully wrote yuyutei.svg with phoenix logo!');
