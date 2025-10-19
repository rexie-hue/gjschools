const db = require('./db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Test database connection first
    const testResult = await db.testConnection();
    if (!testResult) {
      console.error('Database connection failed. Please check your DATABASE_URL in .env file');
      process.exit(1);
    }

    // Create sample users
    const users = [
      {
        email: 'admin@gjschools.com',
        password: 'admin123',
        name: 'School Administrator',
        role: 'admin',
        school: 'G & J Schools'
      },
      {
        email: 'accountant@gjschools.com',
        password: 'account123',
        name: 'Finance Manager',
        role: 'accountant',
        school: 'G & J Schools'
      },
      {
        email: 'teacher@gjschools.com',
        password: 'teacher123',
        name: 'Head Teacher',
        role: 'teacher',
        school: 'G & J Schools'
      }
    ];

    console.log('Creating user accounts...');
    for (const user of users) {
      const exists = await db.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (!exists.rows.length) {
        const hash = await bcrypt.hash(user.password, 10);
        const id = uuidv4();
        await db.query(
          'INSERT INTO users (id, name, email, password_hash, school, role) VALUES ($1,$2,$3,$4,$5,$6)',
          [id, user.name, user.email, hash, user.school, user.role]
        );
        console.log(`✓ Created ${user.role}: ${user.email} / ${user.password}`);
      } else {
        console.log(`- User ${user.email} already exists`);
      }
    }

    // Sample students data
    const sampleStudents = [
      {
        id: 'ST2025001',
        name: 'John Smith',
        email: 'john.smith@parent.com',
        phone: '+233-555-1234',
        dob: '2012-03-15',
        class: 'Grade 5A',
        parent_name: 'Robert Smith',
        parent_phone: '+233-555-1111',
        address: '123 Accra Main St, Accra',
        status: 'Active'
      },
      {
        id: 'ST2025002',
        name: 'Emma Johnson',
        email: 'emma.johnson@parent.com',
        phone: '+233-555-5678',
        dob: '2011-07-22',
        class: 'Grade 6B',
        parent_name: 'Sarah Johnson',
        parent_phone: '+233-555-2222',
        address: '456 Kumasi Road, Accra',
        status: 'Active'
      },
      {
        id: 'ST2025003',
        name: 'Michael Brown',
        email: 'michael.brown@parent.com',
        phone: '+233-555-9012',
        dob: '2010-11-08',
        class: 'Grade 7C',
        parent_name: 'James Brown',
        parent_phone: '+233-555-3333',
        address: '789 Tema Avenue, Accra',
        status: 'Active'
      },
      {
        id: 'ST2025004',
        name: 'Sophia Davis',
        email: 'sophia.davis@parent.com',
        phone: '+233-555-3456',
        dob: '2009-05-30',
        class: 'Grade 8A',
        parent_name: 'Thomas Davis',
        parent_phone: '+233-555-4444',
        address: '321 Cape Coast St, Accra',
        status: 'Active'
      },
      {
        id: 'ST2025005',
        name: 'William Wilson',
        email: 'william.wilson@parent.com',
        phone: '+233-555-7890',
        dob: '2008-09-12',
        class: 'Grade 9B',
        parent_name: 'Jennifer Wilson',
        parent_phone: '+233-555-5555',
        address: '654 Takoradi Lane, Accra',
        status: 'Active'
      },
      {
        id: 'ST2025006',
        name: 'Olivia Taylor',
        email: 'olivia.taylor@parent.com',
        phone: '+233-555-2468',
        dob: '2011-12-03',
        class: 'Grade 6A',
        parent_name: 'Mark Taylor',
        parent_phone: '+233-555-6666',
        address: '987 Ho Street, Accra',
        status: 'Active'
      },
      {
        id: 'ST2025007',
        name: 'James Anderson',
        email: 'james.anderson@parent.com',
        phone: '+233-555-1357',
        dob: '2012-01-20',
        class: 'Grade 5B',
        parent_name: 'Lisa Anderson',
        parent_phone: '+233-555-7777',
        address: '147 Bolgatanga Rd, Accra',
        status: 'Pending'
      }
    ];


    console.log('Creating student records...');
    for (const student of sampleStudents) {
      const exists = await db.query('SELECT id FROM students WHERE id = $1', [student.id]);
      if (!exists.rows.length) {
        await db.query(
          `INSERT INTO students (id, name, email, phone, dob, class, parent_name, parent_phone, address, status, created_at, updated_at) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now())`,
          [student.id, student.name, student.email, student.phone, student.dob, student.class, 
           student.parent_name, student.parent_phone, student.address, student.status]
        );
        console.log(`✓ Created student: ${student.name} (${student.id})`);
      } else {
        console.log(`- Student ${student.id} already exists`);
      }
    }
    // Add these sections to your seed.js file after the existing seed data

// Seed Class Allocations
console.log('Creating class allocations...');
const sampleAllocations = [
    { teacher_id: 'TCH2025001', class_name: 'Grade 7A', subject: 'Mathematics', academic_year: '2024/2025' },
    { teacher_id: 'TCH2025001', class_name: 'Grade 7B', subject: 'Mathematics', academic_year: '2024/2025' },
    { teacher_id: 'TCH2025002', class_name: 'Grade 8A', subject: 'English', academic_year: '2024/2025' },
    { teacher_id: 'TCH2025002', class_name: 'Grade 8B', subject: 'English', academic_year: '2024/2025' },
    { teacher_id: 'TCH2025003', class_name: 'Grade 7A', subject: 'Science', academic_year: '2024/2025' },
    { teacher_id: 'TCH2025003', class_name: 'Grade 9A', subject: 'Science', academic_year: '2024/2025' },
    { teacher_id: 'TCH2025004', class_name: 'Grade 9B', subject: 'Social Studies', academic_year: '2024/2025' }
];

for (const alloc of sampleAllocations) {
    try {
        const exists = await db.query(
            'SELECT id FROM class_allocations WHERE teacher_id = $1 AND class_name = $2 AND subject = $3',
            [alloc.teacher_id, alloc.class_name, alloc.subject]
        );
        
        if (exists.rows.length === 0) {
            await db.query(
                `INSERT INTO class_allocations (teacher_id, class_name, subject, academic_year)
                 VALUES ($1, $2, $3, $4)`,
                [alloc.teacher_id, alloc.class_name, alloc.subject, alloc.academic_year]
            );
            console.log(`✓ Allocated ${alloc.subject} to ${alloc.teacher_id} for ${alloc.class_name}`);
        } else {
            console.log(`- Allocation already exists: ${alloc.teacher_id} - ${alloc.class_name}`);
        }
    } catch (error) {
        console.error(`Error creating allocation for ${alloc.teacher_id}:`, error.message);
    }
}

// Seed Attendance Records (last 7 days)
console.log('Creating attendance records...');
const activeStudents = await db.query("SELECT id, class FROM students WHERE status = 'Active' LIMIT 10");

if (activeStudents.rows.length > 0) {
    const teacherUser = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['teacher']);
    const markedById = teacherUser.rows[0]?.id;
    
    if (markedById) {
        const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const attendanceDate = date.toISOString().split('T')[0];
            
            for (const student of activeStudents.rows) {
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const remarks = status === 'absent' ? 'Not present' : 
                               status === 'late' ? 'Arrived late' : null;
                
                try {
                    await db.query(
                        `INSERT INTO attendance (student_id, class, attendance_date, status, remarks, marked_by)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (student_id, attendance_date) DO NOTHING`,
                        [student.id, student.class, attendanceDate, status, remarks, markedById]
                    );
                } catch (error) {
                    // Ignore conflicts
                }
            }
            
            console.log(`✓ Created attendance for ${attendanceDate}`);
        }
    }
}

// Seed Announcements
console.log('Creating announcements...');
const sampleAnnouncements = [
    { title: 'School Reopening', content: 'School will reopen on February 1st, 2025. Please ensure all fees are paid.', author: 'School Administrator' },
    { title: 'Parent-Teacher Meeting', content: 'A parent-teacher meeting is scheduled for March 15th, 2025. All parents are encouraged to attend.', author: 'Head Teacher' },
    { title: 'Sports Day', content: 'Annual Sports Day will be held on April 20th, 2025. Students should prepare accordingly.', author: 'Sports Coordinator' }
];    

// Update summary counts
const allocationsCount = await db.query('SELECT COUNT(*) FROM class_allocations');
const attendanceCount = await db.query('SELECT COUNT(*) FROM attendance');
const announcementsCount = await db.query('SELECT COUNT(*) FROM announcements');
const subjectsCount = await db.query('SELECT COUNT(*) FROM subjects');
const classesCount = await db.query('SELECT COUNT(*) FROM classes');

console.log('\n=== ENHANCED DATABASE SEEDING COMPLETED ===');
console.log(`📊 Summary:`);
console.log(`   Users: ${usersCount.rows[0].count}`);
console.log(`   Students: ${studentsCount.rows[0].count}`);
console.log(`   Teachers: ${teachersCount.rows[0].count}`);
console.log(`   Fees: ${feesCount.rows[0].count}`);
console.log(`   Payments: ${paymentsCount.rows[0].count}`);
console.log(`   Grades: ${gradesCount.rows[0].count}`);
console.log(`   Class Allocations: ${allocationsCount.rows[0].count}`);
console.log(`   Attendance Records: ${attendanceCount.rows[0].count}`);
console.log(`   Announcements: ${announcementsCount.rows[0].count}`);
console.log(`   Subjects: ${subjectsCount.rows[0].count}`);
console.log(`   Classes: ${classesCount.rows[0].count}`);

console.log('\n📢 New Features Available:');
console.log('   ✓ Class & Subject Allocations');
console.log('   ✓ Daily Attendance Tracking');
console.log('   ✓ Announcements & Noticeboard');
console.log('   ✓ Enhanced Reporting');

console.log('\n🔐 Login Credentials:');
console.log('   Admin: admin@gjschools.com / admin123');
console.log('   Accountant: accountant@gjschools.com / account123');
console.log('   Teacher: teacher@gjschools.com / teacher123');

console.log('\n🚀 You can now start the server with: npm run dev');

    // Sample fees data
    const sampleFees = [
      {
        id: 'INV2025001',
        student_id: 'ST2025001',
        class: 'Grade 5A',
        amount: 450.00,
        due_date: '2025-02-15',
        status: 'paid'
      },
      {
        id: 'INV2025002',
        student_id: 'ST2025002',
        class: 'Grade 6B',
        amount: 450.00,
        due_date: '2025-02-15',
        status: 'paid'
      },
      {
        id: 'INV2025003',
        student_id: 'ST2025003',
        class: 'Grade 7C',
        amount: 500.00,
        due_date: '2025-02-15',
        status: 'pending'
      },
      {
        id: 'INV2025004',
        student_id: 'ST2025004',
        class: 'Grade 8A',
        amount: 500.00,
        due_date: '2025-01-15',
        status: 'overdue'
      },
      {
        id: 'INV2025005',
        student_id: 'ST2025005',
        class: 'Grade 9B',
        amount: 550.00,
        due_date: '2025-02-15',
        status: 'paid'
      },
      {
        id: 'INV2025006',
        student_id: 'ST2025006',
        class: 'Grade 6A',
        amount: 450.00,
        due_date: '2025-03-15',
        status: 'pending'
      },
      {
        id: 'INV2025007',
        student_id: 'ST2025007',
        class: 'Grade 5B',
        amount: 450.00,
        due_date: '2025-03-15',
        status: 'pending'
      }
    ];

    console.log('Creating fee records...');
    for (const fee of sampleFees) {
      const exists = await db.query('SELECT id FROM fees WHERE id = $1', [fee.id]);
      if (!exists.rows.length) {
        await db.query(
          'INSERT INTO fees (id, student_id, class, amount, due_date, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,now(),now())',
          [fee.id, fee.student_id, fee.class, fee.amount, fee.due_date, fee.status]
        );
        console.log(`✓ Created fee: ${fee.id} for ${fee.student_id} - GHS ${fee.amount}`);
      } else {
        console.log(`- Fee ${fee.id} already exists`);
      }
    }

    // Create sample payments for paid fees
    console.log('Creating payment records...');
    const adminUser = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const adminId = adminUser.rows[0]?.id;

    if (adminId) {
      const paidFees = sampleFees.filter(f => f.status === 'paid');
      for (const fee of paidFees) {
        const paymentExists = await db.query('SELECT id FROM payments WHERE fee_id = $1', [fee.id]);
        if (!paymentExists.rows.length) {
          const paymentId = uuidv4();
          const receiptNumber = '#RC' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
          
          await db.query(
            `INSERT INTO payments (id, fee_id, student_id, amount, method, payment_date, notes, receipt_number, issued_by, created_at) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`,
            [paymentId, fee.id, fee.student_id, fee.amount, 'Cash', '2025-01-15', 'Seed payment', receiptNumber, adminId]
          );
          console.log(`✓ Created payment: ${receiptNumber} for ${fee.id}`);
        }
      }
    }
    // Sample teachers data
    const sampleTeachers = [
      {
        id: 'TCH2025001',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@gjschools.com',
        phone: '+233-555-8001',
        subject: 'Mathematics',
        qualification: 'PhD in Mathematics',
        experience: 15,
        salary: 5000.00,
        status: 'Active'
      },
      {
        id: 'TCH2025002',
        name: 'Mr. David Wilson',
        email: 'david.wilson@gjschools.com',
        phone: '+233-555-8002',
        subject: 'English Literature',
        qualification: 'Masters in English',
        experience: 10,
        salary: 4200.00,
        status: 'Active'
      },
      {
        id: 'TCH2025003',
        name: 'Mrs. Linda Martinez',
        email: 'linda.martinez@gjschools.com',
        phone: '+233-555-8003',
        subject: 'Science',
        qualification: 'Masters in Biology',
        experience: 8,
        salary: 4000.00,
        status: 'Active'
      },
      {
        id: 'TCH2025004',
        name: 'Mr. James Thompson',
        email: 'james.thompson@gjschools.com',
        phone: '+233-555-8004',
        subject: 'History',
        qualification: 'Masters in History',
        experience: 12,
        salary: 4500.00,
        status: 'Active'
      }
    ];

    console.log('Creating teacher records...');
    for (const teacher of sampleTeachers) {
      const exists = await db.query('SELECT id FROM teachers WHERE id = $1', [teacher.id]);
      if (!exists.rows.length) {
        await db.query(
          `INSERT INTO teachers (id, name, email, phone, subject, qualification, experience, salary, status, created_at, updated_at) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
          [teacher.id, teacher.name, teacher.email, teacher.phone, teacher.subject, teacher.qualification, teacher.experience, teacher.salary, teacher.status]
        );
        console.log(`✓ Created teacher: ${teacher.name} (${teacher.subject})`);
      } else {
        console.log(`- Teacher ${teacher.id} already exists`);
      }
    }

    // Sample grades data
    const sampleGrades = [
      { student_id: 'ST2025001', subject: 'Mathematics', grade: 'A', term: 'Term 1', academic_year: '2024/2025', remarks: 'Excellent performance' },
      { student_id: 'ST2025001', subject: 'English', grade: 'B+', term: 'Term 1', academic_year: '2024/2025', remarks: 'Good work' },
      { student_id: 'ST2025002', subject: 'Mathematics', grade: 'B', term: 'Term 1', academic_year: '2024/2025', remarks: 'Needs improvement' },
      { student_id: 'ST2025002', subject: 'Science', grade: 'A', term: 'Term 1', academic_year: '2024/2025', remarks: 'Outstanding' },
      { student_id: 'ST2025003', subject: 'History', grade: 'B+', term: 'Term 1', academic_year: '2024/2025', remarks: 'Very good' }
    ];

    console.log('Creating grade records...');
    const teacherUser = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['teacher']);
    const teacherId = teacherUser.rows[0]?.id;

    if (teacherId) {
      for (const grade of sampleGrades) {
        const gradeId = uuidv4();
        await db.query(
          `INSERT INTO grades (id, student_id, subject, grade, term, academic_year, remarks, teacher_id, created_at, updated_at) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
          [gradeId, grade.student_id, grade.subject, grade.grade, grade.term, grade.academic_year, grade.remarks, teacherId]
        );
        console.log(`✓ Created grade: ${grade.student_id} - ${grade.subject} (${grade.grade})`);
      }
    }

    // Update summary to include teachers and grades
    const teachersCount = await db.query('SELECT COUNT(*) FROM teachers');
    const gradesCount = await db.query('SELECT COUNT(*) FROM grades');

    console.log('\n=== DATABASE SEEDING COMPLETED ===');
    console.log(`📊 Summary:`);
    console.log(`   Users: ${usersCount.rows[0].count}`);
    console.log(`   Students: ${studentsCount.rows[0].count}`);
    console.log(`   Teachers: ${teachersCount.rows[0].count}`);
    console.log(`   Fees: ${feesCount.rows[0].count}`);
    console.log(`   Payments: ${paymentsCount.rows[0].count}`);
    console.log(`   Grades: ${gradesCount.rows[0].count}`);

    // Display summary
    const studentsCount = await db.query('SELECT COUNT(*) FROM students');
    const feesCount = await db.query('SELECT COUNT(*) FROM fees');
    const paymentsCount = await db.query('SELECT COUNT(*) FROM payments');
    const usersCount = await db.query('SELECT COUNT(*) FROM users');

    console.log('\n=== DATABASE SEEDING COMPLETED ===');
    console.log(`📊 Summary:`);
    console.log(`   Users: ${usersCount.rows[0].count}`);
    console.log(`   Students: ${studentsCount.rows[0].count}`);
    console.log(`   Fees: ${feesCount.rows[0].count}`);
    console.log(`   Payments: ${paymentsCount.rows[0].count}`);

    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@gjschools.com / admin123');
    console.log('   Accountant: accountant@gjschools.com / account123');
    console.log('   Teacher: teacher@gjschools.com / teacher123');

    console.log('\n🚀 You can now start the server with: npm run dev');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Seeding interrupted');
  process.exit(1);
});

seed();