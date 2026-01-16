const Course = require('../models/course.model');
const httpStatusText = require('../utils/httpStatusText');

const asyncWrapper = require('../middlewares/asyncWrapper');

const { paginateResponse } = require('../utils/paginateResponse');

// Controllers should NOT send 500 errors directly

// Controllers throw errors or pass them to next(err)

// One global error middleware handles everything

const getAllCourses = asyncWrapper(
    async (req, res) => {

        const { limit, page, skip, totalItems, totalPages } = await paginateResponse(req, Course);

        const courses = await Course.find({}, { __v: 0 }).limit(limit).skip(skip);

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: { courses },
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                perPage: limit
            }
        });
    }
);

const addCourse = asyncWrapper(
    async (req, res) => {
        const newCourse = await Course.create(req.body);

        res.status(201).json({
            status: httpStatusText.SUCCESS,
            data: newCourse
        });
    }
);

const getCourseById = asyncWrapper(
    async (req, res) => {

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                status: httpStatusText.FAIL,
                data: { course: null }
            });
        }

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: { course }
        });
    }
);

const deleteCourse = asyncWrapper(
    async (req, res) => {
        const id = req.params.id;
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({
                status: httpStatusText.FAIL,
                data: { course: null }
            });
        }

        await Course.deleteOne({ _id: id });

        return res.status(204).json({
            status: httpStatusText.SUCCESS,
            data: null
        });
    }
);

const updateCourse = asyncWrapper(
    async (req, res) => {
        const id = req.params.id;
        const existedCourse = await Course.findByIdAndUpdate(id, { $set: { ...req.body } });

        if (!existedCourse) {
            return res.status(404).json({
                status: httpStatusText.FAIL,
                data: { course: null }
            });
        }

        const updatedCourse = await Course.findById(id);

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: updatedCourse
        });
    }
);

module.exports = { getAllCourses, addCourse, getCourseById, deleteCourse, updateCourse };