const {Router} = require("express");
const multer = require("multer");
const path = require("path");
const router = Router();
const photoPath = path.resolve(__dirname, '../../client/photo-viewer.html');
const imageProcessor = require('./imageProcessor.js');
router.get('/photo-viewer', (req, res) => {
    res.sendFile(photoPath)
})
const storage = multer.diskStorage({
    destination: 'api/uploads/',
    filename: filename
});
const upload = multer({
    fileFilter: fileFilter, storage: storage
});


function filename(request, file, callback) {
    callback(null, file.originalname)
}

function fileFilter(request, file, callback) {
    if (file.mimetype !== 'image/png') {
        request.fileValidationError = 'Wrong file type'
        callback(null, false, Error('Wrong file type'))
    } else {
        callback(null, true)
    }
}

router.post('/upload', upload.single('photo'), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({
            error: req.fileValidationError
        });
    }
    try {
        await imageProcessor(req.file.filename)
    } catch (e) {
        throw e
    }
    return res.status(201).json({success: true})
})

module.exports = router