import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminPool } from './database';
import { AdminUser, LoginCredentials, AuthResponse } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: Omit<AdminUser, 'password_hash'>): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Login user
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const pool = getAdminPool();
  
  try {
    const query = 'SELECT * FROM admin_users WHERE username = $1 AND is_active = true';
    const result = await pool.query(query, [credentials.username]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    const user = result.rows[0] as AdminUser;
    const isValidPassword = await verifyPassword(credentials.password, user.password_hash!);
    
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    const token = generateToken(userWithoutPassword);
    
    return {
      success: true,
      token,
      user: userWithoutPassword,
      message: 'Login successful'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login'
    };
  }
}

// Get user by ID
export async function getUserById(id: number): Promise<AdminUser | null> {
  const pool = getAdminPool();
  
  try {
    const query = 'SELECT * FROM admin_users WHERE id = $1 AND is_active = true';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as AdminUser;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Create new admin user
export async function createAdminUser(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: Omit<AdminUser, 'password_hash'> }> {
  const pool = getAdminPool();
  
  try {
    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM admin_users WHERE username = $1 OR email = $2';
    const existingUser = await pool.query(existingUserQuery, [username, email]);
    
    if (existingUser.rows.length > 0) {
      return {
        success: false,
        message: 'Username or email already exists'
      };
    }
    
    const hashedPassword = await hashPassword(password);
    
    const insertQuery = `
      INSERT INTO admin_users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, is_active, created_at, updated_at
    `;
    
    const result = await pool.query(insertQuery, [username, email, hashedPassword]);
    const newUser = result.rows[0];
    
    return {
      success: true,
      message: 'User created successfully',
      user: newUser
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      message: 'An error occurred while creating the user'
    };
  }
}

// Update user password
export async function updateUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const pool = getAdminPool();
  
  try {
    // Get current user
    const userQuery = 'SELECT password_hash FROM admin_users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    const user = userResult.rows[0];
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }
    
    const hashedNewPassword = await hashPassword(newPassword);
    
    const updateQuery = `
      UPDATE admin_users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await pool.query(updateQuery, [hashedNewPassword, userId]);
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      message: 'An error occurred while updating the password'
    };
  }
}