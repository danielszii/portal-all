# Manual completo do administrador

## Portal da Academia Limoeirense de Letras

Versão do manual: 10 de outubro de 2026.

Este manual ensina a operar a área administrativa do portal. Ele foi escrito para
usuários responsáveis pelo conteúdo e não exige conhecimento de programação.

> Importante: o ambiente atual possui conteúdo demonstrativo. Antes da publicação
> oficial, confirme textos, nomes, datas, fotografias, direitos de uso e documentos
> com a Academia Limoeirense de Letras.

---

## 1. Visão geral

A área administrativa permite:

- administrar notícias, eventos e publicações do acervo;
- atualizar membros, cadeiras, patronos e sucessões;
- editar informações institucionais;
- cadastrar gestões e integrantes da diretoria;
- consultar e remover referências da galeria;
- consultar o histórico de alterações;
- administrar contas e perfis de acesso;
- enviar imagens e PDFs para o armazenamento configurado.

O endereço local do painel é:

```text
http://localhost:5173/admin
```

Em produção, substitua `http://localhost:5173` pelo domínio oficial do portal.

---

## 2. Acesso ao painel

### 2.1 Entrar

1. Abra o portal.
2. Selecione **Login** no cabeçalho.
3. Informe o e-mail institucional da sua conta.
4. Digite a senha.
5. Marque **Lembrar de mim** apenas em um computador pessoal e protegido.
6. Selecione **Entrar**.

Sem a opção “Lembrar de mim”, a sessão termina ao fechar o navegador ou após o
limite de até 8 horas no servidor. Com a opção marcada, ela pode permanecer válida
por até 7 dias.

### 2.2 Sair

1. Selecione **Sair** no cabeçalho.
2. Aguarde o retorno à página inicial.

O logout revoga a sessão no servidor. Não basta fechar uma aba quando o computador
é compartilhado.

### 2.3 Erros de acesso

| Situação | O que fazer |
| --- | --- |
| E-mail ou senha inválidos | Confira o endereço digitado e tente novamente. |
| Muitas tentativas | Aguarde o tempo informado antes de tentar novamente. |
| Sessão expirada | Entre novamente; alterações ainda não salvas podem ser perdidas. |
| Módulo não aparece | Sua conta não possui o perfil necessário. |
| Acesso negado | Solicite a um Administrador geral a revisão dos seus perfis. |

Não compartilhe senhas por e-mail, planilhas, tarefas ou mensagens públicas.

---

## 3. Perfis e permissões

Uma conta pode receber mais de um perfil. Nesse caso, as permissões são somadas.

| Perfil | Acesso principal |
| --- | --- |
| **Administrador geral** | Todas as áreas, exclusões definitivas, auditoria e contas. |
| **Editor de conteúdo** | Notícias, agenda, galeria e acervo; imagens e PDFs. |
| **Secretaria institucional** | Instituição, diretoria, membros, cadeiras e imagens. |
| **Consulta e auditoria** | Consulta conteúdos, instituição e histórico, sem editar. |

### Recomendações

- Use **Administrador geral** apenas para responsáveis técnicos ou gestores.
- Use **Editor de conteúdo** para comunicação e publicações.
- Use **Secretaria institucional** para dados históricos e institucionais.
- Use **Consulta e auditoria** para revisão sem risco de alteração.
- Conceda somente o acesso necessário para cada pessoa.
- Não reutilize uma conta entre várias pessoas.

---

## 4. Funcionamento geral das telas

As listagens administrativas seguem o mesmo padrão:

1. O título identifica o módulo atual.
2. O campo de busca filtra registros.
3. O contador mostra quantos registros foram encontrados.
4. A paginação aparece quando há mais de uma página.
5. **Novo** abre o formulário de cadastro, quando permitido.
6. **Editar** carrega o registro atual.
7. **Visualizar** aparece para perfis somente de consulta.
8. **Excluir** remove definitivamente e exige confirmação.

### Estados editoriais

Notícias, eventos e publicações do acervo possuem três estados:

| Estado | Resultado |
| --- | --- |
| **Rascunho** | Fica salvo apenas no painel. |
| **Publicado** | Pode aparecer no portal público. |
| **Arquivado** | Deixa o portal público, mas permanece no painel. |

Prefira **Arquivado** quando o conteúdo deve apenas sair do ar. Use **Excluir**
somente para registros criados por engano ou cuja remoção definitiva foi aprovada.

### Pré-visualização

Alguns formulários exibem uma prévia. Use os botões de computador, tablet e celular
para conferir como o conteúdo se adapta. A prévia ajuda na revisão, mas a conferência
final deve ser feita também na página pública.

---

## 5. Notícias

Caminho: **Painel → Notícias**.

### Criar uma notícia

1. Selecione **Nova notícia**.
2. Preencha o título.
3. Escolha uma categoria: Institucional, Literatura, Eventos ou Memória.
4. Mantenha como **Rascunho** durante a preparação.
5. Informe a data e hora de publicação no horário de Fortaleza.
6. Escreva um resumo claro; o limite é de 2.000 caracteres.
7. Insira o conteúdo completo.
8. Escolha uma imagem de capa, se disponível.
9. Confira a pré-visualização.
10. Selecione **Salvar**.

Uma notícia publicada com data futura somente aparece quando o horário configurado
é alcançado.

### Editar, arquivar ou excluir

- Use **Editar** para corrigir texto, imagem, categoria ou data.
- Mude o estado para **Arquivado** para retirar a notícia do portal preservando-a.
- Use **Excluir** somente quando a remoção definitiva for necessária.

### Boas práticas

- Evite títulos totalmente em letras maiúsculas.
- Resuma a informação principal no primeiro parágrafo.
- Não publique dados pessoais sem autorização.
- Use imagem relacionada ao conteúdo e com direito de publicação confirmado.

---

## 6. Agenda de eventos

Caminho: **Painel → Agenda**.

### Criar um evento

1. Selecione **Novo evento**.
2. Informe o título.
3. Escolha o tipo: Sessão Solene, Posse, Palestra, Lançamento, Sarau ou Reunião.
4. Informe início e, quando existir, término.
5. Informe o local.
6. Escreva a descrição.
7. Escolha o estado editorial.
8. Envie uma imagem opcional.
9. Confira a prévia e salve.

Datas e horários são interpretados no fuso de Fortaleza.

### Evento encerrado

O portal reconhece automaticamente eventos passados pela data de término. Quando
não há término, usa a data de início.

### Relação com a galeria

Ao publicar um evento com imagem, o sistema cria automaticamente uma referência na
galeria. Excluir o evento remove também suas referências de galeria. O arquivo
armazenado pode permanecer no serviço de arquivos.

---

## 7. Galeria

Caminho: **Agenda → Galeria de eventos**.

A galeria permite consultar fotografias ligadas aos eventos e remover uma referência
que não deve aparecer publicamente.

### Remover uma foto da galeria

1. Localize a foto.
2. Se necessário, filtre pelo identificador do evento.
3. Selecione **Remover**.
4. Leia a confirmação e confirme a ação.

Essa operação remove apenas a referência da galeria. Ela não apaga o evento, as
outras fotografias nem necessariamente o arquivo físico.

---

## 8. Acervo digital

Caminho: **Painel → Acervo**.

### Criar uma publicação

1. Selecione **Nova publicação**.
2. Informe título e autoria.
3. Escolha o tipo: Livro, Caderno, Antologia, Revista, Discurso ou Estatuto.
4. Preencha edição ou tomo, quando aplicável.
5. Informe ano e quantidade de páginas.
6. Escolha a cor da capa demonstrativa.
7. Escreva uma descrição.
8. Envie o PDF.
9. Mantenha como **Rascunho** até revisar o arquivo.
10. Confira a prévia e salve.

O PDF é obrigatório para colocar a publicação no estado **Publicado**.

### Antes de publicar

- Abra o PDF e confirme que não está corrompido.
- Verifique título, autoria, edição, ano e número de páginas.
- Confirme a autorização de publicação.
- Evite digitalizações ilegíveis ou com páginas faltando.

---

## 9. Membros e cadeiras

Caminho: **Painel → Membros**.

Essa área administra titulares, patronos e o histórico das cadeiras. Alterações
devem ser feitas com cuidado, pois representam a memória institucional.

### Cadastrar um titular

1. Selecione **Novo membro**.
2. Informe o nome completo.
3. Informe o número da cadeira.
4. Escolha a situação.
5. Informe o patrono.
6. Informe o fundador somente quando for diferente do primeiro titular.
7. Informe a data de posse.
8. Preencha biografia e informações adicionais.
9. Envie a fotografia institucional.
10. Confira a prévia e salve.

### Substituir o titular de uma cadeira

Não altere o nome do titular antigo para o nome do novo. Use **Novo membro** e
informe a mesma cadeira. O sistema exibirá uma confirmação e preservará a ocupação
anterior no histórico.

### Encerrar uma ocupação

1. Abra o membro atual em **Editar**.
2. Altere a situação quando necessário.
3. Informe a data de encerramento.
4. Revise e salve.

Não invente datas ausentes. Registros históricos que possuem apenas o ano devem
continuar sem uma data completa até a confirmação oficial.

### Cadastros sem vínculo

O botão **Cadastros sem vínculo** lista acadêmicos ou patronos avulsos. A exclusão
só é permitida quando a pessoa não possui cadeira, obra, produção, autoria, mandato
ou outro vínculo histórico.

---

## 10. Instituição

Caminho: **Painel → Instituição**.

A página apresenta um resumo da completude e os dados publicados no portal.

### Editar informações institucionais

1. Selecione **Editar dados**.
2. Revise nome oficial, ano de fundação, contato e endereço.
3. Revise horário de atendimento.
4. Atualize história, missão, sede e trajetória.
5. Salve.
6. Abra **Ver página pública** e confira o resultado.

As alterações institucionais são publicadas ao salvar e registradas na auditoria.

---

## 11. Gestões e diretoria

Caminho: **Painel → Instituição → Gerenciar diretoria**.

### Criar uma gestão

1. Selecione **Nova gestão**.
2. Informe o ano inicial.
3. Informe o ano final ou deixe vazio para a gestão atual.
4. Salve o período.

Períodos de gestões não devem se sobrepor.

### Adicionar integrante

1. Abra a gestão desejada em **Gerenciar**.
2. Selecione **Integrante**.
3. Escolha um acadêmico já cadastrado.
4. Informe o cargo.
5. Informe início e fim no cargo, quando conhecidos.
6. Salve.

O mesmo cargo não pode possuir dois mandatos simultâneos equivalentes. Para uma
sucessão, encerre o mandato anterior antes de cadastrar o seguinte.

### Remover integrante ou gestão

- Remova um integrante apenas para corrigir um cadastro incorreto.
- Para preservar uma sucessão real, edite a data final em vez de excluir.
- Uma gestão somente pode ser excluída quando não possui integrantes.

---

## 12. Histórico de alterações

Caminho: **Painel → Histórico**.

O histórico ajuda a identificar ações administrativas, como criação, edição,
publicação, arquivamento, exclusão, upload e autenticação.

### Consultar

1. Escolha uma ação, quando necessário.
2. Escolha o recurso.
3. Informe o identificador do registro para uma busca específica.
4. Defina o período inicial e final.
5. Aplique os filtros.

O histórico registra o administrador e o horário da ação, mas não deve armazenar
senhas, tokens, conteúdo pessoal completo ou outros segredos.

---

## 13. Contas administrativas

Caminho: **Painel → Contas**. Disponível somente para Administrador geral.

### Criar uma conta

1. Selecione **Nova conta**.
2. Informe um e-mail único.
3. Crie uma senha inicial entre 15 e 128 caracteres.
4. Selecione pelo menos um perfil.
5. Salve.
6. Compartilhe a senha diretamente com o titular por um canal seguro.

### Alterar uma conta

1. Selecione **Editar**.
2. Altere os perfis ou a situação da conta.
3. Preencha uma nova senha somente se desejar redefini-la.
4. Salve.

Alterar senha, perfis ou situação encerra as sessões existentes dessa conta.

### Desativar em vez de apagar

Contas não são removidas pelo painel. Desative a conta para impedir novos acessos
e preservar a autoria das alterações já registradas.

---

## 14. Upload de imagens e PDFs

### Formatos aceitos

O formulário informa os tipos permitidos. Para imagens, utilize PNG, JPEG ou WebP.
Para o acervo, utilize PDF válido. O limite apresentado no painel é de 10 MB.

O sistema verifica:

- tamanho;
- extensão e tipo MIME;
- conteúdo real do arquivo;
- integridade básica de imagens e PDFs;
- divergência entre tipo declarado e conteúdo.

Arquivos inválidos são recusados antes de serem associados ao conteúdo.

### Recomendações para imagens

- Use imagens nítidas e corretamente orientadas.
- Prefira WebP ou JPEG otimizado para fotografias.
- Evite inserir texto essencial dentro da imagem.
- Confirme autoria e permissão de uso.
- Não envie documentos pessoais ou dados sensíveis como imagem.

### Recomendações para PDFs

- Confirme se todas as páginas estão presentes.
- Use texto pesquisável sempre que possível.
- Verifique direitos autorais.
- Evite arquivos protegidos por senha.

Quando o Cloudflare R2 está configurado, os arquivos são enviados para a nuvem. O
banco armazena a URL e os metadados, não o conteúdo integral do arquivo.

---

## 15. Mensagens de contato

O formulário público registra mensagens, mas elas **não podem ser consultadas pela
API nem pelo painel administrativo**. Essa restrição evita exposição de dados
pessoais até existir um fluxo administrativo específico e aprovado.

O envio automático por e-mail ainda é uma tarefa separada. Não prometa resposta
automática enquanto esse serviço não estiver configurado e testado.

Nunca consulte mensagens diretamente no banco durante uma apresentação ou em um
computador compartilhado.

---

## 16. Exclusão e recuperação

### Antes de excluir

Pergunte:

1. O conteúdo apenas precisa sair do portal? Use **Arquivado**.
2. O cadastro faz parte da história institucional? Preserve-o.
3. O arquivo possui vínculos? A exclusão pode ser bloqueada.
4. Existe confirmação do responsável pelo conteúdo?

Exclusões definitivas não possuem botão de desfazer. A recuperação depende de
backup, quando disponível.

### Efeitos importantes

- Excluir evento remove suas referências de galeria.
- Excluir publicação remove relações de autoria, mas preserva acadêmicos.
- Acadêmicos e patronos com vínculos não podem ser excluídos.
- Remover foto da galeria preserva evento e outras fotos.
- Excluir uma gestão exige que ela esteja vazia.

---

## 17. Segurança operacional

- Use uma conta individual.
- Nunca salve senha em documento versionado ou tarefa pública.
- Não deixe o painel aberto em computador compartilhado.
- Sempre use **Sair** ao terminar.
- Confira o endereço do site antes de informar a senha.
- Não envie arquivos recebidos de origem desconhecida.
- Evite conceder Administrador geral sem necessidade.
- Revise periodicamente contas ativas e perfis.
- Desative imediatamente contas que não devem mais acessar o portal.
- Não exponha mensagens de contato, tokens ou variáveis de ambiente.
- Em produção, utilize somente HTTPS.

---

## 18. Acessibilidade ao administrar conteúdo

- Escreva títulos objetivos e hierárquicos.
- Evite textos inteiros em maiúsculas.
- Não use apenas cor para transmitir informação.
- Use legendas e descrições que expliquem as fotografias.
- Não repita “imagem de” quando a descrição já identifica o conteúdo.
- Evite links com textos vagos como “clique aqui”.
- Revise o portal com zoom de 200%.
- Teste a navegação usando apenas `Tab`, `Shift + Tab`, `Enter` e `Esc`.

---

## 19. Resolução de problemas

### O registro não aparece no portal

Confira:

- se está como **Publicado**;
- se a data de publicação já chegou;
- se o evento ainda é futuro ou está em andamento;
- se os campos obrigatórios foram preenchidos;
- se o navegador está exibindo uma resposta anterior em cache;
- se a API e o banco estão disponíveis.

### A imagem ou o PDF não carrega

1. Confirme que o upload terminou sem erro.
2. Abra o registro novamente e confira se a URL foi preservada.
3. Verifique a conexão com a internet.
4. Teste outro arquivo válido dentro do limite.
5. Informe ao responsável técnico o módulo, o horário e a mensagem de erro.

### A alteração foi recusada por conflito

Outra pessoa pode ter alterado o mesmo registro. Feche o formulário, carregue os
dados novamente, compare as mudanças e refaça somente o ajuste necessário.

### A exclusão foi bloqueada

O registro possui vínculos históricos. Não tente contornar a proteção. Identifique
os vínculos e confirme com a Academia qual correção deve ser feita.

### O banco está indisponível

Não repita cadastros várias vezes. Aguarde a recuperação do serviço e confirme se
a operação anterior foi registrada antes de tentar novamente.

---

## 20. Rotina recomendada

### Antes de publicar

- [ ] Confirmar fonte e autorização do conteúdo.
- [ ] Revisar ortografia, nomes e datas.
- [ ] Validar imagem ou PDF.
- [ ] Salvar inicialmente como rascunho.
- [ ] Conferir a pré-visualização.
- [ ] Solicitar revisão quando o conteúdo for histórico ou institucional.

### Depois de publicar

- [ ] Abrir a página pública.
- [ ] Testar em computador e celular.
- [ ] Abrir links e arquivos.
- [ ] Conferir data, horário e fuso.
- [ ] Consultar o histórico em caso de dúvida.

### Mensalmente

- [ ] Revisar contas e perfis.
- [ ] Verificar conteúdo desatualizado.
- [ ] Conferir próximos eventos.
- [ ] Confirmar execução dos backups quando configurados.
- [ ] Revisar arquivos e imagens publicados recentemente.

---

## 21. Fluxo resumido

```text
Entrar no painel
       ↓
Escolher o módulo permitido
       ↓
Criar ou localizar o registro
       ↓
Preencher e revisar os dados
       ↓
Salvar como rascunho
       ↓
Conferir prévia e página pública
       ↓
Publicar ou manter arquivado
       ↓
Confirmar a alteração no histórico
```

---

## 22. Arquitetura de referência

![Arquitetura do Portal](./arquitetura-portal.png)

O painel não acessa diretamente o banco ou o armazenamento. As operações passam
pela API, que valida sessão, perfil, origem, token CSRF, dados e arquivos antes de
gravar no PostgreSQL ou no Cloudflare R2.

---

## 23. Quando procurar o responsável técnico

Procure suporte técnico quando:

- o portal ou a API não abrir;
- o banco estiver indisponível;
- uploads válidos falharem repetidamente;
- uma conta legítima não conseguir acessar seu módulo;
- ocorrer conflito persistente ao salvar;
- houver suspeita de acesso indevido;
- conteúdo pessoal aparecer publicamente;
- for necessário restaurar dados de backup.

Ao relatar, informe o horário, a página, a ação realizada e a mensagem exibida. Não
envie senha, cookie, token ou arquivo contendo dados pessoais sem orientação segura.

