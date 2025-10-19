# EduManage Pro - School Management System

A comprehensive school management system built with Node.js, Express, PostgreSQL, and vanilla JavaScript. Perfect for managing students, fees, payments, and school operations.

![G & J Schools Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue)

## Features

### 🎓 Student Management
- Complete student information system
- Parent/guardian contact management
- Academic progress tracking
- Student profile management

### 💰 Financial Management
- Fee invoice generation
- Payment processing
- Receipt generation and printing
- Financial reporting and analytics

### 👥 Role-Based Access Control
- **Administrator**: Full system access
- **Accountant**: Financial management focus
- **Teacher**: Read-only student information

### 📊 Analytics & Reporting
- Real-time dashboard with charts
- Student enrollment trends
- Fee collection analytics
- Performance metrics

### 🔒 Security Features
- JWT-based authentication
- Role-based permissions
- Input validation and sanitization
- SQL injection protection

## Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 13+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd george
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PostgreSQL database**
```bash
# Create database
createdb edumanage

# Or using psql
psql -U postgres
CREATE DATABASE edumanage;
\q
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Initialize database schema**
```bash
psql -U your_username -d edumanage -f schema.sql
```

6. **Seed the database with sample data**
```bash
npm run seed
```

7. **Start the development server**
```bash
npm run dev
```

8. **Open in browser**
```
http://localhost:4000
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/edumanage

# JWT Secret (change in production)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Configuration
PORT=4000
NODE_ENV=development
```

## Default Login Credentials

After running the seed script, you can login with:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gjschools.com | admin123 |
| **Accountant** | accountant@gjschools.com | account123 |
| **Teacher** | teacher@gjschools.com | teacher123 |

## Project Structure

```
george/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Styling
│   └── script.js          # Frontend JavaScript
├── index.js               # Main server file
├── db.js                  # Database connection
├── validators.js          # Input validation schemas
├── schema.sql             # Database schema
├── seed.js                # Database seeding script
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user info

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `GET /api/students?q=search` - Search students

### Fees
- `GET /api/fees` - Get all fees
- `POST /api/fees` - Create new fee invoice
- `GET /api/fees?status=paid` - Filter fees by status

### Payments
- `POST /api/payments` - Record payment

## Database Schema

### Tables
- **users** - System users (admin, accountant, teacher)
- **students** - Student information and contacts
- **fees** - Fee invoices and billing
- **payments** - Payment records and receipts

### Key Relationships
- Students can have multiple fee invoices
- Fees can have multiple payments
- Payments are linked to users who recorded them

## Development

### Available Scripts

```bash
# Development server with auto-reload
npm run dev

# Production server
npm start

# Seed database with sample data
npm run seed

# Test database connection
npm run init-db
```

### Code Structure

#### Backend (Node.js/Express)
- **index.js**: Main server, routes, middleware
- **db.js**: PostgreSQL connection and utilities
- **validators.js**: Joi validation schemas
- **schema.sql**: Database table definitions

#### Frontend (Vanilla JavaScript)
- **index.html**: Single-page application structure
- **script.js**: Client-side logic, API calls, UI management
- **styles.css**: Responsive styling with CSS Grid/Flexbox

### Key Features Implementation

#### Authentication Flow
1. User submits login form
2. Server validates credentials with bcrypt
3. JWT token issued for valid users
4. Token included in API requests
5. Server validates token for protected routes

#### Role-Based Permissions
- **Admin**: Full access to all features
- **Accountant**: Student management + financial operations
- **Teacher**: Read-only access to student information

#### Payment Processing
1. Select unpaid fee invoice
2. Enter payment details
3. Server validates and records payment
4. Fee status updated to "paid"
5. Receipt generated automatically

## Deployment

### Production Environment Setup

1. **Environment Variables**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
JWT_SECRET=long_random_string_for_production
PORT=3000
```

2. **Database Setup**
```bash
# Run migrations
psql $DATABASE_URL -f schema.sql

# Seed initial data
npm run seed
```

3. **Start Production Server**
```bash
npm start
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### Heroku Deployment

1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Add PostgreSQL addon**
```bash
heroku addons:create heroku-postgresql:mini
```

3. **Set environment variables**
```bash
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

5. **Initialize database**
```bash
heroku pg:psql < schema.sql
```

## Security Considerations

### Production Security Checklist
- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] Input validation on all endpoints
- [ ] CORS configuration for production domains

### Data Protection
- Passwords hashed with bcrypt
- JWT tokens with expiration
- SQL injection prevention
- XSS protection via input sanitization

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify connection
psql -U username -d edumanage -c "SELECT 1;"

# Check environment variables
echo $DATABASE_URL
```

#### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

#### Permission Errors
```bash
# Ensure proper file permissions
chmod +x node_modules/.bin/*
```

### Logs and Debugging

Enable detailed logging:
```env
DEBUG=edumanage:*
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use meaningful commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@edumanage.com
- Documentation.

## Roadmap

### Upcoming Features
- [ ] Email notifications
- [ ] SMS integration
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Gradebook management
- [ ] Attendance tracking
- [ ] Inventory management
- [ ] Library system

### Version History
- **v1.0.0** - Initial release
- **v1.1.0** - Enhanced UI and bug fixes
- **v2.0.0** - Role-based permissions (Current)

---

**G & J Schools** - Simplifying school management, one student at a time.