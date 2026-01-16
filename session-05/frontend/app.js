fetch('http://localhost:4000/api/v1/courses')
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error fetching courses:', error));