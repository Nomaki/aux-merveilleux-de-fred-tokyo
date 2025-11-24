/**
 * Generates a unique reservation code in format: AB123
 * - 2 uppercase letters
 * - 3 digits
 */
export function generateReservationCode(): string {
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

/**
 * Checks if a reservation code already exists in Supabase
 */
export async function isReservationCodeUnique(
  code: string,
  supabaseClient: any
): Promise<boolean> {
  const { data } = await supabaseClient
    .from('orders')
    .select('reservation_code')
    .eq('reservation_code', code)
    .single();

  // If no data found (error), the code is unique
  return !data;
}

/**
 * Generates a unique reservation code by checking against the database
 */
export async function generateUniqueReservationCode(
  supabaseClient: any
): Promise<string> {
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateReservationCode();
    isUnique = await isReservationCodeUnique(code, supabaseClient);
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique reservation code after multiple attempts');
    }
  } while (!isUnique);

  return code;
}
