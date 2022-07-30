const webp = require('webp-converter');
const { readdirSync } = require('fs');
const path = require('path');

const webpFolder = readdirSync(path.join(__dirname, 'webp'));

for (const webpImage of webpFolder) {
  const filename = webpImage.split('.')[0];
  const webpImagePath = path.join(__dirname, 'webp', webpImage);
  const jpgImagePath = path.join(__dirname, 'jpg', `${filename}.jpg`);

  const result = webp.dwebp(
    webpImagePath,
    jpgImagePath,
    '-o',
    (logging = '-v')
  );
  result.then((response) => {
    console.log(response);
  });
}
