"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { MAX_BYTES, MAX_PHOTOS } from "@/lib/validation";
type Entry = {
  id: string;
  file: File;
  status: string;
  percent: number;
  error?: string;
  auth?: { ticket: string; token: string; path: string; endpoint: string };
  uploaded?: boolean;
};
async function post(url: string, data: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Não foi possível concluir o envio.");
  return result;
}
export function Uploader({
  projectId,
  count,
}: {
  projectId: string;
  count: number;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const router = useRouter();
  function update(entry: Entry, changes: Partial<Entry>) {
    Object.assign(entry, changes);
    setEntries((list) =>
      list.map((x) => (x.id === entry.id ? { ...entry } : x)),
    );
  }
  async function run(entry: Entry) {
    try {
      update(entry, { status: "Enviando", error: undefined });
      if (!entry.auth)
        entry.auth = await post("/api/uploads/authorize", {
          projectId,
          photoId: entry.id,
          type: entry.file.type,
          size: entry.file.size,
        });
      if (!entry.uploaded) {
        const auth = entry.auth!;
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(entry.file, {
            endpoint: auth.endpoint,
            headers: { "x-signature": auth.token },
            metadata: {
              bucketName: "originals",
              objectName: auth.path,
              contentType: entry.file.type,
              cacheControl: "3600",
            },
            chunkSize: 6 * 1024 * 1024,
            retryDelays: [0, 3000, 5000, 10000],
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            fingerprint: async () => `allan:${projectId}:${entry.id}`,
            onError: reject,
            onProgress: (sent, total) =>
              update(entry, { percent: Math.round((sent / total) * 100) }),
            onSuccess: () => resolve(),
          });
          upload
            .findPreviousUploads()
            .then((previous) => {
              if (previous[0]) upload.resumeFromPreviousUpload(previous[0]);
              upload.start();
            })
            .catch(reject);
        });
        entry.uploaded = true;
      }
      update(entry, { status: "Processando", percent: 100 });
      await post("/api/uploads/complete", { ticket: entry.auth!.ticket });
      update(entry, { status: "Pronta" });
      router.refresh();
    } catch (e) {
      update(entry, {
        status: "Erro",
        error: e instanceof Error ? e.message : "Falha no envio.",
      });
    }
  }
  async function select(files: FileList | null) {
    if (!files || lock.current) return;
    setError("");
    const list = Array.from(files);
    const failed = entries.filter((e) => e.status !== "Pronta").length;
    if (count + failed + list.length > MAX_PHOTOS) {
      setError("O projeto pode ter até 20 fotos disponíveis.");
      return;
    }
    if (
      list.some(
        (f) =>
          !["image/jpeg", "image/webp"].includes(f.type) ||
          f.size > MAX_BYTES ||
          !f.size,
      )
    ) {
      setError("Selecione apenas arquivos JPEG/WebP de até 25 MB.");
      return;
    }
    const fresh = list.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "Aguardando",
      percent: 0,
    }));
    setEntries((old) => [...old, ...fresh]);
    lock.current = true;
    setBusy(true);
    for (const entry of fresh) await run(entry);
    lock.current = false;
    setBusy(false);
    if (picker.current) picker.current.value = "";
  }
  return (
    <section className="uploader">
      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void select(e.dataTransfer.files);
        }}
      >
        <span className="upload-symbol" aria-hidden>
          ↑
        </span>
        <h3>Arraste suas fotografias até aqui</h3>
        <p>
          JPEG/WebP · até 25 MB por arquivo · máximo de 20 fotos por projeto
        </p>
        <p className="muted">
          Uma seleção de aproximadamente 15 fotos é uma boa medida.
        </p>
        <input
          ref={picker}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => void select(e.target.files)}
          aria-label="Selecionar fotografias"
        />
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => picker.current?.click()}
        >
          {busy ? "ENVIO EM ANDAMENTO…" : "SELECIONAR ARQUIVOS"}
        </button>
      </div>
      {error && (
        <p role="alert" className="feedback error">
          {error}
        </p>
      )}
      <ul className="upload-list" aria-live="polite">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div>
              <strong>{entry.file.name}</strong>
              <span>
                {entry.status}
                {entry.status === "Enviando" ? ` · ${entry.percent}%` : ""}
              </span>
            </div>
            {entry.status === "Enviando" && (
              <progress
                value={entry.percent}
                max={100}
                aria-label={`Envio de ${entry.file.name}`}
              />
            )}{" "}
            {entry.error && <p className="field-error">{entry.error}</p>}
            {entry.status === "Erro" && (
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setBusy(true);
                  await run(entry);
                  lock.current = false;
                  setBusy(false);
                }}
              >
                TENTAR NOVAMENTE
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
