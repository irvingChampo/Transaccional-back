const multer = require('multer');

const uploadConfig = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') 
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
};

const uploadSingleImage = (fieldName) => {
    return multer(uploadConfig).single(fieldName);
};

const uploadTaskImage = (req, res, next) => {
    const upload = multer(uploadConfig).single('imagen');
    
    upload(req, res, (error) => {
        if (error) {
            return handleUploadError(error, req, res, next);
        }
        next();
    });
};

const uploadMultipleImages = (fieldName, maxFiles = 5) => {
    return multer(uploadConfig).array(fieldName, maxFiles);
};

const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    mensaje: `Archivo demasiado grande. Máximo ${parseInt(process.env.MAX_FILE_SIZE || '5242880') / 1024 / 1024}MB.`
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    mensaje: 'Campo de archivo inesperado.'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    mensaje: 'Demasiados archivos.'
                });
            default:
                return res.status(400).json({
                    success: false,
                    mensaje: `Error de archivo: ${error.message}`
                });
        }
    }
    
    if (error && error.message === 'Tipo de archivo no permitido') {
        return res.status(400).json({
            success: false,
            mensaje: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP).'
        });
    }
    
    next(error);
};

const makeImageOptional = (fieldName) => {
    return (req, res, next) => {
        const upload = uploadSingleImage(fieldName);
        upload(req, res, (error) => {
            if (error && error.message === 'Unexpected field') {
                next();
            } else if (error) {
                handleUploadError(error, req, res, next);
            } else {
                next();
            }
        });
    };
};

const handleImageUpload = (fieldName = 'imagen') => {
    return (req, res, next) => {
        if (!req.body) {
            req.body = {};
        }

        if (req.body && req.body.base64Image) {
            return next();
        }

        if (req.body && req.body.eliminarImagen) {
            return next();
        }

        const upload = uploadSingleImage(fieldName);
        upload(req, res, (error) => {
            if (error) {
                return handleUploadError(error, req, res, next);
            }
            next();
        });
    };
};

const uploadTaskImageOptional = makeImageOptional('imagen');

module.exports = {
    uploadSingleImage,
    uploadTaskImage,
    uploadTaskImageOptional,
    uploadMultipleImages,
    handleUploadError,
    makeImageOptional,
    handleImageUpload
};