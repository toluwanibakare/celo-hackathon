export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectUrlPath = searchParams.get("redirectUrl") || "/";
  const absoluteUrl = new URL(redirectUrlPath, origin).toString();
  return Response.redirect(absoluteUrl);
}
