# Auditoria de bugs — FirstBid-Site

Data: 2026-08-13

## GRAVE

### Corrigido — injeção de HTML/JavaScript no painel de reviews podia expor chaves de licença

Falha concreta: o dono abre `admin.html`, carrega um backup com chaves e cola nos campos uma review recebida de um vendedor. Antes da correção, `name`, `role`, `text` e `key` eram concatenados diretamente em `innerHTML`. Executei o JavaScript original com valores sintéticos contendo `<img onerror>` e `<svg onload>`; as tags chegaram sem escape ao HTML gerado enquanto a chave sintética também estava no mesmo DOM. Num navegador, esse markup é executável no contexto da origem e pode ler ou enviar as chaves exibidas na página.

Correção:

- `admin.html:163` escapa todos os campos antes de inseri-los no HTML.
- `admin.html:170` valida e normaliza o schema de cada item carregado de backup.
- `admin.html:245` rejeita o backup inteiro quando há uma review inválida, em vez de renderizar conteúdo arbitrário.
- `admin.html:261` gera o JSON público por allowlist (`name`, `role`, `rating`, `text`), em vez de apenas remover uma propriedade chamada `key`.
- `.vercelignore:1` impede que o painel local entre em novos deployments da Vercel.

Repeti o teste com a correção: nenhuma tag perigosa ficou crua; o conteúdo apareceu escapado. Um backup válido com campos sintéticos `key` e `token` gerou JSON público somente com os quatro campos permitidos. Nenhum valor real de chave foi usado ou impresso durante a auditoria.

Não encontrei chave, token, senha, webhook, segredo ou endpoint administrativo hardcoded em `index.html`, `install.html` ou `admin.html`.

## CORRIGIDOS

### Arquivos internos estavam publicados junto com o site

- Arquivos: `.vercelignore:1-5`, `admin.html:90`.
- Falha concreta: antes das mudanças, `https://firstbid.xyz/admin.html` e `https://firstbid.xyz/PRODUCT.md` respondiam HTTP 200. Um visitante conseguia abrir tanto a ferramenta que solicita chaves quanto o documento interno com arquitetura, licenciamento, infraestrutura de venda e decisões ainda não públicas.
- Correção: `admin.html`, `PRODUCT.md`, `README.md`, `reports/` e `.impeccable/` foram excluídos de novos deployments por `.vercelignore`. O texto do painel agora também deixa explícito que o arquivo não deve ser publicado.
- Observação operacional: o domínio continuará servindo os arquivos da versão atual até que estas mudanças sejam enviadas e um novo deployment seja feito; não fiz commit, push nem deploy, conforme solicitado.

### `/download/` retornava 404

- Arquivo: `vercel.json:2`.
- Falha concreta: no domínio em produção, `GET /download` respondia 200 com `install.html`, mas `GET /download/` respondia 404.
- Correção: `trailingSlash: false` faz a Vercel redirecionar a variante com barra final para a URL canônica sem barra. A propriedade foi conferida na [documentação oficial do `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json#trailingslash).

### Uma entrada inválida escondia todas as reviews válidas

- Arquivo: `index.html:522-539`.
- Falha concreta: executei o JavaScript original com uma lista contendo uma review válida e `null`. O acesso a `r.rating` lançou erro; o `.catch()` manteve toda a seção escondida, descartando inclusive a review válida.
- Correção: a lista agora aceita somente objetos com nome, texto e nota de 1 a 5 válidos. Entradas inválidas são ignoradas sem derrubar as válidas. O gate permanece: se nenhuma review válida existir, a seção e o link de navegação continuam escondidos.

### Uma única review ficava presa na primeira de três colunas

- Arquivo: `styles.css:716-720`.
- Falha concreta: com uma review, a grade desktop de três colunas ocupava somente a coluna esquerda e deixava dois terços vazios.
- Correção: o único card passa a ocupar a largura da grade, limitado a 560 px e centralizado. O layout de várias reviews não foi redesenhado.

### A licença era descrita como se não fosse por jogo

- Arquivo: `index.html:72`, `index.html:319`.
- Falha concreta: a página dizia “One key, one machine” e “Every install”, mas `PRODUCT.md` define uma chave por jogo e por máquina. Um vendedor de vários jogos podia entender que uma só chave liberava todos eles.
- Correção: os dois pontos agora informam explicitamente “one key, one game, one machine” e uma chave própria por jogo.

### O botão de download estourava em celular estreito

- Arquivo: `install.html:33-35`.
- Falha concreta: em 320 px, o conteúdo disponível dentro do botão é 224 px por causa dos paddings. O texto monoespaçado “Download FirstBid-Setup-latest.exe” mede aproximadamente 284 px no fallback Consolas a 0,95 rem, e `.btn` impedia quebra com `white-space: nowrap`.
- Correção: abaixo de 520 px, somente esse botão pode quebrar a linha e palavras longas.

### O formulário administrativo não empilhava em celular

- Arquivo: `admin.html:80-85`.
- Falha concreta: “Contexto” e “Nota” permaneciam lado a lado numa linha flexível até em 320 px, comprimindo controles com largura intrínseca e favorecendo overflow horizontal. Cards com texto ou chave longa tinham o mesmo risco.
- Correção: os campos e os cards empilham abaixo de 520 px; conteúdo longo pode quebrar dentro do card.

### Nomes acessíveis duplicados e nota de review ambígua

- Arquivos: `index.html:25`, `index.html:393`, `install.html:44`, `index.html:548`.
- Falha concreta: cada imagem do logo tinha `alt="FirstBid"` ao lado do texto visível “FirstBid”, fazendo leitores de tela anunciarem o nome duas vezes no mesmo link. As estrelas das reviews eram apenas glifos sem uma descrição inequívoca da nota.
- Correção: as imagens redundantes agora usam `alt=""`; cada nota tem `role="img"` e rótulo “N out of 5 stars”, com os glifos visuais ocultos da árvore acessível.

## ACHADOS MAS NÃO CORRIGIDOS

### `logo.png` é muito maior que o tamanho em que aparece

- Arquivo: `logo.png` (100.845 bytes, 512 × 512 px).
- Efeito: a landing page baixa cerca de 98,5 KiB para desenhar o logo principal a 34 × 34 px; no domínio, o arquivo é servido com `Cache-Control: public, max-age=0, must-revalidate`, então cada nova sessão ao menos revalida o recurso.
- Por que não corrigi: a tarefa proíbe alterar `logo.png`, e esse mesmo caminho é consumido pelo projeto do Discord. Não criei uma cópia derivada nem troquei a arte durante uma auditoria de bugs.

## NÃO SÃO BUGS

- `reviews.json` continua com exatamente as seis reviews originais; não alterei texto, nota, nome, formato ou ordem.
- Com zero reviews, JSON malformado, HTTP não OK ou falha de rede, a seção e o link “Reviews” ficam escondidos e o restante da página continua funcionando. Esse é o gate exigido.
- Testei 0, 1, 3 e uma mistura de entradas válidas/inválidas. Uma e várias reviews renderizam; zero e falhas escondem a seção.
- Os dez jogos visíveis são exatamente os dez de `PRODUCT.md`: Fortnite, Valorant, Rocket League, Brawl Stars, Rainbow Six Siege X, Marvel Rivals, League of Legends, EA Sports FC, Apex Legends e Call of Duty.
- Todos os 14 botões da landing page apontam ao Discord ou a uma âncora interna; não há checkout no site. O botão em `install.html` é download pós-compra, não botão de compra.
- O convite do Discord, o instalador da release, Google Fonts, `esm.sh/@vercel/analytics`, a página principal e `/download` responderam HTTP 200 na checagem externa.
- A cor travada `#ffc950` não foi alterada. A copy continua negando negociação por IA e afirma que o vendedor assume depois da primeira mensagem.
- `lang`, viewport, ordem de headings, `alt`, foco visível e `prefers-reduced-motion` estão presentes. O menor contraste de texto comum calculado foi 6,81:1 (`#9a9daa` sobre `#12141c`), acima do mínimo AA para texto normal.
- A importação de analytics é um módulo separado; uma indisponibilidade do CDN não interrompe o script principal. O endpoint atual respondeu 200 e permitiu CORS.
- `vercel.json` contém somente a rewrite esperada de `/download` para `/install.html` e a normalização de barra final adicionada. Não há proxy aberto nem destino controlável pelo visitante.

## COMO VERIFIQUEI

1. Li integralmente `README.md`, `PRODUCT.md`, `vercel.json`, `index.html`, `install.html`, `admin.html`, `styles.css` e `reviews.json` antes de editar.
2. Servi a árvore local em `http://127.0.0.1:8765/`. A porta 8080 estava indisponível no ambiente (`WinError 10013`), por isso usei 8765. `index.html`, `install.html`, `admin.html`, `styles.css`, `logo.png` e `reviews.json` responderam 200 com os tipos corretos; comparei os bytes HTTP com os arquivos locais e todos coincidiram.
3. Tentei usar o navegador integrado exigido para teste visual, console e viewport, mas a sessão retornou uma lista vazia de navegadores disponíveis. Portanto, não afirmo ter feito inspeção visual, screenshot ou teste real de teclado/browser.
4. Executei os scripts inline em ambiente JavaScript controlado com DOM e `fetch` simulados. Cobri reviews 0/1/N, mistura válida/inválida, JSON malformado, fetch rejeitado, HTTP 404 e campos com markup. Repeti o ataque sintético do painel antes e depois da correção.
5. Rodei `node --check` em todos os scripts inline clássicos e módulos: nenhum erro de sintaxe.
6. Validei os JSONs, IDs duplicados, destinos de âncoras, existência de recursos locais, `lang`, viewport, imagens com `alt` e `target="_blank"` com `rel="noopener"`: nenhum erro restante.
7. Comparei os dez jogos e as regras de licença com `PRODUCT.md`; contei e validei as seis entradas reais de `reviews.json`.
8. Fiz varredura de padrões de credencial/segredo em toda a árvore fora de `.git`: nenhum valor hardcoded encontrado.
9. Antes das correções, comparei SHA-256 dos arquivos servidos em `firstbid.xyz` com a árvore local: `index.html`, `install.html`, `admin.html`, `reviews.json`, `styles.css` e `logo.png` coincidiam. Assim, as falhas reproduzidas correspondiam ao deployment público auditado.
10. Consultei a documentação oficial da Vercel para confirmar [`trailingSlash: false`](https://vercel.com/docs/project-configuration/vercel-json#trailingslash) e a exclusão por [`.vercelignore`](https://vercel.com/docs/deployments/vercel-ignore).
11. Rodei `git diff --check` e confirmei com `git diff --exit-code -- reviews.json logo.png` que os dois arquivos protegidos permanecem byte a byte sem alteração.

Não fiz commit, push nem deploy.
