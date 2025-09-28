# Authentication Flow Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the OTP-based authentication system in your unified Next.js application.

## Prerequisites
- Application running on `http://localhost:3000`
- Valid email configuration (for email OTP testing)
- Valid SMS configuration (for phone OTP testing)

## 🔧 Automated Testing

### Run Authentication Test Suite
```bash
# Run comprehensive authentication tests
npm run test:auth

# Or run directly
tsx scripts/test-authentication.ts
```

## 📱 Manual Testing Procedures

### 1. NextAuth Configuration Testing

#### Test NextAuth Providers
```bash
curl http://localhost:3000/api/auth/providers
```
**Expected Response:**
```json
{
  "otp": {
    "id": "otp",
    "name": "OTP",
    "type": "credentials",
    "signinUrl": "http://localhost:3000/api/auth/signin/otp",
    "callbackUrl": "http://localhost:3000/api/auth/callback/otp"
  }
}
```

#### Test Session Endpoint
```bash
curl http://localhost:3000/api/auth/session
```
**Expected Response:** `{}` (empty object when not authenticated)

#### Test CSRF Token
```bash
curl http://localhost:3000/api/auth/csrf
```
**Expected Response:**
```json
{
  "csrfToken": "some-csrf-token-here"
}
```

### 2. OTP Generation Testing

#### Test Email OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"contact":"your-email@example.com"}'
```

**Expected Responses:**
- **Success:** `{"success": true, "message": "OTP sent successfully"}`
- **Dev Mode:** `{"success": false, "message": "Email service not configured for development"}`

#### Test Phone OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"contact":"+1234567890"}'
```

#### Test Invalid Contact
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"contact":"invalid-contact"}'
```
**Expected:** Error response rejecting invalid format

### 3. OTP Verification Testing

#### Test Invalid OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"contact":"test@example.com","otp":"000000"}'
```
**Expected:** `{"success": false, "message": "Invalid or expired OTP"}`

#### Test Missing Parameters
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"contact":"test@example.com"}'
```
**Expected:** Validation error for missing OTP

### 4. Browser-Based Testing

#### Complete Authentication Flow
1. **Open Application**
   ```
   http://localhost:3000
   ```

2. **Test Email Authentication**
   - Enter email address
   - Click "Send OTP"
   - Check for success/error message
   - If successful, check email for OTP code

3. **Test Phone Authentication**
   - Enter phone number (+1234567890 format)
   - Click "Send OTP"
   - Check for success/error message
   - If successful, check SMS for OTP code

4. **Test OTP Verification**
   - Enter received OTP code
   - Click "Verify OTP"
   - Check response handling

5. **Test Profile Completion (New Users)**
   - Fill in display name
   - Choose username
   - Select avatar
   - Submit profile
   - Verify redirect to spaces

6. **Test Session Persistence**
   - After login, refresh page
   - Verify user remains logged in
   - Check session data in browser dev tools

#### Browser Developer Tools Testing

1. **Open Developer Tools** (F12)

2. **Check Network Tab**
   - Monitor API calls during authentication
   - Verify proper status codes
   - Check request/response headers

3. **Check Application Tab**
   - Look for NextAuth session cookies
   - Verify session storage

4. **Check Console**
   - Look for any JavaScript errors
   - Monitor authentication state changes

### 5. Session Management Testing

#### Test Protected Routes
```bash
# These should return 401 when not authenticated
curl http://localhost:3000/api/users/me
curl http://localhost:3000/api/spaces
curl http://localhost:3000/api/spaces/create
```

#### Test Logout
1. **Browser Method:**
   - Click logout button
   - Verify redirect to login page
   - Verify session cleared

2. **API Method:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signout
   ```

### 6. Error Handling Testing

#### Test Malformed Requests
```bash
# Invalid JSON
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d 'invalid-json'

# Missing Content-Type
curl -X POST http://localhost:3000/api/auth/send-otp \
  -d '{"contact":"test@example.com"}'
```

#### Test Rate Limiting (if implemented)
```bash
# Send multiple rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"contact":"test@example.com"}'
done
```

## 🧪 Testing Checklist

### ✅ NextAuth Configuration
- [ ] Providers endpoint returns OTP provider
- [ ] Session endpoint accessible
- [ ] CSRF token generation works

### ✅ OTP Generation
- [ ] Email OTP generation (or proper dev mode error)
- [ ] Phone OTP generation (or proper dev mode error)
- [ ] Invalid contact format rejection
- [ ] Proper error messages

### ✅ OTP Verification
- [ ] Invalid OTP rejection
- [ ] Missing parameter validation
- [ ] Proper success responses
- [ ] User creation for new contacts

### ✅ Session Management
- [ ] Protected routes require authentication
- [ ] Session persistence across page refreshes
- [ ] Proper logout functionality
- [ ] Session data in JWT tokens

### ✅ Profile Completion
- [ ] New user profile creation
- [ ] Profile validation
- [ ] Avatar customization
- [ ] Username uniqueness

### ✅ Error Handling
- [ ] Malformed JSON handling
- [ ] Missing headers handling
- [ ] Network error handling
- [ ] User-friendly error messages

## 🚨 Common Issues and Solutions

### Issue: "NEXTAUTH_SECRET is not set"
**Solution:** Ensure `.env` file contains `NEXTAUTH_SECRET`

### Issue: "Email service not configured"
**Solution:** Set `EMAIL_USER` and `EMAIL_PASS` in `.env` or test in production

### Issue: "Session not persisting"
**Solution:** Check `NEXTAUTH_URL` matches your domain

### Issue: "CSRF token mismatch"
**Solution:** Ensure proper CSRF handling in forms

## 📊 Expected Test Results

All tests should pass with:
- ✅ NextAuth properly configured
- ✅ OTP endpoints responding correctly
- ✅ Protected routes secured
- ✅ Error handling working
- ✅ Session management functional

## 🎯 Success Criteria

Authentication system is working correctly when:
1. All automated tests pass
2. Manual browser testing completes successfully
3. OTP flow works end-to-end (in production with real email/SMS)
4. Sessions persist properly
5. Error handling is graceful
6. Security measures are in place
