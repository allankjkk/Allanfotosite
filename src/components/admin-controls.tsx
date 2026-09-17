"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Project, Photo, Inquiry, ActionResult } from "@/lib/types";
import { labels } from "@/lib/types";
import { manage, permanentlyDelete, updateInquiry } from "@/features/actions";
import { formatPhone, whatsappUrl } from "@/lib/validation";
import { Feedback } from "./forms";
const empty: ActionResult = { ok: false, message: "" };
const date = (s: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(new Date(s));
export function ActionButton({
  input,
  children,
  danger = false,
}: {
  input: unknown;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState(empty);
  const router = useRouter();
  return (
    <div>
      <button
        type="button"
        className={`button secondary ${danger ? "danger" : ""}`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setResult(await manage(input));
            router.refresh();
          })
        }
      >
        {pending ? "Aguarde…" : children}
      </button>
      {!result.ok && <Feedback result={result} />}
    </div>
  );
}
export function DeleteButton({
  id,
  kind,
  title,
}: {
  id: string;
  kind: "project" | "photo";
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState(empty);
  const router = useRouter();
  return (
    <>
      <button
        className="text-button danger"
        onClick={() => dialog.current?.showModal()}
      >
        EXCLUIR DEFINITIVAMENTE
      </button>
      <dialog ref={dialog} className="confirm-dialog">
        <h2>Excluir definitivamente?</h2>
        <p>
          “{title}” e seus arquivos serão removidos. Esta ação não pode ser
          desfeita.
        </p>
        <Feedback result={result} />
        <div className="button-row">
          <button
            className="button secondary"
            disabled={pending}
            onClick={() => dialog.current?.close()}
          >
            CANCELAR
          </button>
          <button
            className="button danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const response = await permanentlyDelete({
                  id,
                  kind,
                  confirmation: "EXCLUIR",
                });
                setResult(response);
                if (response.ok) {
                  dialog.current?.close();
                  router.refresh();
                }
              })
            }
          >
            {pending ? "EXCLUINDO…" : "EXCLUIR"}
          </button>
        </div>
      </dialog>
    </>
  );
}
function useOrdering(
  ids: string[],
  operation: "reorder_projects" | "reorder_photos",
  projectId?: string,
) {
  const [result, setResult] = useState(empty);
  const [pending, start] = useTransition();
  const dragged = useRef<string | null>(null);
  const router = useRouter();
  function move(id: string, to: number) {
    const next = ids.filter((x) => x !== id);
    next.splice(to, 0, id);
    start(async () => {
      setResult(
        await manage({
          operation,
          ids: next,
          ...(projectId ? { projectId } : {}),
        }),
      );
      router.refresh();
    });
  }
  return { result, pending, dragged, move };
}
export function ProjectList({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("ALL");
  const available = projects
    .filter((p) => !p.deleted_at)
    .sort((a, b) => a.display_order - b.display_order);
  const order = useOrdering(
    available.map((p) => p.id),
    "reorder_projects",
  );
  const visible = available.filter(
    (p) => filter === "ALL" || p.status === filter,
  );
  return (
    <>
      <div className="tabs" role="group" aria-label="Filtrar projetos">
        {[
          ["ALL", "Todos"],
          ["PUBLISHED", "Publicados"],
          ["DRAFT", "Rascunhos"],
          ["INACTIVE", "Inativos"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="muted">
        Na aba Todos, arraste os projetos ou use as setas para ordenar.
      </p>
      <Feedback result={order.result} />
      <div className="admin-list">
        {visible.map((p, i) => (
          <article
            key={p.id}
            className="admin-row"
            draggable={filter === "ALL" && !order.pending}
            onDragStart={() => {
              order.dragged.current = p.id;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (filter === "ALL" && order.dragged.current)
                order.move(order.dragged.current, i);
            }}
          >
            <span className="row-index">{String(i + 1).padStart(2, "0")}</span>
            {p.photos.find((f) => f.id === p.cover_photo_id) && (
              <Image
                unoptimized
                className="admin-thumb"
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${p.photos.find((f) => f.id === p.cover_photo_id)!.storage_path}`}
                width={96}
                height={72}
                alt={`Capa de ${p.title}`}
              />
            )}
            <div className="flex-1">
              <Link href={`/admin/projetos/${p.id}`}>
                <h2>{p.title}</h2>
              </Link>
              <p className="muted">
                {p.category} · {p.photos.filter((f) => !f.deleted_at).length}{" "}
                fotos
              </p>
            </div>
            <span className={`badge ${p.status}`}>{labels[p.status]}</span>
            <div className="order-buttons">
              {filter === "ALL" && (
                <>
                  <button
                    disabled={i === 0 || order.pending}
                    aria-label={`Mover ${p.title} para cima`}
                    onClick={() => order.move(p.id, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    disabled={i === available.length - 1 || order.pending}
                    aria-label={`Mover ${p.title} para baixo`}
                    onClick={() => order.move(p.id, i + 1)}
                  >
                    ↓
                  </button>
                </>
              )}
              <Link className="text-button" href={`/admin/projetos/${p.id}`}>
                EDITAR ↗
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p className="empty-state">Nenhum projeto nesta seleção.</p>
      )}
    </>
  );
}
export function PhotoManager({
  project,
  baseUrl,
}: {
  project: Project;
  baseUrl: string;
}) {
  const photos = project.photos
    .filter((f) => !f.deleted_at)
    .sort((a, b) => a.display_order - b.display_order);
  const order = useOrdering(
    photos.map((f) => f.id),
    "reorder_photos",
    project.id,
  );
  return (
    <>
      <Feedback result={order.result} />
      <div className="photo-manager">
        {photos.map((photo, i) => (
          <article
            key={photo.id}
            draggable={!order.pending}
            onDragStart={() => {
              order.dragged.current = photo.id;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (order.dragged.current) order.move(order.dragged.current, i);
            }}
          >
            <Image
              unoptimized
              src={`${baseUrl}/${photo.storage_path}`}
              alt={photo.alt_text || `Foto ${i + 1}`}
              width={photo.width}
              height={photo.height}
              draggable={false}
            />
            <div className="photo-tools">
              <div className="flex items-center justify-between">
                <span>
                  {String(i + 1).padStart(2, "0")}{" "}
                  {project.cover_photo_id === photo.id ? "· CAPA" : ""}
                </span>
                <div className="order-buttons">
                  <button
                    aria-label={`Mover foto ${i + 1} para cima`}
                    disabled={i === 0 || order.pending}
                    onClick={() => order.move(photo.id, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Mover foto ${i + 1} para baixo`}
                    disabled={i === photos.length - 1 || order.pending}
                    onClick={() => order.move(photo.id, i + 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
              <AltForm photo={photo} />
              {project.cover_photo_id !== photo.id && (
                <ActionButton
                  input={{
                    operation: "cover",
                    id: project.id,
                    photoId: photo.id,
                  }}
                >
                  ESCOLHER CAPA
                </ActionButton>
              )}
              <ActionButton
                input={{ operation: "trash_photo", id: photo.id }}
                danger
              >
                MOVER PARA LIXEIRA
              </ActionButton>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function AltForm({ photo }: { photo: Photo }) {
  const [value, setValue] = useState(photo.alt_text ?? "");
  return (
    <div>
      <label className="field">
        Descrição alternativa
        <input
          value={value}
          maxLength={500}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Descreva o que a fotografia mostra"
        />
      </label>
      <ActionButton input={{ operation: "alt", id: photo.id, alt: value }}>
        SALVAR DESCRIÇÃO
      </ActionButton>
    </div>
  );
}
export function InquiryList({ items }: { items: Inquiry[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState(empty);
  const [pending, start] = useTransition();
  const router = useRouter();
  const inquiry = items.find((i) => i.id === selected);
  return (
    <div className="inquiry-layout">
      <div className="admin-list">
        {items.map((item) => (
          <button
            key={item.id}
            className={`inquiry-item ${selected === item.id ? "selected" : ""}`}
            onClick={() => {
              setSelected(item.id);
              if (item.status === "NEW")
                start(async () => {
                  setResult(
                    await updateInquiry({ id: item.id, status: "VIEWED" }),
                  );
                  router.refresh();
                });
            }}
          >
            <div className="flex justify-between gap-3">
              <strong>{item.name}</strong>
              <span className={`badge ${item.status}`}>
                {labels[item.status]}
              </span>
            </div>
            <p>
              {item.message.slice(0, 90)}
              {item.message.length > 90 ? "…" : ""}
            </p>
            <small>{date(item.created_at)}</small>
          </button>
        ))}
        {!items.length && (
          <p className="empty-state">Nenhuma mensagem recebida.</p>
        )}
      </div>
      <section className="inquiry-detail" aria-label="Detalhes da mensagem">
        {inquiry ? (
          <>
            <span className="eyebrow">{date(inquiry.created_at)}</span>
            <h2>{inquiry.name}</h2>
            <p>{formatPhone(inquiry.phone)}</p>
            <p className="message-body">{inquiry.message}</p>
            <a
              href={whatsappUrl(inquiry.phone)}
              target="_blank"
              rel="noreferrer"
              className="editorial-link"
            >
              ABRIR WHATSAPP ↗
            </a>
            <label className="field mt-8">
              Status
              <select
                value={inquiry.status}
                disabled={pending}
                onChange={(e) => {
                  const status = e.target.value;
                  start(async () => {
                    setResult(await updateInquiry({ id: inquiry.id, status }));
                    router.refresh();
                  });
                }}
              >
                {inquiry.status === "NEW" && <option value="NEW">Nova</option>}
                <option value="VIEWED">Visualizada</option>
                <option value="IN_CONTACT">Em contato</option>
                <option value="FINISHED">Finalizada</option>
              </select>
            </label>
          </>
        ) : (
          <p className="muted">Selecione uma mensagem para ler.</p>
        )}
        <Feedback result={result} />
      </section>
    </div>
  );
}
