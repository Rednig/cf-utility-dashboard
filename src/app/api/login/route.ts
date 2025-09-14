import { NextResponse } from 'next/server';

// Define an interface for the expected structure of the request body
interface LoginRequestBody {
  email: string;
  password: string;
}

// The authentication token for this demo. In a real-world app, this would be a secure,
// randomly generated string, or a JWT.
const AUTH_TOKEN = 'your_super_secret_auth_token';

export async function POST(request: Request) {
  // We explicitly tell TypeScript the expected shape of the JSON data.
  const { email, password } = await request.json() as LoginRequestBody;

  // For this demo, we use hardcoded credentials.
  // In a production app, you would validate against a secure database.
  if (email === 'admin@example.com' && password === 'password') {
    return NextResponse.json({ message: 'Authentication successful', token: AUTH_TOKEN });
  } else {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
