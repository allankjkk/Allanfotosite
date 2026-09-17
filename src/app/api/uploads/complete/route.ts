import { finishUpload } from "@/features/photos/upload.service";
import { revalidatePath } from "next/cache";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const result = await finishUpload(await request.json());
    revalidatePath("/", "layout");
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível processar a foto.",
      },
      { status: 400 },
    );
  }
}
