const fs = require('fs');
const exifr = require('exifr');
const path = require('path');
const { promisify } = require('util');
const piexif = require('piexifjs');
const convert = require('heic-convert');

const heicDirectory = path.join(__dirname, 'HEIC');

fs.readdir(heicDirectory, (err, heicImg) => {
  if (err) console.log(err);

  // Convert HEIC to JPG
  heicImg.forEach((img, i) => {
    const filename = img.split('.')[0];
    const imgPath = path.join(__dirname, 'HEIC', img);
    promisify(fs.readFile)(imgPath).then((buffer) => {
      console.log(`Convert to buffer: ${i + 1}`);
      convert({
        buffer: buffer,
        format: 'JPEG',
        quality: 1,
      }).then((data) => {
        console.log(`Write to file: ${i + 1}`);
        promisify(fs.writeFile)(
          path.join(__dirname, 'JPG', `${filename}.jpg`),
          data
        );
      });
    });
  });

  // Insert metadata from HEIC to JPG
  heicImg.forEach((heicImg) => {
    const filename = heicImg.split('.')[0];
    const jpgPath = path.join(__dirname, 'JPG', `${filename}.jpg`);
    const jpeg = fs.readFileSync(jpgPath);
    const jpegData = jpeg.toString('binary');

    // Get metadata from HEIC image
    exifr
      .parse(path.join(__dirname, 'HEIC', heicImg), true)
      .then((heicMetadata) => {
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

        fs.writeFile(
          path.join(__dirname, 'jpgWithMetadata', `${filename}.jpg`),
          newJpeg
        );
      });
  });
});
