# Revisão de acessibilidade — Sprint 6

Data da revisão: 10 de outubro de 2026.

## Objetivo

Revisar o portal público e a área administrativa com referência às práticas do
WCAG 2.2 nível AA. Esta revisão técnica não substitui uma auditoria formal com
usuários de tecnologias assistivas.

## Itens revisados

- navegação por teclado e ordem de foco;
- indicação visual de foco;
- link para saltar ao conteúdo principal;
- mudança de foco após navegação entre páginas;
- nomes acessíveis de botões, links, regiões e modais;
- foco contido e restaurado em diálogos;
- fechamento de diálogos com `Escape`;
- semântica de acordeões, paginação e estados;
- textos alternativos das imagens de conteúdo;
- ocultação de ícones meramente decorativos;
- rótulos e estados de formulários;
- mensagens de erro, carregamento e sucesso;
- carrossel automático e opção de pausa;
- preferência do sistema por movimento reduzido;
- modo de alto contraste;
- responsividade das páginas principais.

## Correções realizadas

1. A página principal recebe foco programático após mudanças de rota, sem retirar
   o link “Ir para o conteúdo principal”.
2. O foco de teclado foi padronizado com anel âmbar, evitando o contorno azul
   nativo e preservando identificação visual suficiente.
3. Campos, buscas e componentes administrativos agora possuem foco consistente.
4. O carrossel da página inicial pode ser pausado e não gira automaticamente
   quando o sistema solicita redução de movimento.
5. O acordeão de textos literários passou a usar um botão HTML nativo com
   `aria-expanded` e `aria-controls`.
6. Galeria e visualizador de PDF receberam títulos e descrições acessíveis.
7. A posição atual da fotografia é anunciada por região dinâmica.
8. Paginação recebeu botões explicitamente tipados, página atual e ícones
   decorativos ocultos de leitores de tela.
9. O formulário de contato anuncia envio, erro e estado ocupado; o foco é levado
   à confirmação após sucesso.
10. Links que abrem nova aba informam esse comportamento de forma não visual.
11. Estados vazios relevantes são anunciados.
12. Foi incluído suporte explícito ao modo de cores forçadas do sistema.

## Validação automatizada

- `npm run check`: aprovado;
- `npm test`: 148 testes aprovados, sendo 107 do backend e 41 do frontend;
- `npm --prefix frontend run build`: aprovado;
- 6 testes específicos de acessibilidade adicionados.

Os testes verificam link de salto, foco após rota, pausa do carrossel, movimento
reduzido, semântica do acordeão, nomes de modais, contenção/restauração de foco,
paginação, foco visível e modo de alto contraste.

## Resultado

Os problemas técnicos identificados nesta Sprint foram corrigidos e não houve
regressão detectada pela suíte automatizada. Para a publicação oficial, recomenda-se
uma rodada adicional com NVDA ou VoiceOver, ampliação de 200% e usuários reais,
especialmente depois da inserção do conteúdo definitivo da Academia.
