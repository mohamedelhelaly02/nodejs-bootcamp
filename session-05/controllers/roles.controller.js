const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require('../utils/appError')
const httpStatusText = require('../utils/httpStatusText')
const Role = require('../models/role.model')

const createRole = asyncWrapper(async (req, res, next) => {
    const { name, permissions } = req.body;

    if (!name) {
        return next(appError.create('Role name is required', 400, httpStatusText.ERROR));
    }

    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
        return next(appError.create(`Role '${name}' already exists`, 400, httpStatusText.ERROR));
    }

    const role = await Role.create({
        name: name.trim(),
        permissions: Array.isArray(permissions) ? permissions : []
    });

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: role
    });
});

module.exports = { createRole };