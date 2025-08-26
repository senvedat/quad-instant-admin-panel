# Quick Start Guide

Get your Quad Instant Admin Panel running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (external, not in Docker)
- Node.js 18+ (optional, for local development)

## 🚀 Quick Setup

### 1. Configure Your Database

Edit `.env` file:
```env
ADMIN_DB_HOST=your-postgres-host
ADMIN_DB_PORT=5432
ADMIN_DB_NAME=quad_admin_panel
ADMIN_DB_USER=your-admin-user
ADMIN_DB_PASSWORD=your-admin-password
```

### 2. Create Admin Database

```bash
# Create database (tables will be created automatically)
createdb -h your-host -U your-user quad_admin_panel
```

### 3. Start Admin Panel

```bash
./setup.sh
```

The setup script will:
- Install dependencies
- Launch the admin panel
- Automatically initialize database tables
- Show you the access URLs

## 🌐 Access Your Admin Panel

Once setup is complete, open: **http://localhost:3000**

**Default Login:**
- Username: `admin`
- Password: `admin123`

## 📊 What's Included

### External Database Support
The admin panel connects to your existing PostgreSQL databases:
- Separate admin database for panel configuration
- Automatic table creation on first run
- Connect to multiple application databases
- No data mixing between admin and application data

### Admin Panel Features
- ✅ Database connection management
- ✅ Table browser with instant CRUD
- ✅ SQL query interface
- ✅ Dashboard with statistics
- ✅ Modern responsive UI

## 🔧 Quick Actions

### Add Your Database
1. Click "Add Connection" on the dashboard
2. Enter your PostgreSQL details:
   - **Host**: your-db-host
   - **Port**: 5432
   - **Database**: your_database
   - **Username**: your_username
   - **Password**: your_password
3. Test the connection
4. Save and start browsing!

### Browse Your Data
1. Add your database connection
2. Go to "Tables" in the sidebar
3. Choose any table from your database
4. View, edit, add, or delete records instantly

### Run SQL Queries
1. Go to "SQL Query" in the sidebar
2. Select your database connection
3. Write your SQL query
4. Click "Execute Query"
5. View results in a formatted table

## 🐳 Docker Commands

```bash
# Start admin panel
docker-compose up -d

# Stop admin panel
docker-compose down

# View logs
docker-compose logs -f admin-panel

# Restart admin panel
docker-compose restart
```

## 🔒 Security Notes

- Change default admin password immediately
- Use strong passwords for database connections
- The admin panel database is separate from your application data
- No telemetry or external data transmission
- Admin database stores only panel configuration, not your application data

## 🆘 Troubleshooting

### Port Already in Use
If port 3000 is busy, edit `docker-compose.yml`:
```yaml
admin-panel:
  ports:
    - "3001:3000"  # Change to available port
```

### Database Connection Issues
1. Check your PostgreSQL database is running
2. Verify connection details in `.env`
3. Ensure PostgreSQL accepts connections from Docker
4. Check firewall settings
5. Test connection: `psql -h your-host -U your-user -d quad_admin_panel`

### Admin Database Setup Issues
1. Make sure the database exists: `createdb quad_admin_panel`
2. Check database permissions for creating tables
3. The admin panel will automatically create tables on first run
4. Check the initialization status at http://localhost:3000

### Can't Access Admin Panel
1. Verify Docker container is running: `docker-compose ps`
2. Check logs: `docker-compose logs admin-panel`
3. Try restarting: `docker-compose restart`
4. Check if database connection is working

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the table browser with your own data
- Create custom SQL queries and save them
- Set up additional database connections

## 🤝 Need Help?

- Check the logs: `docker-compose logs`
- Review the README.md for detailed setup
- Open an issue on GitHub

---

**Happy data managing! 🎉**