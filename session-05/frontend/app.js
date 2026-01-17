// fetch('http://localhost:4000/api/v1/courses')
//     .then(response => response.json())
//     .then(data => console.log(data))
//     .catch(error => console.error('Error fetching courses:', error));


fetch('https://nodejs-bootcamp.vercel.app/api/v1/users/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'me5260287@gmail.com',
        password: 'P@ssword1234'
    })
})
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
