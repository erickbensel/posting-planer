import { NextRequest, NextResponse } from "next/server";

// This endpoint can be used to trigger the worker startup
// In production, the worker runs as a separate process

let workerStarted = false;

export async function POST(req: NextRequest) {
  // Verify internal secret
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.NEXTAUTH_SECRET;

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (!workerStarted) {
    try {
      const { startWorker } = await import("@/lib/workers/post-publisher");
      startWorker();
      workerStarted = true;
      return NextResponse.json({ message: "Worker gestartet" });
    } catch (error) {
      console.error("Worker start error:", error);
      return NextResponse.json(
        { error: "Worker konnte nicht gestartet werden" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "Worker läuft bereits" });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    workerRunning: workerStarted,
    timestamp: new Date().toISOString(),
  });
}
