const paginateResponse = async (req, model, filter = {}) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const totalItems = await model.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return {
        limit,
        page,
        skip,
        totalItems,
        totalPages
    };
}

module.exports = { paginateResponse };