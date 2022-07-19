const fs = require('fs');
const exifr = require('exifr');
const path = require('path');
const { promisify } = require('util');
const piexif = require('piexifjs');
const convert = require('heic-convert');

const heicDirectory = path.join(__dirname, 'HEIC');

const heicImageArray = fs.readdirSync(heicDirectory);

const main = async () => {
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
  insertMetadata();
};

const insertMetadata = async () => {
  for (const image of heicImageArray) {
    const filename = image.split('.')[0];
    const jpgPath = path.join(__dirname, 'JPG', `${filename}.jpg`);
    const jpegData = fs.readFileSync(jpgPath).toString('binary');

    const heicMetadata = await exifr.parse(
      path.join(__dirname, 'HEIC', image),
      true
    );

    const zeroth = {};
    const exif = {};
    const gps = {};

    const date = heicMetadata.DateTimeOriginal.toLocaleString()
      .split(',')[0]
      .replaceAll('/', ':')
      .split(':')
      .reverse();
    [date[1], date[2]] = [date[2], date[1]];

    const time = heicMetadata.DateTimeOriginal.toLocaleString()
      .split(', ')[1]
      .split(' ');

    const convertHourFromTime = (time) => {
      if (time[1] == 'PM') {
        const newHour = +time[0].split(':')[0] + 12 + '';
        const oldHour = time[0].split(':')[0];
        const newTime = time[0].replace(oldHour, newHour);
        return newTime;
      }
    };

    const dateTime = `${date.join(':')} ${convertHourFromTime(time)}`;

    exif[piexif.ExifIFD.DateTimeOriginal] = dateTime;
    zeroth[piexif.ImageIFD.Make] = heicMetadata.Make;
    zeroth[piexif.ImageIFD.Model] = heicMetadata.Model;

    const exifObj = { '0th': zeroth, Exif: exif, GPS: gps };
    const exifbytes = piexif.dump(exifObj);

    const newData = piexif.insert(exifbytes, jpegData);
    const newJpeg = Buffer.from(newData, 'binary');

    fs.writeFileSync(jpgPath, newJpeg);
  }
  console.log('Insert metadata from HEIC image to converted JPG image: Done!');
};

main();
