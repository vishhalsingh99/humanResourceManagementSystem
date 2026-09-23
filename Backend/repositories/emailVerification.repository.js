import { masterPool } from '../config/databases.js';

class EmailVerification {
  // Create email verification record
  static async create(userId, email, verificationType, otp) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      const [result] = await masterPool.execute(
        `INSERT INTO email_verifications 
          (user_id, email, verification_type, otp, otp_expires_at, attempts, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          otp = VALUES(otp), 
          otp_expires_at = VALUES(otp_expires_at), 
          is_verified = FALSE, 
          verified_at = NULL,
          attempts = 0,
          updated_at = NOW()`,
        [userId, email, verificationType, otp, expiresAt]
      );
      
      return { success: true, id: result.insertId };
    } catch (error) {
      throw new Error('Failed to create email verification: ' + error.message);
    }
  }

  // Get pending verification by email and type
  static async getPending(email, verificationType) {
    try {
      const [rows] = await masterPool.execute(
        `SELECT * FROM email_verifications 
        WHERE email = ? AND verification_type = ? AND is_verified = FALSE 
        ORDER BY created_at DESC LIMIT 1`,
        [email, verificationType]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch email verification: ' + error.message);
    }
  }

  // Get by ID
  static async findById(id) {
    try {
      const [rows] = await masterPool.execute(
        `SELECT * FROM email_verifications WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch email verification: ' + error.message);
    }
  }

  // Verify OTP
  static async verifyOTP(email, verificationType, otp) {
    try {
      const record = await this.getPending(email, verificationType);

      if (!record) {
        return { 
          valid: false, 
          message: 'No verification request found for this email' 
        };
      }

      if (new Date() > new Date(record.otp_expires_at)) {
        return { 
          valid: false, 
          message: 'OTP has expired. Please request a new one.' 
        };
      }

      if (record.attempts >= 5) {
        return { 
          valid: false, 
          message: 'Maximum OTP attempts exceeded. Please request a new OTP.' 
        };
      }

      if (record.otp !== otp) {
        // Increment attempts
        await masterPool.execute(
          `UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?`,
          [record.id]
        );
        return { 
          valid: false, 
          message: 'Invalid OTP. Please try again.' 
        };
      }

      // Mark as verified
      await masterPool.execute(
        `UPDATE email_verifications 
        SET is_verified = TRUE, verified_at = NOW(), verified_email = ?, updated_at = NOW() 
        WHERE id = ?`,
        [email, record.id]
      );

      return { 
        valid: true, 
        message: 'Email verified successfully',
        verificationId: record.id,
        email: email
      };
    } catch (error) {
      throw new Error('Failed to verify OTP: ' + error.message);
    }
  }

  // Resend OTP
  static async resendOTP(email, verificationType, newOtp) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      const [result] = await masterPool.execute(
        `UPDATE email_verifications 
        SET otp = ?, otp_expires_at = ?, attempts = 0, updated_at = NOW() 
        WHERE email = ? AND verification_type = ? AND is_verified = FALSE
        ORDER BY created_at DESC LIMIT 1`,
        [newOtp, expiresAt, email, verificationType]
      );

      if (result.affectedRows === 0) {
        return { success: false, message: 'No pending verification found' };
      }

      return { success: true, message: 'OTP resent successfully' };
    } catch (error) {
      throw new Error('Failed to resend OTP: ' + error.message);
    }
  }

  // Check if email is verified
  static async isEmailVerified(email, verificationType) {
    try {
      const [rows] = await masterPool.execute(
        `SELECT id FROM email_verifications 
        WHERE email = ? AND verification_type = ? AND is_verified = TRUE
        ORDER BY verified_at DESC LIMIT 1`,
        [email, verificationType]
      );
      return rows.length > 0;
    } catch (error) {
      throw new Error('Failed to check email verification: ' + error.message);
    }
  }

  // Get verification history for an email
  static async getHistory(email) {
    try {
      const [rows] = await masterPool.execute(
        `SELECT id, verification_type, is_verified, verified_at, created_at 
        FROM email_verifications 
        WHERE email = ? 
        ORDER BY created_at DESC LIMIT 10`,
        [email]
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to fetch verification history: ' + error.message);
    }
  }

  // Clean up expired verifications
  static async cleanupExpired() {
    try {
      const [result] = await masterPool.execute(
        `DELETE FROM email_verifications 
        WHERE is_verified = FALSE AND otp_expires_at < NOW()`
      );
      return { success: true, deletedRows: result.affectedRows };
    } catch (error) {
      throw new Error('Failed to cleanup expired verifications: ' + error.message);
    }
  }

  // Mark as verified without OTP (admin override)
  static async markAsVerified(email, verificationType) {
    try {
      const [result] = await masterPool.execute(
        `UPDATE email_verifications 
        SET is_verified = TRUE, verified_at = NOW(), verified_email = ?, updated_at = NOW() 
        WHERE email = ? AND verification_type = ?
        ORDER BY created_at DESC LIMIT 1`,
        [email, email, verificationType]
      );

      if (result.affectedRows === 0) {
        // Create a new verified record if none exists
        await masterPool.execute(
          `INSERT INTO email_verifications 
            (email, verification_type, otp, otp_expires_at, is_verified, verified_at, verified_email, created_at, updated_at) 
          VALUES (?, ?, 'ADMIN', DATE_ADD(NOW(), INTERVAL 10 MINUTE), TRUE, NOW(), ?, NOW(), NOW())`,
          [email, verificationType, email]
        );
      }

      return { success: true };
    } catch (error) {
      throw new Error('Failed to mark email as verified: ' + error.message);
    }
  }
}

export default EmailVerification;