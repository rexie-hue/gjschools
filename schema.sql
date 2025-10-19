-- PostgreSQL schema for EduManage Pro School Management System
-- Created: 2025
-- Description: Complete database schema with proper constraints, indexes, and triggers

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
-- Uncomment the following lines if you want to recreate tables
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS fees CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
  school TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('admin','accountant','teacher')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
-- Add to existing schema.sql - Enhanced features

-- Class Allocations table - Links teachers to classes and subjects
CREATE TABLE IF NOT EXISTS class_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL CHECK (length(trim(class_name)) > 0),
  subject TEXT NOT NULL CHECK (length(trim(subject)) > 0),
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, class_name, subject, academic_year)
);

-- Attendance table - Track daily student attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  class TEXT NOT NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  remarks TEXT,
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, attendance_date)
);

-- Announcements table - System-wide notices
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  category TEXT CHECK (category IN ('general', 'academic', 'event', 'urgent', 'holiday')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'parents')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table - Master list of subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  code TEXT UNIQUE CHECK (length(trim(code)) > 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table - Master list of classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  grade_level INTEGER CHECK (grade_level > 0 AND grade_level <= 12),
  class_teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 30,
  academic_year TEXT DEFAULT '2024/2025',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_allocations_teacher ON class_allocations (teacher_id);
CREATE INDEX IF NOT EXISTS idx_allocations_class ON class_allocations (class_name);
CREATE INDEX IF NOT EXISTS idx_allocations_year ON class_allocations (academic_year);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance (status);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance (class);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements (start_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements (priority);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements (category);

CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes (class_teacher_id);

-- Triggers for timestamp updates
DROP TRIGGER IF EXISTS update_allocations_updated_at ON class_allocations;
CREATE TRIGGER update_allocations_updated_at 
    BEFORE UPDATE ON class_allocations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at 
    BEFORE UPDATE ON attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON announcements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects
INSERT INTO subjects (name, code, description, is_active) VALUES
  ('Mathematics', 'MATH', 'Core Mathematics', true),
  ('English Language', 'ENG', 'English Language and Literature', true),
  ('Science', 'SCI', 'General Science', true),
  ('Social Studies', 'SS', 'Social Studies', true),
  ('ICT', 'ICT', 'Information and Communication Technology', true),
  ('Physical Education', 'PE', 'Physical Education and Sports', true),
  ('Creative Arts', 'CA', 'Creative Arts and Design', true),
  ('French', 'FR', 'French Language', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default classes
INSERT INTO classes (name, grade_level, capacity, academic_year) VALUES
  ('Grade 7A', 7, 30, '2024/2025'),
  ('Grade 7B', 7, 30, '2024/2025'),
  ('Grade 8A', 8, 30, '2024/2025'),
  ('Grade 8B', 8, 30, '2024/2025'),
  ('Grade 9A', 9, 30, '2024/2025'),
  ('Grade 9B', 9, 30, '2024/2025')
ON CONFLICT (name) DO NOTHING;

-- Views for reporting
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.class,
    COUNT(*) as total_days,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
    ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.id = a.student_id
WHERE a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.id, s.name, s.class;

CREATE OR REPLACE VIEW v_teacher_workload AS
SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.subject as primary_subject,
    COUNT(DISTINCT ca.class_name) as classes_assigned,
    COUNT(DISTINCT ca.subject) as subjects_teaching,
    ARRAY_AGG(DISTINCT ca.class_name) as class_list
FROM teachers t
LEFT JOIN class_allocations ca ON t.id = ca.teacher_id
GROUP BY t.id, t.name, t.subject;

-- Comments
COMMENT ON TABLE class_allocations IS 'Teacher assignments to classes and subjects';
COMMENT ON TABLE attendance IS 'Daily student attendance records';
COMMENT ON TABLE announcements IS 'School-wide announcements and notices';
COMMENT ON TABLE subjects IS 'Master list of subjects offered';
COMMENT ON TABLE classes IS 'Master list of classes/grades';

DO $$
BEGIN
    RAISE NOTICE 'Enhanced features schema created successfully!';
    RAISE NOTICE 'New Tables: class_allocations, attendance, announcements, subjects, classes';
    RAISE NOTICE 'New Views: v_attendance_summary, v_teacher_workload';
END $$;

-- Students table for student information management
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR length(trim(phone)) > 0),
  dob DATE CHECK (dob IS NULL OR dob <= CURRENT_DATE),
  class TEXT CHECK (class IS NULL OR length(trim(class)) > 0),
  parent_name TEXT CHECK (parent_name IS NULL OR length(trim(parent_name)) > 0),
  parent_phone TEXT CHECK (parent_phone IS NULL OR length(trim(parent_phone)) > 0),
  address TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fees table for financial management (invoices)
CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  class TEXT CHECK (class IS NULL OR length(trim(class)) > 0),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE CHECK (due_date IS NULL OR due_date >= '2020-01-01'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table for tracking fee payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id TEXT NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method TEXT CHECK (method IS NULL OR length(trim(method)) > 0),
  payment_date TIMESTAMPTZ DEFAULT NOW() CHECK (payment_date <= NOW()),
  notes TEXT,
  receipt_number TEXT UNIQUE CHECK (receipt_number IS NULL OR length(trim(receipt_number)) > 0),
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR length(trim(phone)) > 0),
  subject TEXT,
  qualification TEXT,
  experience INTEGER DEFAULT 0,
  salary NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F', 'A+', 'B+', 'C+', 'D+')),
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  remarks TEXT,
  teacher_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers (lower(name));
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers (subject);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades (student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades (subject);

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at 
    BEFORE UPDATE ON teachers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at 
    BEFORE UPDATE ON grades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_students_name ON students (lower(name));
CREATE INDEX IF NOT EXISTS idx_students_email ON students (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_class ON students (class) WHERE class IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
CREATE INDEX IF NOT EXISTS idx_students_created ON students (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fees_student ON fees (student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees (status);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON fees (due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fees_amount ON fees (amount);
CREATE INDEX IF NOT EXISTS idx_fees_created ON fees (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_fee ON payments (fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments (payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments (receipt_number) WHERE receipt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_issued_by ON payments (issued_by);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fees_student_status ON fees (student_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_fee_date ON payments (fee_id, payment_date DESC);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables with updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fees_updated_at ON fees;
CREATE TRIGGER update_fees_updated_at 
    BEFORE UPDATE ON fees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update fee status based on due date
CREATE OR REPLACE FUNCTION update_overdue_fees()
RETURNS void AS $$
BEGIN
    UPDATE fees 
    SET status = 'overdue', updated_at = NOW()
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Views for common queries
CREATE OR REPLACE VIEW v_student_summary AS
SELECT 
    s.id,
    s.name,
    s.email,
    s.class,
    s.parent_name,
    s.parent_phone,
    s.status,
    COUNT(f.id) as total_fees,
    COALESCE(SUM(CASE WHEN f.status = 'paid' THEN f.amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN f.status = 'pending' THEN f.amount ELSE 0 END), 0) as pending_amount,
    COALESCE(SUM(CASE WHEN f.status = 'overdue' THEN f.amount ELSE 0 END), 0) as overdue_amount
FROM students s
LEFT JOIN fees f ON s.id = f.student_id
GROUP BY s.id, s.name, s.email, s.class, s.parent_name, s.parent_phone, s.status;

CREATE OR REPLACE VIEW v_payment_summary AS
SELECT 
    p.id,
    p.fee_id,
    p.amount,
    p.method,
    p.payment_date,
    p.receipt_number,
    s.name as student_name,
    s.class as student_class,
    u.name as issued_by_name,
    f.amount as fee_amount
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN users u ON p.issued_by = u.id
LEFT JOIN fees f ON p.fee_id = f.id
ORDER BY p.payment_date DESC;

-- Insert default admin user if not exists (for initial setup)
-- Password is 'admin123' (hashed with bcrypt)
INSERT INTO users (name, email, password_hash, school, role)
SELECT 
    'System Administrator',
    'admin@system.local',
    '$2b$10$rOzJmZi0J2qf1wGpB8nKaO1ZYBx9FQJmj5Vx7GfDxYzB3MnP2KqLe',
    'System',
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@system.local'
);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO edumanage_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO edumanage_user;

-- Comments for documentation
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE students IS 'Student information and contact details';
COMMENT ON TABLE fees IS 'Fee invoices and billing information';
COMMENT ON TABLE payments IS 'Payment records and receipts';

COMMENT ON COLUMN users.role IS 'User role: admin, accountant, or teacher';
COMMENT ON COLUMN students.status IS 'Student status: Active, Inactive, or Pending';
COMMENT ON COLUMN fees.status IS 'Fee status: paid, pending, or overdue';
COMMENT ON COLUMN payments.receipt_number IS 'Unique receipt identifier for payments';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'EduManage Pro database schema created successfully!';
    RAISE NOTICE 'Tables: users, students, fees, payments';
    RAISE NOTICE 'Views: v_student_summary, v_payment_summary';
    RAISE NOTICE 'Default admin user: admin@system.local / admin123';
END $$;
-- Update fees table to support 'partial' status for partial payments
DO $$ 
BEGIN
    -- Drop existing constraint
    ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_status_check;
    
    -- Add new constraint with 'partial' status
    ALTER TABLE fees ADD CONSTRAINT fees_status_check 
        CHECK (status IN ('paid', 'pending', 'overdue', 'partial'));
        
    RAISE NOTICE 'Fees table updated to support partial payments';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error updating fees table: %', SQLERRM;
END $$;