const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'profilePhoto') {
            uploadPath += 'profiles';
        } else if (file.fieldname === 'passbookPhoto') {
            uploadPath += 'bank-details';
        } else if (file.fieldname === 'images') {
            uploadPath += 'properties';
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

module.exports = upload;