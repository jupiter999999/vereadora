# Ativar o editor administrativo do portal

## O que já está implementado
- `/admin/`: editor por seção, criação e exclusão de notícias, projetos, propostas, perguntas e links.
- Upload com validação de dimensões **exatas**: capa **1600 × 900**, projeto **1200 × 800**, notícia **1200 × 800**, retrato **900 × 1100**. JPG/PNG/WebP de entrada; saída WebP de até 1 MB.
- Galeria com até 8 fotografias por notícia; o destaque da home e o artigo permitem navegar pelas imagens.
- Preview isolada: nenhuma alteração local é publicada automaticamente.
- **Salvar rascunho**: commit na branch privada editorial do repositório (`cms/rascunho`, branch GitHub; ela tem a mesma visibilidade pública do repositório e NÃO deve receber informações privadas).
- **Publicar**: fast-forward do GitHub para `main`; a Vercel faz o deploy em produção.
- Histórico de versões e opção de restaurar como novo rascunho.
- Login via **GitHub OAuth** restrito ao administrador indicado na variável `CMS_ALLOWED_LOGIN`.

## Ativação sem compartilhar senhas ou tokens no ChatGPT
1. Acesse [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Application name: **Portal Itaitinga em Movimento — CMS**.
3. Homepage URL: `https://vereadora-taupe.vercel.app`.
4. Authorization callback URL: `https://vereadora-taupe.vercel.app/api/cms?action=callback`.
5. Após criar, copie o **Client ID** e gere o **Client Secret**. Guarde-os em local seguro. A autorização GitHub OAuth solicita escopo `repo`, que concede acesso amplo; utilize apenas em conta confiável. O código do backend só atua em `jupiter999999/vereadora`.
6. Na Vercel, abra o projeto **vereadora** → **Settings → Environment Variables** e crie, em **Production**:

   | Variável | Valor |
   |---|---|
   | `GITHUB_CLIENT_ID` | Client ID obtido acima |
   | `GITHUB_CLIENT_SECRET` | Client Secret obtido acima |
   | `CMS_SESSION_SECRET` | Uma sequência aleatória de **pelo menos 32 caracteres** gerada fora do ChatGPT |
   | `CMS_ALLOWED_LOGIN` | `jupiter999999` |
   | `CMS_PUBLIC_URL` | `https://vereadora-taupe.vercel.app` |

7. Faça **Redeploy** da produção para ativar as variáveis.
8. Abra `https://vereadora-taupe.vercel.app/admin/` e clique **Entrar com GitHub**.

**Importante:** nunca coloque `GITHUB_CLIENT_SECRET`, `CMS_SESSION_SECRET` ou o token OAuth no código-fonte ou em mensagens públicas.

## Fluxo editorial
1. **Editar site** → selecionar seção.
2. Alterar textos, botões, páginas e fotos.
3. **Visualizar prévia** (inclusive em celular).
4. **Salvar rascunho** no GitHub.
5. **Publicar no site**; aguardar a Vercel indicar `READY`.

A edição NÃO grava inscrições reais ou informações de alunos. O formulário de pré-inscrição permanece demonstrativo; dados de menores deverão usar um banco privado independente, autenticação e regras de proteção de dados.

## Onde as informações ficam
- `dados/site.json`: conteúdo público editorial, incluindo textos, notícias, links, ordem dos blocos e referências às fotos.
- `assets/cms/`: imagens publicadas pelos administradores.
- `main`: versão em produção.
- `cms/rascunho`: alterações em preparação. O branch não é privativo; não inclua informações confidenciais.
- Histórico GitHub: permite auditoria e recuperação de versões.

## Para migração posterior
Os conteúdos são arquivos JSON/WEBP sem dependência proprietária. Na futura HostGator, o site e as imagens poderão ser migrados, mas a API de publicação por GitHub OAuth precisará ser adaptada para o backend da nova hospedagem.

## Limitações atuais
- Exige configurar OAuth para autenticar e habilitar salvar/publicar.
- Não oferece edição livre de HTML/CSS; edita os textos, imagens e componentes previstos no portal sem risco de destruir o layout.
- As fotos novas são submetidas à dimensão exata por área.
- O CMS editorial não substitui o futuro sistema de inscrição e turmas.
- No momento há apenas um administrador autorizado, definido na configuração segura.
