const fs = require('fs');
const exifr = require('exifr');
const path = require('path');
const { promisify } = require('util');
const piexif = require('piexifjs');
const convert = require('heic-convert');

const heicDirectory = path.join(__dirname, 'HEIC');

const heicImageArray = fs.readdirSync(heicDirectory);

function formatDate(dateTime) {
  const newDate = new Date(dateTime);
  const date = newDate.toISOString().split('T')[0].replaceAll('-', ':');
  const time = newDate.toTimeString().split(' ')[0];

  return `${date} ${time}`;
}

(async function () {
  for (const image of heicImageArray) {
    const filename = image.split('.')[0];
    const heicImagePath = path.join(__dirname, 'HEIC', image);
    const jpgImagePath = path.join(__dirname, 'JPG', `${filename}.jpg`);

    const buffer = await promisify(fs.readFile)(heicImagePath);
    const jpgBuffer = await convert({
      buffer,
      format: 'JPEG',
      quality: 1,
    });
    fs.writeFileSync(jpgImagePath, jpgBuffer);
    console.log(`${image} -> ${filename}.jpg: Done!`);
  }
  console.log('Convert all HEIC to JPG: Done!');

  for (const image of heicImageArray) {
    const filename = image.split('.')[0];
    const jpgPath = path.join(__dirname, 'JPG', `${filename}.jpg`);
    const jpegData = fs.readFileSync(jpgPath).toString('binary');

    const heicMetadata = await exifr.parse(
      path.join(__dirname, 'HEIC', image),
      true
    );

    const dateTime = formatDate(heicMetadata.DateTimeOriginal);

    const exif = {
      [piexif.ExifIFD.DateTimeOriginal]: dateTime,
    };
    const zeroth = {
      [piexif.ImageIFD.Make]: heicMetadata.Make,
      [piexif.ImageIFD.Model]: heicMetadata.Model,
    };

    const exifObj = { '0th': zeroth, Exif: exif };
    const exifbytes = piexif.dump(exifObj);

    const newData = piexif.insert(exifbytes, jpegData);
    const newJpeg = Buffer.from(newData, 'binary');

    fs.writeFileSync(jpgPath, newJpeg);
  }
  console.log('Insert metadata from HEIC image to converted JPG image: Done!');
})();
