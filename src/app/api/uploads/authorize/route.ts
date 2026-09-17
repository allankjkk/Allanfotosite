import { authorizeUpload } from "@/features/photos/upload.service";
export async function POST(request: Request) {
  try {
    return Response.json(await authorizeUpload(await request.json()));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Envio não autorizado.",
      },
      { status: 400 },
    );
  }
}
