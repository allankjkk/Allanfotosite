"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroPicker } from "./hero-picker";
import type { ActionResult, Project, Settings } from "@/lib/types";
import {
  login,
  sendContact,
  saveProject,
  saveSettings,
} from "@/features/actions";
import {
  slugify,
  contactSchema,
  formatPhone,
  normalizePhone,
} from "@/lib/validation";
const initial: ActionResult = { ok: false, message: "" };
export function Feedback({ result }: { result: ActionResult }) {
  return result.message ? (
    <div
      role={result.ok ? "status" : "alert"}
      className={`feedback ${result.ok ? "success" : "error"}`}
    >
      {result.message}
    </div>
  ) : null;
}
function Field({
  label,
  name,
  error,
  ...props
}: {
  label: string;
  name: string;
  error?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <small id={`${name}-error`} className="field-error">
          {error.join(" ")}
        </small>
      )}
    </label>
  );
}
export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, initial);
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>(
    {},
  );
  const errors = Object.keys(clientErrors).length ? clientErrors : state.errors;
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form
      action={action}
      ref={ref}
      className="form-grid"
      onSubmit={(event) => {
        const parsed = contactSchema.safeParse(
          Object.fromEntries(new FormData(event.currentTarget)),
        );
        if (!parsed.success) {
          event.preventDefault();
          const fields: Record<string, string[]> = {};
          for (const issue of parsed.error.issues)
            fields[String(issue.path[0])] = [issue.message];
          setClientErrors(fields);
        } else setClientErrors({});
      }}
    >
      <Field
        label="Nome"
        name="name"
        autoComplete="name"
        required
        maxLength={120}
        error={errors?.name}
      />
      <Field
        label="WhatsApp / celular"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="(83) 99999-9999"
        required
        error={errors?.phone}
        onBlur={(event) => {
          try {
            event.currentTarget.value = formatPhone(
              normalizePhone(event.currentTarget.value),
            );
          } catch {
            /* Validation explains invalid numbers on submit. */
          }
        }}
      />
      <label className="field">
        Mensagem
        <textarea
          name="message"
          rows={5}
          required
          maxLength={5000}
          aria-invalid={Boolean(errors?.message)}
          aria-describedby={errors?.message ? "message-error" : undefined}
        />
        {errors?.message && (
          <small id="message-error" className="field-error">
            {errors.message.join(" ")}
          </small>
        )}
      </label>
      <Feedback result={state} />
      <button className="button" disabled={pending}>
        {pending ? "ENVIANDO…" : "ENVIAR MENSAGEM ↗"}
      </button>
    </form>
  );
}
export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={action} className="form-grid">
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="username"
        required
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Feedback result={state} />
      <button className="button" disabled={pending}>
        {pending ? "ENTRANDO…" : "ENTRAR"}
      </button>
    </form>
  );
}
export function ProjectForm({ project }: { project?: Project }) {
  const [state, action, pending] = useActionState(saveProject, initial);
  const router = useRouter();
  const slug = useRef<HTMLInputElement>(null);
  const edited = useRef(Boolean(project));
  useEffect(() => {
    if (state.ok && state.id) {
      router.replace(`/admin/projetos/${state.id}`);
      router.refresh();
    }
  }, [state, router]);
  return (
    <form action={action} className="form-grid">
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field
        label="Título"
        name="title"
        defaultValue={project?.title}
        required
        maxLength={180}
        error={state.errors?.title}
        onChange={(e) => {
          if (!edited.current && slug.current)
            slug.current.value = slugify(e.target.value);
        }}
      />
      <label className="field">
        Endereço do projeto (slug)
        <input
          name="slug"
          ref={slug}
          defaultValue={project?.slug}
          onChange={() => {
            edited.current = true;
          }}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
        />
        {state.errors?.slug && (
          <small className="field-error">{state.errors.slug.join(" ")}</small>
        )}
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Categoria"
          name="category"
          defaultValue={project?.category}
          required
          error={state.errors?.category}
        />
        <Field
          label="Ano (opcional)"
          name="year"
          type="number"
          min={1800}
          max={2200}
          defaultValue={project?.year ?? ""}
          error={state.errors?.year}
        />
      </div>
      <label className="field">
        Descrição (opcional)
        <textarea
          name="description"
          rows={4}
          maxLength={10000}
          defaultValue={project?.description ?? ""}
        />
      </label>
      <Feedback result={state} />
      <button className="button" disabled={pending}>
        {pending
          ? "SALVANDO…"
          : project
            ? "SALVAR ALTERAÇÕES"
            : "SALVAR RASCUNHO"}
      </button>
    </form>
  );
}
export function SettingsForm({
  settings: s,
  projects,
}: {
  settings: Settings;
  projects: Project[];
}) {
  const [state, action, pending] = useActionState(saveSettings, initial);
  return (
    <form action={action} className="form-grid max-w-3xl">
      <HeroPicker
        projects={projects}
        initialProjectId={s.hero_project_id ?? ""}
        errors={state.errors?.hero_project_id}
      />
      <h2>Identidade e contato</h2>
      {(
        [
          ["name", "Nome"],
          ["instagram", "Instagram"],
          ["instagram_url", "URL do Instagram"],
          ["whatsapp", "WhatsApp"],
          ["email", "E-mail"],
          ["location", "Localização"],
          ["copyright", "Direitos autorais"],
          ["watermark_text", "Texto da marca d’água"],
        ] as const
      ).map(([name, label]) => (
        <Field
          key={name}
          label={label}
          name={name}
          defaultValue={s[name] ?? ""}
          type={
            name === "email"
              ? "email"
              : name === "instagram_url"
                ? "url"
                : "text"
          }
          required={["name", "copyright", "watermark_text"].includes(name)}
          error={state.errors?.[name]}
        />
      ))}
      <p className="muted">
        Alterações na marca d’água se aplicam às próximas fotos enviadas.
      </p>
      <Feedback result={state} />
      <button className="button" disabled={pending}>
        {pending ? "SALVANDO…" : "SALVAR ALTERAÇÕES"}
      </button>
    </form>
  );
}
