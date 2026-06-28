require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


app.get('/api/departments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM departments;');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load departments. Please try again later.' });
    }
});


app.get('/api/instructors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM instructors;');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load instructors. Please try again later.' });
    }
});


app.post('/api/instructors', async (req, res) => {
    try {
        const { id, name, email, gender } = req.body;
        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO instructors (id, name, email, gender) VALUES ($1, $2, $3, $4) RETURNING *;',
                [id, name, email, gender]
            );
        } else {
            result = await pool.query(
                'INSERT INTO instructors (name, email, gender) VALUES ($1, $2, $3) RETURNING *;',
                [name, email, gender]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'This email is already registered. Please use a different email.' });
        } else {
            res.status(500).json({ error: 'Failed to save instructor. Please try again.' });
        }
    }
});


app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students;');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load students. Please try again later.' });
    }
});


app.post('/api/students', async (req, res) => {
    try {
        const { id, name, email, gender, date_of_birth } = req.body;
        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO students (id, name, email, gender, date_of_birth) VALUES ($1, $2, $3, $4, $5) RETURNING *;',
                [id, name, email, gender, date_of_birth]
            );
        } else {
            result = await pool.query(
                'INSERT INTO students (name, email, gender, date_of_birth) VALUES ($1, $2, $3, $4) RETURNING *;',
                [name, email, gender, date_of_birth]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'A student with this email already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to save student. Please try again.' });
        }
    }
});


app.get('/api/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses;');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load courses. Please try again later.' });
    }
});


app.post('/api/courses', async (req, res) => {
    try {
        const { id, course_name, description, credits } = req.body;
        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO courses (id, course_name, description, credits) VALUES ($1, $2, $3, $4) RETURNING *;',
                [id, course_name, description, credits]
            );
        } else {
            result = await pool.query(
                'INSERT INTO courses (course_name, description, credits) VALUES ($1, $2, $3) RETURNING *;',
                [course_name, description, credits]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'A course with this name already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to save course. Please try again.' });
        }
    }
});


app.get('/api/enrollments', async (req, res) => {
    try {
        const queryText = `
            SELECT e.id, e.student_id, e.course_id, s.name AS student_name, c.course_name, e.grade, e.enrollment_date 
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c ON e.course_id = c.id;
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load enrollments. Please try again later.' });
    }
});


app.post('/api/departments', async (req, res) => {
    try {
        const { id, department_name, building } = req.body;
        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO departments (id, department_name, building) VALUES ($1, $2, $3) RETURNING *;',
                [id, department_name, building]
            );
        } else {
            result = await pool.query(
                'INSERT INTO departments (department_name, building) VALUES ($1, $2) RETURNING *;',
                [department_name, building]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'This department already exists.' });
        } else {
            console.error("Department Save Error:", err);
            res.status(500).json({ error: `Database Error: ${err.message}` });
        }
    }
});


app.post('/api/enrollments', async (req, res) => {
    try {
        const { id, student_id, course_id, grade, enrollment_date } = req.body;
        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO enrollments (id, student_id, course_id, grade, enrollment_date) VALUES ($1, $2, $3, $4, $5) RETURNING *;',
                [id, student_id, course_id, grade, enrollment_date]
            );
        } else {
            result = await pool.query(
                'INSERT INTO enrollments (student_id, course_id, grade, enrollment_date) VALUES ($1, $2, $3, $4) RETURNING *;',
                [student_id, course_id, grade, enrollment_date]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'This student is already enrolled in this course.' });
        } else {
            res.status(500).json({ error: 'Failed to save enrollment. Please try again.' });
        }
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, gender, date_of_birth } = req.body;
        const result = await pool.query(
            'UPDATE students SET name = $1, email = $2, gender = $3, date_of_birth = $4 WHERE id = $5 RETURNING *;',
            [name, email, gender, date_of_birth, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update student. Please try again.' });
    }
});

app.put('/api/instructors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, gender } = req.body;
        const result = await pool.query(
            'UPDATE instructors SET name = $1, email = $2, gender = $3 WHERE id = $4 RETURNING *;',
            [name, email, gender, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update instructor. Please try again.' });
    }
});

app.put('/api/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name, building } = req.body;
        const result = await pool.query(
            'UPDATE departments SET department_name = $1, building = $2 WHERE id = $3 RETURNING *;',
            [department_name, building, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update department. Please try again.' });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { course_name, description, credits } = req.body;
        const result = await pool.query(
            'UPDATE courses SET course_name = $1, description = $2, credits = $3 WHERE id = $4 RETURNING *;',
            [course_name, description, credits, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update course. Please try again.' });
    }
});

app.put('/api/enrollments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, course_id, grade, enrollment_date } = req.body;
        const result = await pool.query(
            'UPDATE enrollments SET student_id = $1, course_id = $2, grade = $3, enrollment_date = $4 WHERE id = $5 RETURNING *;',
            [student_id, course_id, grade, enrollment_date, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update enrollment. Please try again.' });
    }
});


app.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM students WHERE id = $1;', [id]);
        res.json({ message: 'Student deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete student. Please try again.' });
    }
});

app.delete('/api/instructors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM instructors WHERE id = $1;', [id]);
        res.json({ message: 'Instructor deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete instructor. Please try again.' });
    }
});

app.delete('/api/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM departments WHERE id = $1;', [id]);
        res.json({ message: 'Department deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete department. Please try again.' });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM courses WHERE id = $1;', [id]);
        res.json({ message: 'Course deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete course. Please try again.' });
    }
});

app.delete('/api/enrollments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM enrollments WHERE id = $1;', [id]);
        res.json({ message: 'Enrollment deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete enrollment. Please try again.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});