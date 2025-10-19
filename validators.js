const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim().required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 200 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(6).max(100).required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'any.required': 'Password is required'
    }),
  school: Joi.string().max(300).trim().allow('').default('')
    .messages({
      'string.max': 'School name cannot exceed 300 characters'
    }),
  role: Joi.string().valid('admin', 'accountant', 'teacher').required()
    .messages({
      'any.only': 'Role must be one of: admin, accountant, teacher',
      'any.required': 'Role is required'
    })
});

// User login validation
const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required'
    }),
  role: Joi.string().valid('admin', 'accountant', 'teacher').optional()
    .messages({
      'any.only': 'Role must be one of: admin, accountant, teacher'
    })
});

// Student validation
const studentSchema = Joi.object({
  id: Joi.string().max(50).trim().optional()
    .messages({
      'string.max': 'Student ID cannot exceed 50 characters'
    }),
  name: Joi.string().min(1).max(300).trim().required()
    .messages({
      'string.min': 'Student name is required',
      'string.max': 'Student name cannot exceed 300 characters',
      'any.required': 'Student name is required'
    }),
  email: Joi.string().email().lowercase().trim().allow('', null).optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  phone: Joi.string().max(20).trim().allow('', null).optional()
    .messages({
      'string.max': 'Phone number cannot exceed 20 characters'
    }),
  dob: Joi.date().iso().max('now').allow('', null).optional()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  class: Joi.string().max(100).trim().allow('', null).optional()
    .messages({
      'string.max': 'Class name cannot exceed 100 characters'
    }),
  parent_name: Joi.string().max(300).trim().allow('', null).optional()
    .messages({
      'string.max': 'Parent name cannot exceed 300 characters'
    }),
  parent_phone: Joi.string().max(20).trim().allow('', null).optional()
    .messages({
      'string.max': 'Parent phone cannot exceed 20 characters'
    }),
  address: Joi.string().max(500).trim().allow('', null).optional()
    .messages({
      'string.max': 'Address cannot exceed 500 characters'
    }),
  status: Joi.string().valid('Active', 'Inactive', 'Pending').default('Active')
    .messages({
      'any.only': 'Status must be one of: Active, Inactive, Pending'
    })
});

// Fee validation
const feeSchema = Joi.object({
  id: Joi.string().max(50).trim().optional()
    .messages({
      'string.max': 'Fee ID cannot exceed 50 characters'
    }),
  student_id: Joi.string().required()
    .messages({
      'any.required': 'Student ID is required'
    }),
  class: Joi.string().max(100).trim().allow('', null).optional()
    .messages({
      'string.max': 'Class name cannot exceed 100 characters'
    }),
  amount: Joi.number().precision(2).min(0).max(999999.99).required()
    .messages({
      'number.min': 'Amount cannot be negative',
      'number.max': 'Amount cannot exceed 999,999.99',
      'any.required': 'Amount is required'
    }),
  due_date: Joi.date().iso().optional()
    .messages({
      'date.base': 'Please provide a valid due date'
    }),
  status: Joi.string().valid('paid', 'pending', 'overdue').default('pending')
    .messages({
      'any.only': 'Status must be one of: paid, pending, overdue'
    })
});

// Payment validation
const paymentSchema = Joi.object({
  fee_id: Joi.string().required()
    .messages({
      'any.required': 'Fee ID is required'
    }),
  amount: Joi.number().precision(2).min(0.01).max(999999.99).required()
    .messages({
      'number.min': 'Payment amount must be at least 0.01',
      'number.max': 'Payment amount cannot exceed 999,999.99',
      'any.required': 'Payment amount is required'
    }),
  method: Joi.string().max(50).trim().allow('', null).optional()
    .messages({
      'string.max': 'Payment method cannot exceed 50 characters'
    }),
  payment_date: Joi.date().iso().max('now').optional()
    .messages({
      'date.max': 'Payment date cannot be in the future'
    }),
  notes: Joi.string().max(1000).trim().allow('', null).optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});
// Add these validators to your validators.js file

// Class allocation validation
const allocationSchema = Joi.object({
  teacher_id: Joi.string().required()
    .messages({
      'string.empty': 'Teacher ID is required',
      'any.required': 'Teacher ID is required'
    }),
  class_name: Joi.string().required()
    .messages({
      'string.empty': 'Class name is required',
      'any.required': 'Class name is required'
    }),
  subject: Joi.string().required()
    .messages({
      'string.empty': 'Subject is required',
      'any.required': 'Subject is required'
    }),
  academic_year: Joi.string().default('2024/2025')
    .pattern(/^\d{4}\/\d{4}$/)
    .messages({
      'string.pattern.base': 'Academic year must be in format YYYY/YYYY'
    })
});

// Attendance validation
const attendanceSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      student_id: Joi.string().required()
        .messages({
          'string.empty': 'Student ID is required',
          'any.required': 'Student ID is required'
        }),
      class: Joi.string().required()
        .messages({
          'string.empty': 'Class is required',
          'any.required': 'Class is required'
        }),
      attendance_date: Joi.date().iso().max('now').optional()
        .messages({
          'date.max': 'Attendance date cannot be in the future'
        }),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required()
        .messages({
          'any.only': 'Status must be one of: present, absent, late, excused',
          'any.required': 'Status is required'
        }),
      remarks: Joi.string().max(500).allow('', null).optional()
        .messages({
          'string.max': 'Remarks cannot exceed 500 characters'
        })
    })
  ).min(1).required()
    .messages({
      'array.min': 'At least one attendance record is required',
      'any.required': 'Attendance records are required'
    })
});

// Announcement validation
const announcementSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim().required()
    .messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  content: Joi.string().min(10).max(5000).trim().required()
    .messages({
      'string.min': 'Content must be at least 10 characters long',
      'string.max': 'Content cannot exceed 5000 characters',
      'any.required': 'Content is required'
    }),
  category: Joi.string().valid('general', 'academic', 'event', 'urgent', 'holiday').default('general')
    .messages({
      'any.only': 'Category must be one of: general, academic, event, urgent, holiday'
    }),
  target_audience: Joi.string().valid('all', 'students', 'teachers', 'parents').default('all')
    .messages({
      'any.only': 'Target audience must be one of: all, students, teachers, parents'
    }),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal')
    .messages({
      'any.only': 'Priority must be one of: low, normal, high, urgent'
    }),
  start_date: Joi.date().iso().optional()
    .messages({
      'date.base': 'Please provide a valid start date'
    }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).optional()
    .messages({
      'date.min': 'End date must be after start date'
    }),
  is_active: Joi.boolean().default(true).optional()
});

// Subject validation
const subjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required()
    .messages({
      'string.min': 'Subject name must be at least 2 characters long',
      'string.max': 'Subject name cannot exceed 100 characters',
      'any.required': 'Subject name is required'
    }),
  code: Joi.string().min(2).max(20).uppercase().trim().required()
    .messages({
      'string.min': 'Subject code must be at least 2 characters long',
      'string.max': 'Subject code cannot exceed 20 characters',
      'any.required': 'Subject code is required'
    }),
  description: Joi.string().max(500).allow('', null).optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  is_active: Joi.boolean().default(true).optional()
});

// Class validation
const classSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required()
    .messages({
      'string.min': 'Class name must be at least 2 characters long',
      'string.max': 'Class name cannot exceed 50 characters',
      'any.required': 'Class name is required'
    }),
  grade_level: Joi.number().integer().min(1).max(12).required()
    .messages({
      'number.min': 'Grade level must be between 1 and 12',
      'number.max': 'Grade level must be between 1 and 12',
      'any.required': 'Grade level is required'
    }),
  class_teacher_id: Joi.string().allow(null).optional()
    .messages({
      'string.empty': 'Invalid teacher ID'
    }),
  capacity: Joi.number().integer().min(1).max(100).default(30)
    .messages({
      'number.min': 'Capacity must be at least 1',
      'number.max': 'Capacity cannot exceed 100'
    }),
  academic_year: Joi.string().default('2024/2025')
    .pattern(/^\d{4}\/\d{4}$/)
    .messages({
      'string.pattern.base': 'Academic year must be in format YYYY/YYYY'
    }),
  is_active: Joi.boolean().default(true).optional()
});

// Teacher update validation
const teacherUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(300).trim().optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string().max(20).trim().allow('', null).optional(),
  subject: Joi.string().max(100).trim().allow('', null).optional(),
  qualification: Joi.string().max(200).trim().allow('', null).optional(),
  experience: Joi.number().integer().min(0).optional(),
  salary: Joi.number().precision(2).min(0).optional(),
  status: Joi.string().valid('Active', 'Inactive', 'On Leave').optional()
});

// Enhanced grade validation
const enhancedGradeSchema = Joi.object({
  student_id: Joi.string().required(),
  subject: Joi.string().required(),
  grade: Joi.string().valid('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F').required(),
  score: Joi.number().min(0).max(100).optional(),
  term: Joi.string().required(),
  academic_year: Joi.string().required(),
  remarks: Joi.string().max(1000).allow('', null).optional(),
  teacher_id: Joi.string().optional()
});

module.exports = { 

};

// Query parameter validation
const querySchema = Joi.object({
  q: Joi.string().max(100).trim().optional()
    .messages({
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  status: Joi.string().valid('paid', 'pending', 'overdue').optional()
    .messages({
      'any.only': 'Status must be one of: paid, pending, overdue'
    }),
  limit: Joi.number().integer().min(1).max(1000).default(100)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 1000'
    }),
  offset: Joi.number().integer().min(0).default(0)
    .messages({
      'number.min': 'Offset cannot be negative'
    })
});

module.exports = { 
  registerSchema, 
  loginSchema, 
  studentSchema, 
  feeSchema, 
  paymentSchema,
  querySchema,
  allocationSchema,
  attendanceSchema,
  announcementSchema,
  subjectSchema,
  classSchema,
  teacherUpdateSchema,
  enhancedGradeSchema
};