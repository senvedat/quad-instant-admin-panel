# Quad Instant Admin Panel

-- STILL UNDER DEVELOPMENT --

Instantly create professional admin panels for your PostgreSQL databases with built-in visual editor and custom SQL query capabilities. A completely self-hosted, no-code solution with zero telemetry.

## 💻 Screenshots

| Dashboard & Analytics | Database Connections |
|:---------------------:|:--------------------:|
| <img width="800" alt="Dashboard" src="https://github.com/user-attachments/assets/d2169176-0e7c-4667-882d-3d7af0d61197" /> | <img width="800" alt="Connections" src="https://github.com/user-attachments/assets/2ae53fb4-ca2d-410a-b164-1e43a054f092" /> |

| Table Browser & CRUD | SQL Query Interface |
|:--------------------:|:-----------------------:|
| <img width="800" alt="Table Browser" src="https://github.com/user-attachments/assets/aa88b289-d31b-4637-8dc9-e4071d689ea6" /> | <img width="800" alt="Advanced Features" src="https://github.com/user-attachments/assets/e63832bd-e96e-41b2-a654-e114907482db" /> |

| Advanced Table Features |
|:-------------------:|
| <img width="800" alt="SQL Query" src="https://github.com/user-attachments/assets/88e4d3bb-5518-481f-8441-1f4d6ae3b98e" /> |

## ✨ Features

- 🚀 **Instant Setup** - Get your admin panel running in minutes
- 🔒 **Self-Hosted** - Complete control over your data, no external dependencies
- 🛡️ **Zero Telemetry** - No data collection, completely private
- 🗄️ **Multiple Databases** - Connect to multiple PostgreSQL instances
- 📊 **Auto CRUD** - Automatically generated Create, Read, Update, Delete interfaces
- 💻 **SQL Query Interface** - Execute custom SQL queries with syntax highlighting
- 📈 **Dashboard & Analytics** - Visual charts and metrics
- 🎨 **Modern UI** - Built with Ant Design for a professional look
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Ant Design
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (separate admin DB + your application DBs)
- **Authentication**: JWT-based with bcrypt password hashing
- **Deployment**: Docker Compose for easy setup

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd quad-instant-admin-panel
```

### 2. Configure Your PostgreSQL Database

Edit the `.env` file with your PostgreSQL database details:

```env
ADMIN_DB_HOST=your-postgres-host
ADMIN_DB_PORT=5432
ADMIN_DB_NAME=quad_admin_panel
ADMIN_DB_USER=your-admin-user
ADMIN_DB_PASSWORD=your-admin-password
```

### 3. Create Admin Database

Create the admin database on your PostgreSQL server:

```bash
createdb -h your-host -U your-user quad_admin_panel
```

### 4. Start the Admin Panel

```bash
# Start the admin panel
docker-compose up -d

# View logs
docker-compose logs -f admin-panel
```

This will start:
- **Admin Panel Web Interface** on port `3000`
- **Automatic database initialization** on first run

### 5. Access the Admin Panel

Open your browser and go to: `http://localhost:3000`

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

### 6. Add Your Database Connection

1. Click "Add Connection" on the dashboard
2. Fill in your PostgreSQL database details:
   - **Name**: My Database
   - **Host**: localhost (or your DB host)
   - **Port**: 5432 (or your DB port)
   - **Database**: your_database_name
   - **Username**: your_username
   - **Password**: your_password
3. Click "Test" to verify the connection
4. Save the connection

## 🛠️ Local Development

### 1. Setup Your PostgreSQL Database

Make sure you have a PostgreSQL database running and create a database for the admin panel:

```sql
CREATE DATABASE quad_admin_panel;
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL settings:

```env
# Admin Panel Database Configuration (External PostgreSQL)
ADMIN_DB_HOST=your-postgres-host
ADMIN_DB_PORT=5432
ADMIN_DB_NAME=quad_admin_panel
ADMIN_DB_USER=your-admin-user
ADMIN_DB_PASSWORD=your-admin-password

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Environment
NODE_ENV=development
```

### 4. Initialize Admin Database

```bash
psql -h your-host -U your-user -d quad_admin_panel -f docker/init-admin-db.sql
```

### 5. Start Development Server

```bash
# Start the Next.js development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
quad-instant-admin-panel/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── connections/   # Database connection management
│   │   │   └── dashboard/     # Dashboard statistics
│   │   ├── dashboard/         # Admin panel pages
│   │   │   ├── connections/   # Database connections page
│   │   │   ├── tables/        # Table browser (to be implemented)
│   │   │   └── query/         # SQL query interface (to be implemented)
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page (redirects)
│   │   └── globals.css        # Global styles
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Authentication utilities
│   │   └── database.ts       # Database connection utilities
│   └── types/                 # TypeScript type definitions
│       └── index.ts          # Shared types
├── docker/                    # Database initialization scripts
│   ├── init-admin-db.sql     # Admin panel database schema
│   └── init-app-db.sql       # Sample application database
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Application container
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── next.config.js            # Next.js configuration
└── README.md                 # This file
```

## 🔧 Configuration

### Database Connections

The admin panel uses a separate PostgreSQL database to store:
- Admin user accounts
- Database connection configurations (encrypted passwords)
- Saved SQL queries
- Dashboard widget configurations

Your application databases remain completely separate and are accessed only when you explicitly connect to them through the admin panel.

### Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Database connection passwords are encrypted before storage
- JWT tokens expire after 24 hours
- No telemetry or external data transmission

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_DB_HOST` | Admin database host | `your-postgres-host` |
| `ADMIN_DB_PORT` | Admin database port | `5432` |
| `ADMIN_DB_NAME` | Admin database name | `quad_admin_panel` |
| `ADMIN_DB_USER` | Admin database username | `your-admin-user` |
| `ADMIN_DB_PASSWORD` | Admin database password | `your-admin-password` |
| `JWT_SECRET` | JWT signing secret | `change-this-in-production` |
| `NODE_ENV` | Application environment | `development` |

## 🚢 Production Deployment

### 1. Update Environment Variables

Create a production `.env.local` file with secure values:

```env
ADMIN_DB_HOST=your-production-db-host
ADMIN_DB_PORT=5432
ADMIN_DB_NAME=quad_admin_panel
ADMIN_DB_USER=admin_user
ADMIN_DB_PASSWORD=secure-random-password
JWT_SECRET=very-long-random-secret-key
NODE_ENV=production
```

### 2. Build and Deploy

```bash
# Build the application
docker-compose -f docker-compose.prod.yml build

# Start in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Security Recommendations

- Change default admin credentials immediately
- Use strong, unique passwords for all database connections
- Set up SSL/TLS for database connections
- Run behind a reverse proxy (nginx, Traefik) with HTTPS
- Regularly backup your admin panel database
- Keep the application updated

## 🎯 Roadmap

### Current Features (v1.0)
- ✅ Authentication system
- ✅ Database connection management
- ✅ Dashboard with statistics
- ✅ Docker deployment

### Coming Soon (v1.1)
- 🔄 Table browser with instant CRUD operations
- 🔄 SQL query interface with syntax highlighting
- 🔄 Data visualization and charts
- 🔄 Export/import functionality

### Future Features (v2.0)
- 📋 Custom dashboard widgets
- 🔍 Advanced search and filtering
- 👥 Multi-user support with roles
- 🔄 Real-time data updates
- 📊 Advanced analytics and reporting
- 🔌 Plugin system for extensions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/quad-instant-admin-panel/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error logs

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [Ant Design](https://ant.design/)
- Database connectivity via [node-postgres](https://node-postgres.com/)
- Authentication with [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

**Made with ❤️ for developers who need instant database admin panels**
