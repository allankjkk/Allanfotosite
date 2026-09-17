# Carrossel por grupo

1. Atualize os arquivos preservando `.env.local`.
2. Se já executou 001, 002 e 003, execute somente `supabase/migrations/004_carousel_group.sql` no SQL Editor.
3. Reinicie com `pnpm dev`.
4. Em Admin → Configurações, escolha o grupo na lista do carrossel e salve.

Todas as fotos disponíveis desse grupo aparecem na capa, na ordem definida em Projetos. Pode haver uma ou mais fotos (limite existente de 20 por projeto). Com uma foto, a capa fica estática.

Mantenha o grupo publicado no painel. Ele fica automaticamente fora do portfólio, sitemap e página pública. Grupos ocultados na versão anterior continuam ocultos.

Para adicionar, remover ou ordenar fotos, edite o grupo em Projetos. Escolha Nenhum para desativar o carrossel. A seleção individual foi substituída: escolha e salve o grupo após atualizar.
