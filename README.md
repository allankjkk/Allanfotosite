# Allan Dantas — portfólio fotográfico

Projeto gerado a partir de PRD.md, TECHNICAL_SPEC.md e UI_SPEC.md. Interface em português brasileiro, Next.js App Router, React, TypeScript, Tailwind, Supabase Auth/PostgreSQL/Storage e Sharp. Destino de publicação: Vercel.

## O que está implementado

- Início, portfólio editorial, galerias por slug, sobre, contato e página 404.
- Painel em `/admin`, login por e-mail/senha e autorização por `admin_users`.
- Dashboard, projetos, rascunhos, pré-visualização privada, publicação e desativação.
- Ordenação de projetos/fotos por arraste ou botões acessíveis pelo teclado.
- Upload TUS direto para armazenamento privado, progresso individual, processamento e repetição de falhas.
- JPEG/WebP de até 25 MB, 20 fotos disponíveis por projeto, WebP proporcional até 2000 px, orientação corrigida, marca d’água e metadados de autoria.
- Capa, texto alternativo, lixeira, restauração e exclusão definitiva com confirmação.
- Formulário de contato, mensagens e status, link para WhatsApp e configurações globais.
- SQL completo, RLS, testes de regras, migração e processamento de imagens.

**Não está conectado a uma conta Supabase nem publicado na Vercel.** Sem as variáveis de ambiente, o site mostra estados vazios e dados de identidade confirmados. Não há login fictício, mensagens simuladas nem fotografias atribuídas indevidamente ao autor.

## Executar localmente

Recomendado: Node.js 24 LTS e pnpm 11.19.0. O lockfile fixa as versões instaladas. Se precisar instalar o gerenciador: `npm install -g pnpm@11.19.0`.

```sh
pnpm install --frozen-lockfile
```

Copie `.env.example` para `.env.local` e preencha após configurar o Supabase. Para abrir apenas a interface com estados vazios, as credenciais não são necessárias.

```sh
pnpm dev
```

Acesse http://localhost:3000. O painel fica em http://localhost:3000/admin e não aparece na navegação pública.

## Configurar Supabase

1. Crie um projeto Supabase de sua propriedade.
2. No SQL Editor, execute **uma vez** `supabase/migrations/001_portfolio.sql` em um projeto novo e depois `002_home_carousel.sql` , `003_hidden_projects.sql` e `004_carousel_group.sql`. Se o projeto já está configurado, execute somente as migrações ainda não aplicadas. A migração inicial é transacional.
3. Em Authentication, desative o cadastro público e crie o usuário administrador com e-mail/senha. Copie seu UUID.
4. Execute, substituindo o valor pelo UUID real:

```sql
insert into public.admin_users(user_id) values ('UUID_REAL_DO_USUARIO');
```

5. Preencha `.env.local`:

| Variável                        | Valor                                                            |
| ------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL HTTPS do projeto Supabase                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública/anon do projeto                                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave service_role, somente no servidor                          |
| `SITE_URL`                      | `http://localhost:3000` em desenvolvimento; URL real em produção |

6. Reinicie o aplicativo e entre em `/admin`.
7. Em Configurações, confirme identidade, contatos, copyright e texto da marca d’água. WhatsApp e e-mail começam vazios.
8. Crie um rascunho, envie fotos, descreva-as, escolha uma capa, pré-visualize e publique.

### Modelo de acesso

As cinco tabelas têm RLS ativada e privilégios removidos de `anon` e `authenticated`. Não há política que libere acesso direto pelo navegador. O servidor usa `service_role`, que **ignora RLS**, e exige usuário validado e associação em `admin_users` para cada operação administrativa. Consultas públicas filtram estado/publicação/lixeira e projetam somente configurações públicas. O formulário público insere mensagens exclusivamente pela ação validada no servidor.

O bucket `originals` é privado. O servidor autoriza um caminho específico por token assinado de upload; o navegador envia por TUS. Não crie políticas públicas de escrita. O bucket `portfolio` é público e contém somente as versões processadas. URLs já conhecidas de imagens processadas continuam acessíveis enquanto os arquivos existirem, inclusive de projetos desativados: esconder um projeto não revoga uma URL pública.

## Conteúdo definitivo

- O carrossel exibe todas as fotos do grupo escolhido na lista em Configurações, sem exigir 10 fotos. O grupo fica oculto no portfólio automaticamente. Ordene suas fotos em Projetos. Consulte `docs/ATUALIZACAO-CARROSSEL.md`.
- Nenhum projeto fictício foi semeado. O catálogo começa vazio.
- Biografia e retrato aprovados são configurados em `src/content/about.ts`; coloque o retrato em `public/assets/`. Campos vazios não geram texto pessoal inventado.
- Datas são opcionais. Não foi aplicado o intervalo ilustrativo dos documentos.
- A fonte Syne acompanha o pacote e é hospedada pela própria aplicação.
- Os três documentos de referência estão em `docs/references/`.

## Decisões dos pontos em aberto

- Só fotos disponíveis contam para o limite de 20. A verificação ocorre em transação no banco, inclusive no recebimento simultâneo e restauração.
- Não é permitido mandar a capa para a lixeira: escolha outra capa antes. Para retirar o projeto do site, use Desativar ou mova o projeto inteiro para a lixeira.
- Restaurar um projeto não restaura fotos individualmente removidas. Projeto publicado precisa continuar com capa válida.
- A migração adiciona `deletion_pending` como controle interno. A exclusão confirmada bloqueia restaurações concorrentes, remove os objetos e então os registros. Se ocorrer falha, o item continua na lixeira para repetir **Excluir definitivamente**. Após começar a exclusão física, a restauração fica bloqueada para evitar retornar arquivos incompletos.
- Operações de catálogo usam uma função transacional restrita ao servidor e um lock curto; isso evita ultrapassar limites e gravar ordenações parciais sem introduzir uma fila.
- Uploads são processados sequencialmente no navegador. A finalização usa IDs estáveis e é idempotente. Cada erro pode ser repetido na mesma sessão; TUS recupera interrupções de transferência. Não há promessa de recuperação da seleção de arquivos após fechar a aba.
- Originais só são removidos depois de salvar imagem e registro. Uploads abandonados antes de concluir podem permanecer no bucket privado; a limpeza é manual pelo proprietário. Não há rotina automática de limpeza. Não remova originais enquanto houver uploads em andamento.
- Qualidade inicial WebP: 85. Maior lado: 2000 px, sem ampliar originais pequenos. Entradas de múltiplos frames ou acima de 100 megapixels são recusadas para limitar o consumo de memória. Calibre marca d’água e compressão com suas fotografias reais.
- Limites de texto são escolhas de implementação: nome 120, mensagem 5000, título 180, categoria 100 e descrição de projeto 10000 caracteres.

## Publicar na Vercel

1. Envie o código para seu repositório e importe-o na Vercel como projeto Next.js.
2. Configure as variáveis acima nos ambientes corretos; nunca exponha `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`.
3. Use Node.js 24. Comando de build: `pnpm build`. Mantenha a pasta de saída padrão do Next.js.
4. Defina `SITE_URL` com o endereço `.vercel.app` efetivamente atribuído ao projeto.
5. Configure no Supabase Auth a Site URL e os endereços de redirecionamento permitidos para o domínio real.
6. O processamento usa runtime Node com duração máxima declarada de 60 segundos. Confirme limites do seu plano e teste arquivos reais de até 25 MB; limites e desempenho em produção não foram validados nesta entrega.
7. Antes do lançamento, execute o roteiro em `docs/VALIDACAO.md` com a conta Supabase real e conteúdo aprovado.

Não foi criada nenhuma conta, cobrança, publicação ou configuração remota durante a geração deste projeto.

## Verificar

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Os testes PostgreSQL usam PGlite com esquemas mínimos de Auth e Storage. Eles executam a migração real e verificam regras e privilégios SQL, mas não substituem testes de Supabase Auth, TUS, RLS de Storage e hospedagem reais.

## Referências técnicas

- [Next.js](https://nextjs.org/docs)
- [Uploads retomáveis do Supabase](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
- [Metadados e saída do Sharp](https://sharp.pixelplumbing.com/api-output/)

