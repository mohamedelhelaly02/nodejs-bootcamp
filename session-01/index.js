const express = require('express');
const os = require('os');
const fs = require('fs');

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// read file

// const fileContent = fs.readFileSync('./data.txt', { encoding: 'utf-8' });
// console.log('Data from file:', fileContent);

// fs.readFile('./data.txt', { encoding: 'utf-8' }, (err, data) => {
//     if (err) {
//         console.error('Error reading file:', err);
//     } else {
//         console.log('Asynchronous read data:', data);
//     }
// });


// fs.readFile('./posts.json', {encoding: 'utf-8'}, (err, data) => {
//     if (err) {
//         console.error('Error reading posts.json file:', err);
//     } else {
//         const posts = JSON.parse(data);
//         console.log('Posts data:', posts);
//     }
// });


// // create a file

// fs.writeFile('./test.txt', 'This is a new file created by Node.js', (err) => {
//     if (err) {
//         console.error('Error creating file:', err);
//     } else {
//         console.log('File created successfully');
//     }
// });

// fs.appendFile('./test.txt', '\nAppending some data to the file.', (err) => {
//     if (err) {
//         console.error('Error appending to file:', err);
//     } else {
//         console.log('Data appended successfully');

//     }
// });

// fs.writeFile('./users.json', JSON.stringify([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}], null, 2), (err) => {
//     if (err) {
//         console.error('Error writing users.json file:', err);   
//     } else {
//         console.log('users.json file created successfully');
//     }
// });



// const rSream = fs.createReadStream('./posts.json', { encoding: 'utf-8' });
// const wStream = fs.createWriteStream('./copy_of_posts.json', { encoding: 'utf-8' });
// rSream.on('data', (chunk) => {
//     console.log('Received chunk:', chunk);
//     wStream.write('\n--- New Chunk ---\n');
//     wStream.write(chunk);
// });

app.get('/posts/:postId', (req, res) => {
    const { postId } = req.params;
    fs.readFile('./posts.json', { encoding: 'utf-8' }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading posts.json file' });
        }

        const posts = JSON.parse(data).posts;

        const post = posts.find(post => post.id === parseInt(postId));
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(200).json(post);
    });
});

app.get('/api/posts', (req, res) => {
    fs.readFile('./posts.json', { encoding: 'utf-8' }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading posts.json file' });
        }
        const posts = JSON.parse(data);
        res.json(posts);
    });
})

app.get('/posts/:postId/body', (req, res) => {
    const { postId } = req.params;
    fs.readFile('./posts.json', { encoding: 'utf-8' }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading posts.json file' });
        }
        const posts = JSON.parse(data).posts;
        const post = posts.find(post => post.id === parseInt(postId));
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(200).json({ body: post.body });
    });
})

app.get('/posts/:postId/tags', (req, res) => {
    const { postId } = req.params;
    fs.readFile('./posts.json', { encoding: 'utf-8' }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading posts.json file' });
        }

        const posts = JSON.parse(data).posts;
        const post = posts.find(post => post.id === parseInt(postId));
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(200).json(post.tags || []);

    });
  
})


app.get('/', (req, res) => {
    console.log(`Server is running on host: ${os.hostname()}`);
    console.log(`Current ip address: ${req.ip}`);
    res.send('Hello, World!');
})

app.post('/api/posts', (req, res) => {
    const { title, body, tags } = req.body;
    fs.readFile('./posts.json', { encoding: 'utf-8' }, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading posts.json file' });
        }
        const posts = JSON.parse(data).posts;
        const newPost = { id: posts.length + 1, title, body, tags };
        posts.push(newPost);
        fs.writeFile('./posts.json', JSON.stringify({ posts }, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error writing posts.json file' });
            }
            return res.status(201).json(newPost);
        });
    });
})


app.post('/posts/:postId/reactions', (req, res) => {
    const { postId } = req.params;
    const { reaction } = req.body;
    fs.readFile('./posts.json', {encoding: 'utf-8'}, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading posts.json file' });
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});