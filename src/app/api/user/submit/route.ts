import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getUserById, getLinkCount, addLink } from "@/lib/sheets";
import { verifyToken, isValidUrl } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { links } = await request.json();

    if (!Array.isArray(links)) {
  return NextResponse.json(
    { error: "Links must be an array" },
    { status: 400 }
  );
}

const cleanedLinks = links
  .map((l: string) => l.trim())
  .filter(Boolean)
  .filter((l: string) => isValidUrl(l));

if (cleanedLinks.length === 0) {
  return NextResponse.json(
    { error: "At least one valid link is required" },
    { status: 400 }
  );
}

const user = await getUserById(payload.userId);

if (!user)
  return NextResponse.json(
    { error: "User not found" },
    { status: 404 }
  );

if (user.status === "disabled") {
  return NextResponse.json(
    { error: "Your account has been disabled" },
    { status: 403 }
  );
}

const currentCount = await getLinkCount(payload.userId);

if (currentCount + cleanedLinks.length > user.submissionLimit) {
  return NextResponse.json(
    {
      error: `You can only submit ${
        user.submissionLimit - currentCount
      } more links`,
      limitReached: true,
    },
    { status: 429 }
  );
}

const submissions = cleanedLinks.map((link: string) => ({
  submissionId: uuidv4(),
  userId: payload.userId,
  userEmail: user.email,
  link,
  timestamp: new Date().toISOString(),
}));

for (const sub of submissions) {
  await addLink(sub);
}

    return NextResponse.json({
  success: true,
  message: `${submissions.length} links submitted successfully`,
  submissions,
  remaining: user.submissionLimit - currentCount - submissions.length,
});
  } catch (error) {
    console.error("Submit link error:", error);
    return NextResponse.json(
      { error: "Failed to submit link" },
      { status: 500 }
    );
  }
}
