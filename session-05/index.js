const express = require('express');
const morgan = require('morgan');
const { coursesRouter } = require('./routes/courses.route');
const { usersRouter } = require('./routes/users.route');
require('dotenv').config();
const httpStatusText = require('./utils/httpStatusText');
const port = process.env.PORT || 3000;
const cors = require('cors');
const mongoose = require('mongoose');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const fileUpload = require('express-fileupload');
const { uploadImages } = require('./services/imageUpload.service');
const asyncWrapper = require('./middlewares/asyncWrapper');
const path = require('path');
const { rolesRouter } = require('./routes/roles.route');

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('Error connecting to MongoDB', err);
    });


const app = express();

app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());

app.use(express.json());

app.use('/api/v1/courses', coursesRouter);

app.use('/api/v1/users', usersRouter);
app.use('/api/v1/roles', rolesRouter);

app.post('/api/v1/upload', fileUpload(), asyncWrapper(async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'No files were uploaded.'
        });
    }

    const { uploaded, errors } = await uploadImages(req.files);

    if (errors.length > 0) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Some files failed to upload.',
            data: { uploaded, errors }
        });
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'All files uploaded successfully.',
        data: { uploaded }
    });



}));

app.use((req, res, next) => {
    res.status(404).json({
        status: httpStatusText.ERROR,
        message: 'Resource not found'
    });
});

app.use(globalErrorHandler);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});