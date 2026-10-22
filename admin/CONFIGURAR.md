# Painel administrativo do portal

**Endereço:** https://vereadora-taupe.vercel.app/adm

## Acesso

- A página `/adm` abre uma tela de login com **usuário e senha**.
- A credencial é verificada em função serverless, sem expor a senha nem o hash no navegador.
- A senha está protegida por **scrypt com salt aleatório**; a Vercel armazena apenas o hash.
- A sessão dura até quatro horas, em cookie criptografado, `Secure`, `HttpOnly` e `SameSite=Lax`.
- Todas as operações de edição precisam de sessão e validação CSRF.
- O usuário de demonstração NÃO é público e não aparece no código-fonte.

## Editar o conteúdo do site

O painel permite editar capa, fotos com dimensões fixas, projetos, notícias, galerias, textos institucionais, links, botões, atuação pública, FAQ e rodapé. A tela `Visualizar prévia` mostra as alterações antes de publicá-las.

## Para habilitar Salvar e Publicar no GitHub

A conta administrativa e a visualização funcionam **sem GitHub OAuth**. Já a gravação persistente das mudanças exige um token do repositório de destino.

1. No GitHub, entre em **Settings > Developer settings > Personal access tokens > Fine-grained tokens**.
2. Crie token **exclusivamente** para `jupiter999999/vereadora`, com acesso **Contents: Read and write** (e **Metadata: Read** que é obrigatório), prazo de validade adequado.
3. Em Vercel → projeto `vereadora` → **Settings > Environment Variables**, adicione `CMS_GITHUB_TOKEN` como variável criptografada no ambiente **Production** (e Preview se desejar testes).
4. Faça um **Redeploy** da produção para carregar a variável.
5. Entre em `/adm`, edite, clique **Visualizar prévia**, **Salvar rascunho** e **Publicar no site**.

**Não envie o token pelo ChatGPT e não coloque o token em arquivos do GitHub.** Crie e configure diretamente nos painéis oficiais.

Sem `CMS_GITHUB_TOKEN`, a pessoa ainda consegue entrar no editor e visualizar alterações; os botões de publicação ficam desabilitados com indicação clara. Nenhuma alteração é falsa ou salva somente no navegador como se estivesse online.

A publicação usa o branch `cms/rascunho` como área de rascunho, com histórico no GitHub. O branch tem a visibilidade pública do repositório e só recebe conteúdo do site, nunca informações privadas.

## Alterar usuário ou senha futuramente

As variáveis seguras são `CMS_ADMIN_USER`, `CMS_ADMIN_PASSWORD_HASH` e `CMS_SESSION_SECRET`, todas do projeto `vereadora` (não do Espaço Flow). A senha é verificada por `crypto.scryptSync(password, Buffer.from(salt,'hex'), 64)`; `CMS_ADMIN_PASSWORD_HASH` recebe `salt:hash` em formato hexadecimal. A alteração das variáveis requer redeploy. Nunca coloque a senha em texto puro na Vercel ou GitHub.

## Limites

- Login e editor estão disponíveis, mas gravação e publicação dependem do token GitHub.
- Inscrição de alunos segue **demonstração**, sem persistir dados pessoais.
- O editor altera conteúdo e componentes existentes, não HTML/CSS arbitrário.
- Não inclua informações pessoais dos estudantes no GitHub.
- Para proteção adicional contra ataques de tentativa de senha, considere limite de requisições/rate limiting no gateway da Vercel.
