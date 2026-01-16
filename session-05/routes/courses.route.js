const express = require('express');

const {
    getAllCourses,
    addCourse,
    getCourseById,
    deleteCourse,
    updateCourse
} = require('../controllers/courses.controller');

const { validationSchema } = require('../validators/validationSchema');

const { validateMiddleware } = require('../middlewares/validateMiddleware');

const { validateObjectId } = require('../middlewares/validateObjectId');
const { verifyToken } = require('../middlewares/verifyToken');
const userRoles = require('../utils/userRoles');
const { allowedTo } = require('../middlewares/allowedTo');

const router = express.Router();

router.route('')
    .get(verifyToken, getAllCourses)
    .post(validationSchema(), validateMiddleware, addCourse);

router.route('/:id')
    .get(validateObjectId('id'), getCourseById)
    .delete(verifyToken, allowedTo(userRoles.ADMIN, userRoles.MANAGER), validateObjectId('id'), deleteCourse)
    .put(validateObjectId('id'), validationSchema(), validateMiddleware, updateCourse);

module.exports = { coursesRouter: router };