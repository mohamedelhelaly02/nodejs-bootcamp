const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));

// app.use((req, res, next) => {
//     console.log(`Method: ${req.method}, Url: ${req.url}`);
//     next();
// })

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
