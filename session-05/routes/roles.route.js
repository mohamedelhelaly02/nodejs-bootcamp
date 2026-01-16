const express = require('express');
const { createRole } = require('../controllers/roles.controller');
const router = express.Router();

router.route('').post(createRole);

module.exports = { rolesRouter: router };