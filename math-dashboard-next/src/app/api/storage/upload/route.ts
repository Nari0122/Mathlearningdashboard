import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getAdminBucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const options = getAuthOptions(undefined);
        const session = await getServerSession(options);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const bucket = getAdminBucket();
        if (!bucket) {
            return NextResponse.json(
                { success: false, message: "Storage not configured" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const storagePath = formData.get("storagePath") as string | null;

        if (!file || !storagePath) {
            return NextResponse.json(
                { success: false, message: "file and storagePath are required" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileRef = bucket.file(storagePath);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type || "application/octet-stream",
            },
            public: true,
        });

        const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
        const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${encodedPath}`;

        return NextResponse.json({ success: true, downloadUrl, storagePath });
    } catch (error) {
        console.error("[api/storage/upload] error:", error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
