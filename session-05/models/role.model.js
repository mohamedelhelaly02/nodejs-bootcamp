const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    normalizedName: {
        type: String,
        unique: true
    },
    description: String,

    permissions: [{
        type: String
    }]
}, { timestamps: true });

// roleSchema.pre('save', function (next) {
//     if (this.name) {
//         this.normalizedName = this.name.trim().toLowerCase();
//     }
//     next();
// });


module.exports = mongoose.model('Role', roleSchema);
