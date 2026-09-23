# Email Verification API Documentation

## Overview
The email verification system provides OTP-based verification for three scenarios:
1. **Employee Email Verification** - When creating a new employee account
2. **Company Email Verification** - During company onboarding
3. **Email Change Verification** - When users change their email address

## Endpoints

### 1. Employee Email Verification

#### Send OTP for Employee Email
```
POST /api/email-verification/employee/send-otp
Content-Type: application/json

Request Body:
{
  "email": "employee@company.com"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "email": "employee@company.com"
}

Response (Error - Already Verified):
{
  "error": "This email is already verified"
}
```

#### Verify Employee Email OTP
```
POST /api/email-verification/employee/verify-otp
Content-Type: application/json

Request Body:
{
  "email": "employee@company.com",
  "otp": "123456"
}

Response (Success):
{
  "success": true,
  "message": "Email verified successfully",
  "verificationId": 1,
  "email": "employee@company.com"
}

Response (Error - Invalid OTP):
{
  "error": "Invalid OTP. Please try again."
}

Response (Error - Expired):
{
  "error": "OTP has expired. Please request a new one."
}
```

---

### 2. Company Email Verification

#### Send OTP for Company Email
```
POST /api/email-verification/company/send-otp
Content-Type: application/json

Request Body:
{
  "email": "company@example.com"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "email": "company@example.com"
}
```

#### Verify Company Email OTP
```
POST /api/email-verification/company/verify-otp
Content-Type: application/json

Request Body:
{
  "email": "company@example.com",
  "otp": "123456"
}

Response (Success):
{
  "success": true,
  "message": "Email verified successfully",
  "verificationId": 2,
  "email": "company@example.com"
}
```

---

### 3. Email Change Verification (Protected Route)

#### Send OTP for Email Change
```
POST /api/email-verification/change/send-otp
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "newEmail": "newemail@company.com"
}

Response (Success):
{
  "success": true,
  "message": "Verification OTP sent to your new email",
  "email": "newemail@company.com"
}

Response (Error - Email Already in Use):
{
  "error": "Email is already in use"
}
```

#### Verify Email Change OTP
```
POST /api/email-verification/change/verify-otp
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "newEmail": "newemail@company.com",
  "otp": "123456"
}

Response (Success):
{
  "success": true,
  "message": "Email changed successfully",
  "newEmail": "newemail@company.com"
}
```

---

### 4. Resend OTP

#### Resend OTP
```
POST /api/email-verification/resend-otp
Content-Type: application/json

Request Body:
{
  "email": "employee@company.com",
  "verificationType": "employee_email"  // employee_email, company_email, email_change
}

Response (Success):
{
  "success": true,
  "message": "OTP resent successfully",
  "email": "employee@company.com"
}

Response (Error - Max Attempts):
{
  "error": "Maximum OTP attempts exceeded. Please request a new OTP."
}
```

---

### 5. Check Email Verification Status

#### Check if Email is Verified
```
GET /api/email-verification/check?email=employee@company.com&verificationType=employee_email

Response:
{
  "success": true,
  "email": "employee@company.com",
  "verificationType": "employee_email",
  "isVerified": true
}
```

---

## Integration Guide

### Step 1: Employee Creation Flow

1. **Frontend:** Send OTP to employee email
   ```javascript
   POST /api/email-verification/employee/send-otp
   { email: "emp@company.com" }
   ```

2. **Frontend:** User enters OTP and verifies
   ```javascript
   POST /api/email-verification/employee/verify-otp
   { email: "emp@company.com", otp: "123456" }
   ```

3. **Frontend:** Create employee account (now email is verified)
   ```javascript
   POST /api/employees
   {
     name: "John Doe",
     email: "emp@company.com",
     department: "IT",
     designation: "Developer",
     ...
   }
   ```

---

### Step 2: Onboarding Flow

1. **Frontend:** Send OTP to company email
   ```javascript
   POST /api/email-verification/company/send-otp
   { email: "company@example.com" }
   ```

2. **Frontend:** User verifies company email
   ```javascript
   POST /api/email-verification/company/verify-otp
   { email: "company@example.com", otp: "123456" }
   ```

3. **Frontend:** Complete onboarding (email must be verified)
   ```javascript
   POST /api/auth/onboarding/complete
   {
     company: {
       companyName: "Acme Corp",
       email: "company@example.com",
       ...
     },
     profile: {...},
     subscription: "basic"
   }
   ```

---

### Step 3: Email Change Flow

1. **Frontend:** Send OTP to new email (requires auth)
   ```javascript
   POST /api/email-verification/change/send-otp
   Authorization: Bearer {token}
   { newEmail: "newemail@company.com" }
   ```

2. **Frontend:** User verifies new email
   ```javascript
   POST /api/email-verification/change/verify-otp
   Authorization: Bearer {token}
   { newEmail: "newemail@company.com", otp: "123456" }
   ```

3. **Result:** User's email is automatically updated

---

## Database Schema

### email_verifications Table

```sql
CREATE TABLE email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  email VARCHAR(255) NOT NULL,
  verification_type ENUM('employee_email', 'company_email', 'email_change') NOT NULL,
  otp VARCHAR(6) NOT NULL,
  otp_expires_at DATETIME NOT NULL,
  verified_email VARCHAR(255),
  verified_at DATETIME,
  is_verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email_type (email, verification_type),
  INDEX idx_user_verification (user_id, verification_type),
  INDEX idx_otp_expires (otp_expires_at)
)
```

---

## Features

✅ **OTP Generation & Verification**
- 6-digit OTP
- 10-minute expiration
- Maximum 5 failed attempts per request
- Auto-cleanup of expired OTPs

✅ **Email Templates**
- Custom email templates for each verification type
- HTML formatted emails
- Console logging for development (w hen SMTP not configured)

✅ **Error Handling**
- Comprehensive error messages
- Proper HTTP status codes
- Validation of all inputs

✅ **Security**
- OTP expiration after 10 minutes
- Attempt throttling (max 5 failed attempts)
- Database constraints and indexes
- Email uniqueness validation

✅ **Integration Points**
- Employee creation requires email verification
- Onboarding requires company email verification
- Email change only for authenticated users

---

## Error Codes

| Error | HTTP Status | Description |
|-------|------------|-------------|
| EMAIL_NOT_VERIFIED | 400 | Employee email is not verified |
| COMPANY_EMAIL_NOT_VERIFIED | 400 | Company email is not verified |
| Invalid OTP | 400 | OTP doesn't match |
| OTP has expired | 400 | OTP validity period exceeded |
| Maximum OTP attempts exceeded | 400 | More than 5 failed attempts |
| Email is already in use | 400 | Email already exists for another user |
| This email is already verified | 400 | Email already verified previously |

---

## Configuration

### Environment Variables (Optional)
```
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=HRMS Support <your-email@gmail.com>

# If SMTP not configured, OTPs will be logged to console
```

---

## Notes

- OTP validity is **10 minutes**
- Maximum of **5 failed OTP attempts** per verification request
- After verification, emails cannot be re-verified for the same type
- For development, configure SMTP or check console for OTP logs
- All emails are normalized to lowercase for consistency
