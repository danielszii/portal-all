# Configuração do ambiente de produção

## Portal da Academia Limoeirense de Letras

Versão do tutorial: 10 de outubro de 2026.

Este documento ensina como preparar e publicar o portal em produção. Os exemplos
usam uma hospedagem Node.js gerenciada, como Render ou Railway, mas os mesmos
comandos funcionam em qualquer serviço compatível com Node.js 22.

> Nunca coloque senhas, URLs privadas do banco ou chaves do Cloudflare R2 no Git,
> no README, em tarefas públicas ou em capturas de tela.

---

## 1. Arquitetura de produção

O projeto deve ser publicado inicialmente como um único serviço Node.js:

```text
Navegador
   │ HTTPS
   ▼
Serviço Node.js
   ├── Frontend React compilado
   └── API Express
          ├── Supabase / PostgreSQL
          └── Cloudflare R2
```

O backend já está preparado para servir os arquivos compilados do frontend. Essa
estrutura mantém frontend e API na mesma origem, simplificando cookies, CORS,
autenticação e configuração do domínio.

![Arquitetura do Portal](./arquitetura-portal.png)

---

## 2. Pré-requisitos

Antes de iniciar, confirme:

- [ ] repositório atualizado no GitHub;
- [ ] branch `main` estável;
- [ ] Node.js 22.18 ou superior;
- [ ] banco Supabase criado;
- [ ] `DATABASE_URL` usando Session Pooler;
- [ ] `DIRECT_URL` usando Direct Connection;
- [ ] migrations aplicadas no Supabase;
- [ ] bucket do Cloudflare R2 criado;
- [ ] token do R2 limitado ao bucket;
- [ ] URL pública HTTPS do R2;
- [ ] conta administrativa criada;
- [ ] conteúdo demonstrativo identificado;
- [ ] domínio definido ou URL temporária aceita para homologação.

---

## 3. Preparar o projeto localmente

Abra o PowerShell na raiz do projeto:

```powershell
cd "C:\Users\danie\Desktop\Academia Limoeirense de Letras\portal-all"
```

Instale exatamente as dependências registradas nos arquivos de lock:

```powershell
npm run install:all
```

Execute as verificações:

```powershell
npm run check
npm test
```

Pare os servidores locais antes do build se o Windows estiver mantendo o Prisma
Client bloqueado. Em seguida:

```powershell
npm run build
```

Teste a versão compilada:

```powershell
npm start
```

Abra:

```text
http://localhost:3001
http://localhost:3001/api/health
http://localhost:3001/api/ready
```

Ao usar o frontend compilado pelo backend, a origem local passa a ser
`http://localhost:3001`.

---

## 4. Escolher a hospedagem

A hospedagem precisa oferecer:

- serviço web Node.js;
- Node.js 22.18 ou superior;
- variáveis de ambiente protegidas;
- implantação por GitHub;
- HTTPS automático;
- suporte à variável `PORT` fornecida pela plataforma;
- logs da aplicação;
- reinício automático;
- possibilidade de executar comandos de migration.

Render e Railway atendem ao modelo atual. VPS também funciona, mas exige
configuração e manutenção de sistema operacional, proxy reverso, TLS e processos.

### Configuração recomendada

| Campo | Valor |
| --- | --- |
| Repositório | `https://github.com/danielszii/portal-all` |
| Branch | `main` |
| Diretório raiz | raiz do repositório |
| Runtime | Node.js |
| Versão do Node | 22.18 ou superior |
| Comando de build | `npm run install:all && npm run build` |
| Comando de start | `npm start` |
| Health check | `/api/health` |

Não configure a raiz do serviço como `frontend` ou `backend`. Os scripts da raiz
orquestram os dois projetos.

---

## 5. Variáveis de ambiente

Cadastre as variáveis no painel secreto da hospedagem. Não envie um arquivo `.env`.

### 5.1 Aplicação

```env
NODE_ENV=production
FRONTEND_URL=https://SEU_DOMINIO
```

Regras de `FRONTEND_URL`:

- usar `https://`;
- usar a origem exata acessada no navegador;
- não incluir caminhos;
- não incluir barra final;
- atualizar quando a URL temporária for substituída pelo domínio definitivo.

Exemplo:

```env
FRONTEND_URL=https://academialimoeirensedeletras.org.br
```

A hospedagem normalmente injeta `PORT`. Não fixe uma porta quando o provedor já
fornecer essa variável.

### 5.2 Supabase

```env
DATABASE_URL=URL_SESSION_POOLER_DO_SUPABASE
DIRECT_URL=URL_DIRECT_CONNECTION_DO_SUPABASE
```

Use:

- **Session Pooler** em `DATABASE_URL`, para a aplicação;
- **Direct Connection** em `DIRECT_URL`, para migrations e ferramentas Prisma.

As duas conexões utilizam a senha do banco. Preserve os parâmetros entregues pelo
Supabase e aplique codificação de URL em caracteres especiais da senha.

### 5.3 Cloudflare R2

```env
R2_ACCOUNT_ID=ID_DA_CONTA
R2_ACCESS_KEY_ID=CHAVE_DE_ACESSO
R2_SECRET_ACCESS_KEY=CHAVE_SECRETA
R2_BUCKET=portal-all-acervo
R2_PUBLIC_URL=https://acervo.SEU_DOMINIO
```

As cinco variáveis são obrigatórias em conjunto. Configuração parcial faz o upload
falhar explicitamente, evitando que arquivos sejam gravados no destino errado.

`R2_PUBLIC_URL` deve:

- usar HTTPS;
- apontar para o bucket ou domínio público correto;
- não conter credenciais;
- não conter query string ou fragmento;
- não terminar com barra.

### 5.4 Variáveis que não devem permanecer no serviço

Não cadastre permanentemente:

```env
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_PERFIS
SEED_DEMO
SEED_PRESENTATION
TEST_DATABASE_URL
```

As variáveis administrativas são temporárias. Seeds demonstrativos e banco de
testes nunca devem ser ativados no ambiente oficial.

---

## 6. Aplicar migrations

Execute antes de liberar uma versão que dependa de alterações no banco:

```bash
npm --prefix backend run db:deploy
```

Esse comando aplica migrations pendentes sem apagar dados existentes.

Nunca execute no banco oficial:

```bash
prisma migrate reset
```

Também não execute seeds demonstrativos no banco oficial.

### Estratégias possíveis

1. **Comando manual:** executar no console seguro da hospedagem antes da publicação.
2. **Pre-deploy:** configurar `npm --prefix backend run db:deploy` como etapa antes
   do start, se a plataforma oferecer esse recurso.
3. **Pipeline separado:** executar migrations em uma etapa protegida de CI/CD.

Para a primeira publicação, prefira a execução manual para acompanhar o resultado.

---

## 7. Criar o serviço web

O nome exato das telas varia entre provedores, mas o fluxo é:

1. Criar um novo serviço web.
2. Conectar a conta do GitHub.
3. Selecionar `danielszii/portal-all`.
4. Selecionar a branch `main`.
5. Manter a raiz do monorepo.
6. Configurar Node.js 22.18 ou superior.
7. Informar o comando de build.
8. Informar o comando de start.
9. Cadastrar todas as variáveis secretas.
10. Configurar `/api/health` como health check.
11. Iniciar a primeira implantação.

### Comando de build

```bash
npm run install:all && npm run build
```

### Comando de start

```bash
npm start
```

O build:

1. instala as dependências;
2. gera o Prisma Client;
3. compila o backend;
4. verifica os tipos do frontend;
5. gera `frontend/dist`.

O Express detecta `frontend/dist`, entrega a SPA e mantém `/api` para o backend.

---

## 8. Primeira implantação de homologação

Use primeiro a URL temporária da hospedagem.

Exemplo:

```text
https://portal-all-homologacao.exemplo.dev
```

Atualize temporariamente:

```env
FRONTEND_URL=https://portal-all-homologacao.exemplo.dev
```

Reimplante e valide:

```text
https://portal-all-homologacao.exemplo.dev/api/health
https://portal-all-homologacao.exemplo.dev/api/ready
```

Resultados esperados:

- `/api/health`: HTTP 200, processo operacional;
- `/api/ready`: HTTP 200 e banco disponível;
- página inicial: frontend carregado pelo Express.

Não divulgue a URL de homologação como site oficial.

---

## 9. Configurar domínio e HTTPS

### Domínio principal

Exemplo:

```text
academialimoeirensedeletras.org.br
```

1. Adicione o domínio no painel da hospedagem.
2. Copie os registros DNS fornecidos.
3. Cadastre os registros no Cloudflare ou registrador do domínio.
4. Aguarde a propagação.
5. Confirme a emissão do certificado HTTPS.
6. Atualize `FRONTEND_URL` com o domínio definitivo.
7. Faça uma nova implantação.

### Domínio público do R2

Exemplo:

```text
acervo.academialimoeirensedeletras.org.br
```

No Cloudflare:

1. Abra **R2**.
2. Selecione o bucket.
3. Abra as configurações do bucket.
4. Entre em domínios personalizados.
5. Conecte o subdomínio escolhido.
6. Aguarde a ativação HTTPS.
7. Atualize `R2_PUBLIC_URL`.
8. Reimplante o serviço.
9. Envie um arquivo de teste pelo painel e abra a URL retornada.

---

## 10. Criar ou validar a conta administrativa

Se a conta já existe no Supabase, apenas teste o login no domínio de homologação.

Se for necessário criar outra conta, use variáveis temporárias no console seguro:

```powershell
$env:ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$adminSecret = Read-Host 'Senha (15 a 128 caracteres)' -AsSecureString
try {
  $env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSecret).Password
  $env:ADMIN_PERFIS = 'ADMINISTRADOR'
  npm --prefix backend run admin:account -- create
} finally {
  Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD, Env:ADMIN_PERFIS -ErrorAction SilentlyContinue
  $adminSecret.Dispose()
}
```

Não grave a senha nos logs da hospedagem ou nas variáveis permanentes.

---

## 11. Testes após a publicação

### Portal público

- [ ] página inicial carrega;
- [ ] informações institucionais aparecem;
- [ ] cadeiras e perfis abrem;
- [ ] busca funciona;
- [ ] acervo lista publicações;
- [ ] PDFs abrem e baixam;
- [ ] notícias aparecem;
- [ ] agenda e galeria carregam;
- [ ] página 404 funciona;
- [ ] navegação por teclado permanece visível;
- [ ] layout funciona em celular.

### Área administrativa

- [ ] login funciona em HTTPS;
- [ ] sessão é restaurada ao atualizar a página;
- [ ] logout encerra a sessão;
- [ ] módulos respeitam os perfis;
- [ ] criação e edição funcionam;
- [ ] confirmações de exclusão aparecem;
- [ ] upload de imagem funciona;
- [ ] upload de PDF funciona;
- [ ] auditoria registra as operações;
- [ ] alteração de conta encerra suas sessões anteriores.

### Infraestrutura

- [ ] `/api/health` retorna HTTP 200;
- [ ] `/api/ready` retorna HTTP 200;
- [ ] migrations estão aplicadas;
- [ ] logs não exibem segredos;
- [ ] R2 retorna arquivos por HTTPS;
- [ ] Supabase continua sem acesso público às tabelas;
- [ ] domínio principal usa HTTPS válido;
- [ ] não há conteúdo demonstrativo apresentado como oficial.

---

## 12. Verificação de segurança

Antes de divulgar o domínio:

- [ ] `NODE_ENV=production`;
- [ ] `FRONTEND_URL` corresponde ao domínio exato;
- [ ] HTTPS ativo;
- [ ] cookie administrativo marcado como seguro;
- [ ] RLS habilitado nas tabelas do Supabase;
- [ ] papéis públicos sem acesso direto às tabelas;
- [ ] token R2 limitado ao bucket correto;
- [ ] nenhuma credencial versionada;
- [ ] contas antigas desativadas;
- [ ] senhas fortes e individuais;
- [ ] rate limiting funcionando;
- [ ] headers de segurança presentes;
- [ ] mensagens pessoais indisponíveis para leitura pública;
- [ ] política de backup definida.

---

## 13. Logs e monitoramento

Configure alertas para:

- serviço indisponível;
- falha recorrente de inicialização;
- `/api/ready` retornando 503;
- excesso de respostas 500;
- falhas de conexão com Supabase;
- falhas de upload no R2;
- uso anormal de memória ou CPU.

Os logs não devem incluir:

- senhas;
- cookies;
- tokens CSRF;
- URLs privadas completas do banco;
- chaves do R2;
- mensagens pessoais do formulário de contato.

---

## 14. Atualizações futuras

Para publicar uma nova versão:

1. Desenvolver e testar localmente.
2. Executar `npm run check`.
3. Executar `npm test`.
4. Executar `npm run build`.
5. Fazer commit e push para `main`.
6. Revisar migrations novas.
7. Fazer backup antes de mudanças de maior risco.
8. Aplicar migrations com `db:deploy`.
9. Implantar a aplicação.
10. Verificar health, ready e fluxo afetado.

Se o provedor estiver com implantação automática, o push em `main` poderá iniciar
o deploy. Proteja a branch e evite enviar alterações não validadas.

---

## 15. Rollback

Se a nova versão falhar:

1. Retire a versão problemática do tráfego usando o recurso de rollback da
   hospedagem.
2. Reative a última implantação estável.
3. Verifique `/api/health` e `/api/ready`.
4. Confirme login e páginas principais.
5. Preserve logs para diagnóstico.
6. Não reverta migrations destrutivamente sem analisar os dados.

Migrations devem ser aditivas e compatíveis com a versão anterior sempre que
possível. Nunca execute reset do banco como procedimento de rollback.

---

## 16. Checklist de conclusão da tarefa

A tarefa **Configuração do ambiente de produção** pode ser marcada como concluída
quando:

- [ ] hospedagem escolhida;
- [ ] serviço Node.js criado;
- [ ] repositório e branch conectados;
- [ ] build concluído na hospedagem;
- [ ] variáveis cadastradas;
- [ ] migrations aplicadas;
- [ ] frontend e API acessíveis na URL de homologação;
- [ ] Supabase conectado;
- [ ] R2 conectado;
- [ ] uploads testados;
- [ ] login administrativo testado;
- [ ] health e readiness configurados;
- [ ] domínio e HTTPS definidos ou homologação formalmente aceita;
- [ ] testes pós-publicação concluídos;
- [ ] rollback conhecido pela equipe;
- [ ] segredos ausentes do Git e dos logs.

---

## 17. Comandos de referência

```bash
# Instalação
npm run install:all

# Verificação
npm run check
npm test
npm run build

# Migrations de produção
npm --prefix backend run db:deploy

# Inicialização
npm start
```

Endpoints operacionais:

```text
/api/health
/api/ready
```

Documentos relacionados:

- [README do projeto](../README.md)
- [Manual do administrador](./MANUAL-ADMINISTRADOR.md)
- [Revisão de acessibilidade](./ACESSIBILIDADE-SPRINT-6.md)
- [API administrativa](../backend/ADMIN_API.md)
- [API pública](../backend/PUBLIC_API.md)

