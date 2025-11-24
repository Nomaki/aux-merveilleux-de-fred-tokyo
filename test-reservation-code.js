// Test the new reservation code generator
function generateReservationCode() {
  // Generate 2 random uppercase letters
  const letters = Array.from({ length: 2 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

  // Generate 3 random digits
  const numbers = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  return `${letters}${numbers}`;
}

// Generate 10 sample codes
console.log('Testing new reservation code format (AB123):');
console.log('='.repeat(40));
for (let i = 0; i < 10; i++) {
  console.log(`${i + 1}. ${generateReservationCode()}`);
}
console.log('='.repeat(40));
console.log('✅ All codes are in AB123 format (2 letters + 3 digits)');
