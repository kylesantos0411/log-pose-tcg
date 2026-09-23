import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function testFullFlow() {
  console.log('\n======================================================');
  console.log('🧪 Testing Account Lifecycle: Register -> Reset -> Login');
  console.log('======================================================\n');

  const testEmail = 'captain_luffy@pirate.tcg';
  const testUsername = 'MonkeyDLuffy';
  const initialPassword = 'strawhatpirate123';
  const newPassword = 'gear5supremeking456';

  // Step 1: Request Registration Code
  console.log('1. Requesting registration verification code...');
  const sendRegRes = await fetch(`${BASE_URL}/api/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, type: 'register' }),
  });
  const sendRegData = await sendRegRes.json();
  console.log('  send-code response:', sendRegData);
  if (!sendRegData.success || !sendRegData.devCode) {
    throw new Error('Failed to get registration code: ' + JSON.stringify(sendRegData));
  }
  const regCode = sendRegData.devCode;

  // Step 2: Complete Registration
  console.log('\n2. Submitting registration with 6-digit code...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      email: testEmail,
      password: initialPassword,
      code: regCode,
      avatar: '👒',
      crew: 'Straw Hat Pirates',
    }),
  });
  const regData = await regRes.json();
  console.log('  register response:', regData);
  if (!regData.success || !regData.user) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  console.log(`  ✓ Account created: ${regData.user.name} (${regData.user.tag})`);

  // Step 3: Test Login with initial password
  console.log('\n3. Testing login with initial password...');
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testEmail, password: initialPassword }),
  });
  const loginData1 = await loginRes1.json();
  console.log('  login response:', loginData1.success, '| user:', loginData1.user?.name);
  if (!loginData1.success) {
    throw new Error('Initial login failed: ' + JSON.stringify(loginData1));
  }

  // Step 4: Request Forgot Password Code
  console.log('\n4. Requesting Forgot Password code...');
  const sendForgotRes = await fetch(`${BASE_URL}/api/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, type: 'reset' }),
  });
  const sendForgotData = await sendForgotRes.json();
  console.log('  send-code for reset response:', sendForgotData);
  if (!sendForgotData.success || !sendForgotData.devCode) {
    throw new Error('Failed to get reset code: ' + JSON.stringify(sendForgotData));
  }
  const resetCode = sendForgotData.devCode;

  // Step 5: Reset Password
  console.log('\n5. Submitting Reset Password with new credentials...');
  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      code: resetCode,
      newPassword: newPassword,
    }),
  });
  const resetData = await resetRes.json();
  console.log('  reset-password response:', resetData);
  if (!resetData.success) {
    throw new Error('Password reset failed: ' + JSON.stringify(resetData));
  }
  console.log('  ✓ Password reset successful!');

  // Step 6: Verify old password fails
  console.log('\n6. Verifying old password fails...');
  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testEmail, password: initialPassword }),
  });
  const oldLoginData = await oldLoginRes.json();
  console.log('  old password login response status:', oldLoginRes.status, 'error:', oldLoginData.error);
  if (oldLoginRes.ok) {
    throw new Error('Old password should not succeed!');
  }
  console.log('  ✓ Old password correctly rejected.');

  // Step 7: Verify new password succeeds
  console.log('\n7. Verifying new password succeeds...');
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testEmail, password: newPassword }),
  });
  const newLoginData = await newLoginRes.json();
  console.log('  new password login response:', newLoginData.success, '| user:', newLoginData.user?.name);
  if (!newLoginData.success) {
    throw new Error('New password login failed: ' + JSON.stringify(newLoginData));
  }
  console.log('  ✓ New password successfully verified!');

  console.log('\n======================================================');
  console.log('🎉 ALL AUTH TESTS PASSED 100%!');
  console.log('======================================================\n');
}

testFullFlow()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
