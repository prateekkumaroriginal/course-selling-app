const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const ADMINS = [];
const USERS = [];
const COURSES = [];

function adminAuthentication(req, res, next) {
    const { username, password } = req.headers;
    const admin = ADMINS.find(x => x.username === username && x.password === password);
    if (admin) {
        next();
    } else {
        res.status(403).json({ message: 'Invalid credentials' });
    }
}

function userAuthentication(req, res, next) {
    const { username, password } = req.headers;
    const user = USERS.find(x => x.username === username && x.password === password);
    if (user) {
        req.user = user;
        next();
    } else {
        res.status(403).json({ message: 'Invalid credentials' });
    }
}

app.post('/admin/signup', (req, res) => {
    const newAdmin = req.body;
    const existingAdmin = ADMINS.find(x => x.username === newAdmin.username);
    if (existingAdmin) {
        res.status(403).json({ message: 'Admin already exists' });
    } else {
        ADMINS.push(newAdmin)
        res.status(201).json({ message: 'Admin created successfully' });
    }
});

app.post('/admin/login', adminAuthentication, (req, res) => {
    res.json({ message: 'Logged in successfully' });
});

app.post('/admin/courses', adminAuthentication, (req, res) => {
    const course = req.body;
    course.id = Date.now();
    COURSES.push(course);
    res.status(201).json({
        message: 'Course created successfully',
        courseId: course.id
    });
});

app.put('/admin/courses/:courseId', adminAuthentication, (req, res) => {
    const course = COURSES.find(x => x.id === parseInt(req.params.courseId));
    if (course) {
        Object.assign(course, req.body);
        res.json({ message: 'Course updated successfully' });
    } else {
        res.status(404).json({ message: 'Course not found' });
    }
});

app.get('/admin/courses', adminAuthentication, (req, res) => {
    res.json({ courses: COURSES });
});

app.post('/users/signup', (req, res) => {
    const user = { ...req.body, purchasedCourses: [] };
    const existingUser = USERS.find(x => x.username === user.username);
    if (existingUser) {
        res.status(403).json({ message: 'User already exists' });
    } else {
        USERS.push(user);
        res.status(201).json({ message: 'User created successfully' });
    }
});

app.post('/users/login', userAuthentication, (req, res) => {
    res.json({ message: 'Logged in successfully' });
});

app.get('/users/courses', userAuthentication, (req, res) => {
    res.json({ courses: COURSES.filter(x => x.published) });
});

app.post('/users/courses/:courseId', userAuthentication, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = COURSES.find(x => x.id === courseId && x.published);
    if (course) {
        req.user.purchasedCourses.push(courseId);
        res.json({message: 'Course purchased successfully'});
    } else {
        res.status(404).send({ message: 'Course not found' });
    }
});

app.get('/users/purchasedCourses', userAuthentication, (req, res) => {
    const purchasedCourses = COURSES.filter(x => req.user.purchasedCourses.includes(x.id));
    res.json({purchasedCourses});
});

app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
});