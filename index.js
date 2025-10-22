const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const { registerSchema, loginSchema, studentSchema, feeSchema, paymentSchema } = require('./validators');

dotenv.config();

const app = express();
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me_in_production';

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await db.query(schema);
      console.log('Database tables initialized successfully');
    } else {
      console.warn('schema.sql file not found');
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).send(error.details.map(d => d.message).join('; '));
    
    const { name, email, password, school, role } = value;

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(400).send('Email already registered');

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, school, role) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, name, email, hash, school, role]
    );

    res.send('User registered successfully');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error during registration');
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details.map(d => d.message).join('; ') });
    
    const { email, password, role } = value;

    const result = await db.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid || (role && role !== user.role)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = now() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    return res.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ====================================
// REPLACE IN index.js around line 90
// ====================================

// Middleware: authenticate
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  
  // Log for debugging
  console.log('ðŸ” Auth attempt:', {
    hasAuth: !!auth,
    path: req.path,
    method: req.method
  });
  
  if (!auth) {
    console.log('âŒ No authorization header');
    return res.status(401).json({ message: 'Missing authorization header' });
  }
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('âŒ Invalid auth format:', auth.substring(0, 20));
    return res.status(401).json({ message: 'Invalid authorization format. Use: Bearer <token>' });
  }

  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    console.log('âœ… Auth successful for:', payload.email);
    next();
  } catch (err) {
    console.log('âŒ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
}

// Middleware: authorize roles
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    console.log('ðŸ”‘ Authorization check:', {
      user: req.user?.email,
      userRole: req.user?.role,
      allowedRoles,
      path: req.path
    });
    
    if (!req.user) {
      console.log('âŒ No user in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      console.log('âŒ Role not authorized:', req.user.role, 'not in', allowedRoles);
      return res.status(403).json({ 
        message: 'Access denied for your role',
        yourRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }
    
    console.log('âœ… Authorization successful');
    next();
  };
}

// Get current user info
app.get('/me', authenticate, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role });
});

// Students endpoints
app.get('/api/students', authenticate, authorize(['admin','accountant','teacher']), async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    let query = 'SELECT * FROM students';
    let params = [];
    
    if (searchQuery) {
      query += ' WHERE lower(name) LIKE $1 OR lower(id) LIKE $1 OR lower(email) LIKE $1';
      params.push(`%${searchQuery.toLowerCase()}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// MODIFIED: Auto-create fee when adding student
app.post('/api/students', authenticate, authorize(['admin','accountant']), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { error, value } = studentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join('; ') });
    
    const { id, name, email, phone, dob, class: klass, parent_name, parent_phone, address, status } = value;
    const studentId = id || 'ST' + Date.now().toString().slice(-8);
    
    await client.query('BEGIN');
    
    // Insert student
    await client.query(
      `INSERT INTO students (id, name, email, phone, dob, class, parent_name, parent_phone, address, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [studentId, name, email, phone, dob, klass, parent_name, parent_phone, address, status || 'Active']
    );
    
    // Automatically create a fee record for the new student
    // Fee amount based on grade level
    let feeAmount = 450.00; // Default fee
    if (klass) {
      if (klass.includes('Grade 7') || klass.includes('Grade 6')) {
        feeAmount = 1200.00;
      } else if (klass.includes('Grade 8') || klass.includes('Grade 8')) {
        feeAmount = 1500.00;
      } else if (klass.includes('Grade 9')) {
        feeAmount = 2000.00;
      }
    }
    
    const feeId = 'INV' + Date.now().toString().slice(-8);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1); // Due in 1 month
    
    await client.query(
      `INSERT INTO fees (id, student_id, class, amount, due_date, status, description, created_at, updated_at) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())`,
      [feeId, studentId, klass, feeAmount, dueDate.toISOString().split('T')[0], 'pending', 'Term Fee']
    );
    
    await client.query('COMMIT');
    
    const result = await client.query('SELECT * FROM students WHERE id = $1', [studentId]);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating student:', err);
    if (err.code === '23505') {
      res.status(400).json({ message: 'Student ID already exists' });
    } else {
      res.status(500).json({ message: 'Error creating student', error: err.message });
    }
  } finally {
    client.release();
  }
});

// MODIFIED: Fees endpoint with balance calculation
app.get('/api/fees', authenticate, authorize(['admin','accountant','teacher']), async (req, res) => {
  try {
    const status = req.query.status;
    let feesQuery = 'SELECT * FROM fees';
    const params = [];
    
    if (status) {
      feesQuery += ' WHERE status = $1';
      params.push(status);
    }
    
    feesQuery += ' ORDER BY due_date DESC';

    const feesResult = await db.query(feesQuery, params);
    const feesRows = feesResult.rows;

    if (!feesRows.length) return res.json([]);

    const studentIds = [...new Set(feesRows.map(f => f.student_id).filter(Boolean))];
    const feeIds = feesRows.map(f => f.id);

    const studentsMap = {};
    if (studentIds.length) {
      const studentsResult = await db.query(`SELECT * FROM students WHERE id = ANY($1::text[])`, [studentIds]);
      studentsResult.rows.forEach(s => { studentsMap[s.id] = s; });
    }

    const paymentsMap = {};
    if (feeIds.length) {
      const paymentsResult = await db.query(`SELECT * FROM payments WHERE fee_id = ANY($1::text[]) ORDER BY payment_date ASC`, [feeIds]);
      paymentsResult.rows.forEach(p => {
        paymentsMap[p.fee_id] = paymentsMap[p.fee_id] || [];
        paymentsMap[p.fee_id].push(p);
      });
    }

    const enrichedFees = feesRows.map(f => {
      const payments = paymentsMap[f.id] || [];
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const balance = parseFloat(f.amount) - totalPaid;
      
      return {
        id: f.id,
        student_id: f.student_id,
        student: studentsMap[f.student_id] || null,
        class: f.class,
        amount: parseFloat(f.amount),
        total_paid: totalPaid,
        balance: balance,
        due_date: f.due_date,
        status: f.status,
        description: f.description,
        created_at: f.created_at,
        updated_at: f.updated_at,
        payments: payments
      };
    });

    res.json(enrichedFees);
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ message: 'Error fetching fees', error: err.message });
  }
});

app.post('/api/fees', authenticate, authorize(['admin','accountant']), async (req, res) => {
  try {
    const { error, value } = feeSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join('; ') });
    
    const { id, student_id, class: klass, amount, due_date, status } = value;
    const feeId = id || 'INV' + Date.now().toString().slice(-8);
    
    await db.query(
      'INSERT INTO fees (id, student_id, class, amount, due_date, status) VALUES ($1,$2,$3,$4,$5,$6)', 
      [feeId, student_id, klass, amount, due_date, status || 'pending']
    );
    
    const result = await db.query('SELECT * FROM fees WHERE id = $1', [feeId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating fee:', err);
    res.status(500).json({ message: 'Error creating fee', error: err.message });
  }
});

// MODIFIED: Payments endpoint with partial payment support
app.post('/api/payments', authenticate, authorize(['admin','accountant']), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join('; ') });
    
    const { fee_id, amount, method, payment_date, notes } = value;

    await client.query('BEGIN');
    
    const paymentId = uuidv4();
    const issuedBy = req.user.id;
    const receiptNumber = '#RC' + Date.now().toString().slice(-8);

    const feeResult = await client.query('SELECT student_id, amount FROM fees WHERE id = $1 FOR UPDATE', [fee_id]);
    if (!feeResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }
    
    const studentId = feeResult.rows[0].student_id;
    const totalFeeAmount = parseFloat(feeResult.rows[0].amount);
    
    // Calculate total paid so far
    const paymentsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE fee_id = $1',
      [fee_id]
    );
    const totalPaid = parseFloat(paymentsResult.rows[0].total_paid);
    const newTotalPaid = totalPaid + parseFloat(amount);
    
    // Check if payment exceeds remaining balance
    if (newTotalPaid > totalFeeAmount) {
      await client.query('ROLLBACK');
      const balance = totalFeeAmount - totalPaid;
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount exceeds remaining balance. Balance: GHS ${balance.toFixed(2)}` 
      });
    }

    // Insert payment
    await client.query(
      'INSERT INTO payments (id, fee_id, student_id, amount, method, payment_date, notes, receipt_number, issued_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [paymentId, fee_id, studentId, amount, method, payment_date || new Date(), notes, receiptNumber, issuedBy]
    );

    // Update fee status based on payment
    let newStatus = 'pending';
    if (newTotalPaid >= totalFeeAmount) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partial';
    }
    
    await client.query(
      'UPDATE fees SET status = $1, updated_at = now() WHERE id = $2', 
      [newStatus, fee_id]
    );

    await client.query('COMMIT');
    
    const balance = totalFeeAmount - newTotalPaid;
    
    res.json({ 
      success: true, 
      paymentId, 
      receiptNumber,
      total_paid: newTotalPaid,
      balance: balance,
      status: newStatus
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payment error:', err);
    res.status(500).json({ success: false, message: 'Payment processing failed', error: err.message });
  } finally {
    client.release();
  }
});

// NEW: Get student's fee summary
app.get('/api/students/:id/fees', authenticate, authorize(['admin','accountant','teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const feesResult = await db.query(`
      SELECT 
        f.*,
        COALESCE(SUM(p.amount), 0) as total_paid,
        f.amount - COALESCE(SUM(p.amount), 0) as balance
      FROM fees f
      LEFT JOIN payments p ON f.id = p.fee_id
      WHERE f.student_id = $1
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `, [id]);
    
    res.json(feesResult.rows);
  } catch (err) {
    console.error('Error fetching student fees:', err);
    res.status(500).json({ message: 'Error fetching student fees', error: err.message });
  }
});

// Teachers endpoints
app.get('/api/teachers', authenticate, authorize(['admin','accountant','teacher']), async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    let query = 'SELECT * FROM teachers';
    let params = [];
    
    if (searchQuery) {
      query += ' WHERE lower(name) LIKE $1 OR lower(email) LIKE $1 OR lower(subject) LIKE $1';
      params.push(`%${searchQuery.toLowerCase()}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ message: 'Error fetching teachers', error: err.message });
  }
});

app.post('/api/teachers', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, email, phone, subject, qualification, experience, salary, status } = req.body;
    const teacherId = 'TCH' + Date.now().toString().slice(-8);
    
    await db.query(
      `INSERT INTO teachers (id, name, email, phone, subject, qualification, experience, salary, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [teacherId, name, email, phone, subject, qualification, experience, salary, status || 'Active']
    );
    
    const result = await db.query('SELECT * FROM teachers WHERE id = $1', [teacherId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating teacher:', err);
    res.status(500).json({ message: 'Error creating teacher', error: err.message });
  }
});

// Academic/Grades endpoints
app.get('/api/grades', authenticate, authorize(['admin','accountant','teacher']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT g.*, s.name as student_name, s.class 
      FROM grades g 
      LEFT JOIN students s ON g.student_id = s.id 
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching grades:', err);
    res.status(500).json({ message: 'Error fetching grades', error: err.message });
  }
});

app.post('/api/grades', authenticate, authorize(['admin','teacher']), async (req, res) => {
  try {
    const { student_id, subject, grade, term, academic_year, remarks } = req.body;
    const gradeId = uuidv4();
    
    await db.query(
      `INSERT INTO grades (id, student_id, subject, grade, term, academic_year, remarks, teacher_id) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [gradeId, student_id, subject, grade, term, academic_year, remarks, req.user.id]
    );
    
    const result = await db.query('SELECT * FROM grades WHERE id = $1', [gradeId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating grade:', err);
    res.status(500).json({ message: 'Error creating grade', error: err.message });
  }
});

// Reports endpoints
app.get('/api/reports/financial-summary', authenticate, authorize(['admin','accountant']), async (req, res) => {
  try {
    const summary = await db.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(f.id) as total_invoices,
        SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN f.status = 'pending' THEN f.amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN f.status = 'overdue' THEN f.amount ELSE 0 END) as total_overdue
      FROM students s
      LEFT JOIN fees f ON s.id = f.student_id
    `);
    res.json(summary.rows[0]);
  } catch (err) {
    console.error('Error generating financial report:', err);
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
});

app.get('/api/reports/student-performance', authenticate, authorize(['admin','teacher']), async (req, res) => {
  try {
    const performance = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.class,
        COUNT(g.id) as total_grades,
        AVG(CASE 
          WHEN g.grade = 'A' THEN 5
          WHEN g.grade = 'B' THEN 4
          WHEN g.grade = 'C' THEN 3
          WHEN g.grade = 'D' THEN 2
          ELSE 1
        END) as avg_performance
      FROM students s
      LEFT JOIN grades g ON s.id = g.student_id
      WHERE s.status = 'Active'
      GROUP BY s.id, s.name, s.class
      ORDER BY avg_performance DESC
    `);
    res.json(performance.rows);
  } catch (err) {
    console.error('Error generating performance report:', err);
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
});

// DELETE ROUTES
app.delete('/api/students/:id', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('BEGIN');
        
        await db.query('DELETE FROM payments WHERE student_id = $1', [id]);
        await db.query('DELETE FROM fees WHERE student_id = $1', [id]);
        await db.query('DELETE FROM grades WHERE student_id = $1', [id]);
        
        const result = await db.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Student not found' });
        }
        
        await db.query('COMMIT');
        
        res.json({ 
            success: true,
            message: 'Student deleted successfully', 
            student: result.rows[0] 
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

app.delete('/api/teachers/:id', authenticate, authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query('DELETE FROM teachers WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        
        res.json({ 
            success: true,
            message: 'Teacher deleted successfully', 
            teacher: result.rows[0] 
        });
    } catch (error) {
        console.error('Delete teacher error:', error);
        res.status(500).json({ error: 'Failed to delete teacher' });
    }
});

app.delete('/api/students', authenticate, authorize(['admin']), async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of student IDs' });
    }
    
    try {
        await db.query('BEGIN');
        
        await db.query('DELETE FROM payments WHERE student_id = ANY($1)', [ids]);
        await db.query('DELETE FROM fees WHERE student_id = ANY($1)', [ids]);
        await db.query('DELETE FROM grades WHERE student_id = ANY($1)', [ids]);
        
        const result = await db.query('DELETE FROM students WHERE id = ANY($1) RETURNING id', [ids]);
        
        await db.query('COMMIT');
        
        res.json({ 
            success: true,
            message: `${result.rows.length} student(s) deleted successfully`,
            deletedCount: result.rows.length
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Bulk delete students error:', error);
        res.status(500).json({ error: 'Failed to delete students' });
    }
});

app.delete('/api/teachers', authenticate, authorize(['admin']), async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of teacher IDs' });
    }
    
    try {
        const result = await db.query('DELETE FROM teachers WHERE id = ANY($1) RETURNING id', [ids]);
        
        res.json({ 
            success: true,
            message: `${result.rows.length} teacher(s) deleted successfully`,
            deletedCount: result.rows.length
        });
    } catch (error) {
        console.error('Bulk delete teachers error:', error);
        res.status(500).json({ error: 'Failed to delete teachers' });
    }
});
// Add these endpoints to your index.js file after the existing routes

// =====================================================
// CLASS ALLOCATIONS ENDPOINTS
// =====================================================

// Get all class allocations
app.get('/api/allocations', authenticate, authorize(['admin','teacher']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ca.*, t.name as teacher_name, t.subject as teacher_subject
      FROM class_allocations ca
      LEFT JOIN teachers t ON ca.teacher_id = t.id
      ORDER BY ca.class_name, ca.subject
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching allocations:', err);
    res.status(500).json({ message: 'Error fetching allocations', error: err.message });
  }
});

// Create class allocation
app.post('/api/allocations', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { teacher_id, class_name, subject, academic_year } = req.body;
    
    if (!teacher_id || !class_name || !subject) {
      return res.status(400).json({ message: 'Teacher, class, and subject are required' });
    }

    const result = await db.query(
      `INSERT INTO class_allocations (teacher_id, class_name, subject, academic_year) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [teacher_id, class_name, subject, academic_year || '2024/2025']
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating allocation:', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'This allocation already exists' });
    }
    res.status(500).json({ message: 'Error creating allocation', error: err.message });
  }
});

// Delete class allocation
app.delete('/api/allocations/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM class_allocations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    res.json({ success: true, message: 'Allocation deleted successfully' });
  } catch (err) {
    console.error('Error deleting allocation:', err);
    res.status(500).json({ message: 'Error deleting allocation', error: err.message });
  }
});

// =====================================================
// ATTENDANCE ENDPOINTS
// =====================================================

// Get attendance records
app.get('/api/attendance', authenticate, authorize(['admin','teacher','accountant']), async (req, res) => {
  try {
    const { date, class: className, student_id } = req.query;
    let query = `
      SELECT a.*, s.name as student_name, s.class as student_class, u.name as marked_by_name
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON a.marked_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (date) {
      params.push(date);
      query += ` AND a.attendance_date = $${params.length}`;
    }
    if (className) {
      params.push(className);
      query += ` AND a.class = $${params.length}`;
    }
    if (student_id) {
      params.push(student_id);
      query += ` AND a.student_id = $${params.length}`;
    }
    
    query += ' ORDER BY a.attendance_date DESC, s.name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Error fetching attendance', error: err.message });
  }
});

// Mark attendance (single or bulk)
app.post('/api/attendance', authenticate, authorize(['admin','teacher']), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { records } = req.body; // Array of {student_id, status, remarks, attendance_date, class}
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Please provide attendance records' });
    }

    await client.query('BEGIN');
    
    const insertedRecords = [];
    
    for (const record of records) {
      const { student_id, status, remarks, attendance_date, class: className } = record;
      
      // Upsert attendance (update if exists, insert if not)
      const result = await client.query(
        `INSERT INTO attendance (student_id, class, attendance_date, status, remarks, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, attendance_date)
         DO UPDATE SET status = $4, remarks = $5, marked_by = $6, updated_at = NOW()
         RETURNING *`,
        [student_id, className, attendance_date || new Date().toISOString().split('T')[0], 
         status, remarks, req.user.id]
      );
      
      insertedRecords.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: `Attendance marked for ${insertedRecords.length} student(s)`,
      records: insertedRecords
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: 'Error marking attendance', error: err.message });
  } finally {
    client.release();
  }
});

// Get attendance summary
app.get('/api/attendance/summary', authenticate, authorize(['admin','teacher','accountant']), async (req, res) => {
  try {
    const { student_id, class: className, start_date, end_date } = req.query;
    
    let query = `
      SELECT * FROM v_attendance_summary
      WHERE 1=1
    `;
    const params = [];
    
    if (student_id) {
      params.push(student_id);
      query += ` AND student_id = $${params.length}`;
    }
    if (className) {
      params.push(className);
      query += ` AND class = $${params.length}`;
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance summary:', err);
    res.status(500).json({ message: 'Error fetching summary', error: err.message });
  }
});

// =====================================================
// ANNOUNCEMENTS ENDPOINTS
// =====================================================

// Get all active announcements
app.get('/api/announcements', authenticate, async (req, res) => {
  try {
    const { category, active_only } = req.query;
    
    let query = `
      SELECT a.*, u.name as published_by_name
      FROM announcements a
      LEFT JOIN users u ON a.published_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (active_only === 'true') {
      query += ` AND a.is_active = true`;
      query += ` AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND a.category = $${params.length}`;
    }
    
    query += ' ORDER BY a.priority DESC, a.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: 'Error fetching announcements', error: err.message });
  }
});

// Create announcement
app.post('/api/announcements', authenticate, authorize(['admin','teacher']), async (req, res) => {
  try {
    const { title, content, category, target_audience, priority, start_date, end_date } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const result = await db.query(
      `INSERT INTO announcements (title, content, category, target_audience, priority, start_date, end_date, published_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, content, category || 'general', target_audience || 'all', 
       priority || 'normal', start_date || new Date().toISOString().split('T')[0], 
       end_date, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ message: 'Error creating announcement', error: err.message });
  }
});

// Update announcement
app.put('/api/announcements/:id', authenticate, authorize(['admin','teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, target_audience, priority, start_date, end_date, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE announcements 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           target_audience = COALESCE($4, target_audience),
           priority = COALESCE($5, priority),
           start_date = COALESCE($6, start_date),
           end_date = $7,
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, content, category, target_audience, priority, start_date, end_date, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ message: 'Error updating announcement', error: err.message });
  }
});

// Delete announcement
app.delete('/api/announcements/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ message: 'Error deleting announcement', error: err.message });
  }
});

// =====================================================
// SUBJECTS & CLASSES ENDPOINTS
// =====================================================

// Get all subjects
app.get('/api/subjects', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM subjects WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: 'Error fetching subjects', error: err.message });
  }
});

// Create subject
app.post('/api/subjects', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    const result = await db.query(
      'INSERT INTO subjects (name, code, description) VALUES ($1, $2, $3) RETURNING *',
      [name, code, description]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating subject:', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Subject already exists' });
    }
    res.status(500).json({ message: 'Error creating subject', error: err.message });
  }
});

// Get all classes
app.get('/api/classes', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, t.name as class_teacher_name,
             (SELECT COUNT(*) FROM students s WHERE s.class = c.name AND s.status = 'Active') as student_count
      FROM classes c
      LEFT JOIN teachers t ON c.class_teacher_id = t.id
      WHERE c.is_active = true
      ORDER BY c.grade_level, c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ message: 'Error fetching classes', error: err.message });
  }
});

// Create class
app.post('/api/classes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, grade_level, class_teacher_id, capacity, academic_year } = req.body;
    
    if (!name || !grade_level) {
      return res.status(400).json({ message: 'Name and grade level are required' });
    }

    const result = await db.query(
      `INSERT INTO classes (name, grade_level, class_teacher_id, capacity, academic_year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, grade_level, class_teacher_id, capacity || 30, academic_year || '2024/2025']
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating class:', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Class already exists' });
    }
    res.status(500).json({ message: 'Error creating class', error: err.message });
  }
});

// Get teacher workload
app.get('/api/teachers/workload', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM v_teacher_workload ORDER BY teacher_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teacher workload:', err);
    res.status(500).json({ message: 'Error fetching workload', error: err.message });
  }
});

// =====================================================
// ENHANCED REPORTS
// =====================================================

// Attendance report
app.get('/api/reports/attendance', authenticate, authorize(['admin','teacher']), async (req, res) => {
  try {
    const { class: className, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.name,
        s.class,
        COUNT(a.id) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
              NULLIF(COUNT(a.id), 0)::numeric * 100, 2) as attendance_percentage
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.status = 'Active'
    `;
    const params = [];
    
    if (className) {
      params.push(className);
      query += ` AND s.class = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      query += ` AND a.attendance_date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND a.attendance_date <= $${params.length}`;
    }
    
    query += ' GROUP BY s.id, s.name, s.class ORDER BY s.name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error generating attendance report:', err);
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
});

// Serve the main HTML file for all unmatched routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`G & J Schools server running on port ${PORT}`);
      console.log(`Frontend available at: http://localhost:${PORT}`);
      console.log(`API endpoints available at: http://localhost:${PORT}/api/`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();