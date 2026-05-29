exports.handler = async (event) => {
  // Get password from environment variable
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request" })
    };
  }

  const { password } = body;

  // Validate password
  if (password === ADMIN_PASSWORD) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: Buffer.from(password).toString("base64")
      })
    };
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ error: "Invalid password" })
  };
};