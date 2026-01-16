const path = require('path');
const fs = require('fs');
const { log } = require('console');
const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
const imageSizeLimit = 5 * 1024 * 1024; // 5MB
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const isValidImage = (image) => {
    const ext = path.extname(image.name).toLowerCase();
    if (!allowedImageExtensions.includes(ext)) {
        return `Invalid image format. Allowed formats: ${allowedImageExtensions.join(', ')}`;
    }

    if (image.size > imageSizeLimit) {
        return `Image size exceeds the limit of ${imageSizeLimit / (1024 * 1024)}MB.`;
    }
    return null;
}


const uploadImages = async (files) => {
    const uploaded = [];
    const errors = [];

    for (const fileKey of Object.keys(files)) {
        const file = files[fileKey];
        const images = Array.isArray(file) ? file : [file];
        for (const image of images) {
            const validationError = isValidImage(image);
            if (validationError) {
                errors.push({ fileName: image.name, error: validationError });
                log(`Validation error for ${image.name}: ${validationError}`);
                continue;
            }

            const ext = path.extname(image.name);
            const baseName = path.basename(image.name, ext);
            const uniqueFileName = `${baseName.toLowerCase()}_${Date.now()}${ext}`;

            const uploadPath = path.join(uploadsDir, uniqueFileName);
            try {
                await image.mv(uploadPath);
                uploaded.push({ fileName: image.name, path: `/uploads/${image.name}` });
                log(`Successfully uploaded ${image.name} to ${uploadPath}`);
            } catch (err) {
                errors.push({ fileName: image.name, error: 'Failed to upload image.' });
            }
        }
    }

    return { uploaded, errors };
}

module.exports = { uploadImages };