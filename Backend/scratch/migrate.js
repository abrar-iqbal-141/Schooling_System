require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query('BEGIN');
        
        // Find constraints
        const res = await pool.query(`
            SELECT tc.constraint_name, tc.table_name
            FROM information_schema.table_constraints AS tc
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'enrollments';
        `);
        
        for (const row of res.rows) {
            await pool.query(`ALTER TABLE ${row.table_name} DROP CONSTRAINT ${row.constraint_name}`);
        }

        // Alter primary keys
        await pool.query(`ALTER TABLE students ALTER COLUMN id TYPE VARCHAR(50)`);
        await pool.query(`ALTER TABLE courses ALTER COLUMN id TYPE VARCHAR(50)`);
        await pool.query(`ALTER TABLE instructors ALTER COLUMN id TYPE VARCHAR(50)`);
        await pool.query(`ALTER TABLE departments ALTER COLUMN id TYPE VARCHAR(50)`);
        await pool.query(`ALTER TABLE enrollments ALTER COLUMN id TYPE VARCHAR(50)`);

        // Alter foreign keys
        await pool.query(`ALTER TABLE enrollments ALTER COLUMN student_id TYPE VARCHAR(50)`);
        await pool.query(`ALTER TABLE enrollments ALTER COLUMN course_id TYPE VARCHAR(50)`);

        // Re-add constraints
        await pool.query(`ALTER TABLE enrollments ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id)`);
        await pool.query(`ALTER TABLE enrollments ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(id)`);

        await pool.query('COMMIT');
        console.log('Database schema successfully migrated to VARCHAR(50) for IDs.');
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}
run();
