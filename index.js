const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
require('dotenv').config();

app.use(bodyParser.json());
const secretKey = process.env.SECRET_KEY;

const ADMINS = [];
const USERS = [];
const COURSES = [];

const generateJwt = (user) => {
    const payload = { username: user.username };
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}

const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}

app.post('/admin/signup', (req, res) => {
    const newAdmin = req.body;
    const existingAdmin = ADMINS.find(x => x.username === newAdmin.username);
    if (existingAdmin) {
        res.status(403).json({ message: 'Admin already exists' });
    } else {
        ADMINS.push(newAdmin);
        const token = generateJwt(newAdmin);
        res.status(201).json({ message: 'Admin created successfully', token });
    }
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.headers;
    const admin = ADMINS.find(x => x.username === username && x.password === password);
    if (admin) {
        const token = generateJwt(admin);
        res.json({ message: 'Logged in successfully', token });
    } else {
        res.status(403).json({ message: 'Invalid credentials' });
    }
});

app.post('/admin/courses', authenticateJwt, (req, res) => {
    const course = req.body;
    const admin = ADMINS.find(x => x.username === req.user.username);
    if (admin) {
        course.id = Date.now();
        COURSES.push(course);
        res.status(201).json({
            message: 'Course created successfully',
            courseId: course.id
        });
    } else {
        res.status(403).json({ message: 'Admin not found' });
    }
});

app.put('/admin/courses/:courseId', authenticateJwt, (req, res) => {
    const course = COURSES.find(x => x.id === parseInt(req.params.courseId));
    if (course) {
        Object.assign(course, req.body);
        res.json({ message: 'Course updated successfully' });
    } else {
        res.status(404).json({ message: 'Course not found' });
    }
});

app.get('/admin/courses', authenticateJwt, (req, res) => {
    res.json({ courses: COURSES });
});

app.post('/users/signup', (req, res) => {
    const user = { ...req.body, purchasedCoursesIds: [] };
    const existingUser = USERS.find(x => x.username === user.username);
    if (existingUser) {
        res.status(403).json({ message: 'User already exists' });
    } else {
        USERS.push(user);
        const token = generateJwt(user);
        res.status(201).json({ message: 'User created successfully', token });
    }
});

app.post('/users/login', (req, res) => {
    const { username, password } = req.headers;
    const user = USERS.find(x => x.username === username && x.password === password);
    if (user) {
        const token = generateJwt(user);
        res.json({ message: 'Logged in successfully', token });
    } else {
        res.status(403).json({ message: 'Invalid credentials' });
    }
});

app.get('/users/courses', authenticateJwt, (req, res) => {
    res.json({ courses: COURSES.filter(x => x.published) });
});

app.post('/users/courses/:courseId', authenticateJwt, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = COURSES.find(x => x.id === courseId && x.published);
    if (course) {
        const user = USERS.find(x => x.username === req.user.username);
        if (user) {
            user.purchasedCoursesIds.push(courseId);
            res.json({ message: 'Course purchased successfully' });
        } else {
            res.status(403).json({ message: 'User not found' })
        }
    } else {
        res.status(404).send({ message: 'Course not found' });
    }
});

app.get('/users/purchasedCourses', authenticateJwt, (req, res) => {
    const user = USERS.find(x => x.username === req.user.username);
    if (user) {
        const purchasedCourses = COURSES.filter(x => user.purchasedCoursesIds.includes(x.id));
        res.json({ purchasedCourses });
    } else {
        res.status(403).json({ message: 'User not found' })
    }
});

app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
});