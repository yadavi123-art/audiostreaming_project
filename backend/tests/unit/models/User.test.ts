import { User } from '../../../src/models';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        role: 'student' as const,
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user._id).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'SecurePass123!';
      const user = await User.create({
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User',
        role: 'student',
      });

      // Need to select password explicitly as it's excluded by default
      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword?.password).not.toBe(plainPassword);
      expect(userWithPassword?.password.length).toBeGreaterThan(plainPassword.length);
    });

    it('should fail to create user without required fields', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          // Missing password and name
        })
      ).rejects.toThrow();
    });

    it('should fail to create user with invalid email', async () => {
      await expect(
        User.create({
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
          role: 'student',
        })
      ).rejects.toThrow();
    });

    it('should fail to create duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student' as const,
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should set default role to student', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });

      expect(user.role).toBe('student');
    });

    it('should set default isActive to true', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });

      expect(user.isActive).toBe(true);
    });

    it('should set default isEmailVerified to false', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });

      expect(user.isEmailVerified).toBe(false);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const plainPassword = 'SecurePass123!';
      const user = await User.create({
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User',
        role: 'student',
      });

      // Need to get user with password
      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword!.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword!.comparePassword('WrongPassword123!');
      expect(isMatch).toBe(false);
    });
  });

  describe('User Roles', () => {
    it('should accept valid roles', async () => {
      const roles: Array<'student' | 'teacher' | 'admin'> = ['student', 'teacher', 'admin'];

      for (const role of roles) {
        const user = await User.create({
          email: `${role}@example.com`,
          password: 'SecurePass123!',
          name: 'Test User',
          role,
        });

        expect(user.role).toBe(role);
      }
    });

    it('should reject invalid role', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          role: 'invalid_role' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('User Updates', () => {
    it('should update user fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      user.name = 'Updated Name';
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.name).toBe('Updated Name');
    });

    it('should rehash password on update', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const originalHash = userWithPassword!.password;
      
      userWithPassword!.password = 'NewSecurePass123!';
      await userWithPassword!.save();

      const updatedUserWithPassword = await User.findById(user._id).select('+password');
      expect(updatedUserWithPassword!.password).not.toBe(originalHash);
      expect(updatedUserWithPassword!.password).not.toBe('NewSecurePass123!');
    });

    it('should update lastLogin timestamp', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      const loginTime = new Date();
      user.lastLogin = loginTime;
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.lastLogin).toBeDefined();
    });
  });

  describe('User Deletion', () => {
    it('should delete user', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      await User.create([
        {
          email: 'student1@example.com',
          password: 'Pass123!',
          name: 'Student One',
          role: 'student',
        },
        {
          email: 'student2@example.com',
          password: 'Pass123!',
          name: 'Student Two',
          role: 'student',
        },
        {
          email: 'teacher@example.com',
          password: 'Pass123!',
          name: 'Teacher One',
          role: 'teacher',
        },
      ]);
    });

    it('should find user by email', async () => {
      const user = await User.findOne({ email: 'student1@example.com' });
      expect(user).toBeDefined();
      expect(user?.email).toBe('student1@example.com');
    });

    it('should find users by role', async () => {
      const students = await User.find({ role: 'student' });
      expect(students).toHaveLength(2);
    });

    it('should count users', async () => {
      const count = await User.countDocuments();
      expect(count).toBe(3);
    });

    it('should find active users', async () => {
      const activeUsers = await User.find({ isActive: true });
      expect(activeUsers.length).toBeGreaterThan(0);
    });
  });

  describe('Static Methods', () => {
    it('should find user by email with password using static method', async () => {
      await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      const user = await (User as any).findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBeDefined(); // Password should be included
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude password from JSON output', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.email).toBe('test@example.com');
    });

    it('should exclude __v from JSON output', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'student',
      });

      const userJSON = user.toJSON();
      expect(userJSON.__v).toBeUndefined();
    });
  });
});
