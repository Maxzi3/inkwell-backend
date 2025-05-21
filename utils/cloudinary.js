const sharp = require("sharp");
const streamifier = require("streamifier");
const { v2: cloudinary } = require("cloudinary");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadToCloudinary = (buffer, publicId, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        format: "jpeg",
      },
      (err, result) => {
        if (result) resolve(result);
        else reject(err);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

exports.resizeImage = async (buffer) => {
  return await sharp(buffer)
    .resize(500, 500)
    .jpeg({ quality: 80 }) // Compress the image
    .toBuffer();
};
