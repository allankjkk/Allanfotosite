# Validação e checklist de lançamento

## Verificação local automatizada

`pnpm test` verifica normalização de celular, campos obrigatórios, URLs seguras, regras de publicação, tipo/tamanho de arquivo, transformação Sharp, migração real em PostgreSQL/PGlite, capa de outro projeto, limite de fotos, restauração, idempotência, ordenação e acesso negado a tabelas/função para visitantes e usuários comuns.

`pnpm typecheck`, `pnpm lint` e `pnpm build` verificam tipagem, análise estática e geração de produção. O build não precisa de credenciais; isso não confirma conectividade remota.

## Executar no Supabase e Vercel reais antes do lançamento

- Entrar com administrador e sair. Confirmar que a sessão encerrada não pode continuar operações em outra aba.
- Entrar com usuário autenticado que não consta em `admin_users`: acesso negado.
- Acessar diretamente mensagens, rascunho, pré-visualização e endpoints sem sessão: acesso negado.
- Confirmar que anon/authenticated não leem mensagens ou configurações nem inserem mensagens diretamente via REST.
- Criar rascunho e retomá-lo após recarregar. Verificar slug duplicado, ano opcional e publicação sem capa bloqueada.
- Enviar JPEG e WebP reais, incluindo 25 MB, orientação EXIF e retratos. Rejeitar PNG, arquivo corrompido, animação e tamanho excedido.
- Interromper transferência e repetir. Confirmar estados Enviando/Processando/Pronta por arquivo e ausência de duplicatas.
- Inspecionar orientação, composição, marca d’água, GPS removido, autoria/credit/copyright presentes. Calibrar qualidade e escala visual.
- Confirmar que originals é privado e o original foi removido após a finalização.
- Enviar simultaneamente ao atingir 20 fotos: não ultrapassar o limite.
- Ordenar projetos e fotos por arraste e teclado; recarregar e confirmar ordem persistida.
- Publicar, abrir por slug, desativar e mover à lixeira: páginas públicas não devem expor itens inelegíveis.
- Selecionar capa de outro projeto via requisição alterada: operação negada.
- Restaurar projeto e foto individual; não restaurar foto além do limite. Confirmar que a capa atual não pode ser removida isoladamente.
- Cancelar a confirmação de exclusão: nada é alterado. Confirmar: os objetos e os registros são excluídos.
- Simular falha de Storage: o item permanece na lixeira para repetir exclusão, com restauração bloqueada após iniciar exclusão definitiva.
- Enviar contato inválido: nenhum registro. Enviar válido: status NEW e confirmação sem IDs internos.
- Abrir mensagem nova: VIEWED. Alterar para IN_CONTACT/FINISHED. Conferir o destino normalizado de WhatsApp sem enviar mensagem automaticamente.
- Alterar configurações e recarregar páginas públicas. Ausência de WhatsApp/e-mail não deve criar links falsos.
- Verificar 375, 390, 430, 768 px e desktop com fotos definitivas. Verificar teclado, foco, texto alternativo e ampliação de texto.
- Revisar biografia, retrato, anos e contatos. Não lançar a página inicial vazia como portfólio final.

## Limitações conhecidas

Nenhum teste remoto foi executado sem uma conta configurada. PGlite verifica o PostgreSQL local, não o serviço Storage/Auth hospedado. A privacidade de URL de imagens processadas segue o bucket público escolhido no documento. Não há rate limiting/CAPTCHA, recuperação de senha customizada, notificações, chat, vendas ou limpeza automática, conforme o escopo v1.
