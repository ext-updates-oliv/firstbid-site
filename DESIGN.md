# Design — firstbid.xyz

<!-- impeccable:design-schema 1 -->

O mundo visual do site, escrito **a partir do que foi construído** (2026-09-09), não
de intenção. `PRODUCT.md` manda na verdade do produto; este arquivo manda no visual.

## A tese

**Todo preço que o vendedor configurou já existe, apagado. O pedido que chega acende
exatamente um.**

Não é metáfora: é literalmente como o bot funciona. A matriz de preço é preenchida uma
vez, e o pedido não é *calculado* — é *encontrado*. Por isso a resposta leva segundos, e
por isso a página inteira é uma pilha de valores catódicos onde um está aceso.

O que isso recusa: o hero escuro de SaaS com cartões de vidro flutuando e três colunas de
ícone+título+texto. Era o que o site era antes, e é o que todo concorrente é.

## Paleta

Dois matizes, e só.

| Token | Valor | Papel |
| --- | --- | --- |
| `--ground` | `#070b14` | tinta-azul, o fundo de tudo |
| `--ground-deep` | `#04070e` | nav e poços mais fundos |
| `--glow` | `#ffc950` | **ATIVO**. Nunca decoração |
| `--glow-core` | `#fff0c8` | o núcleo mais quente do dígito |
| `--glow-decay` | `#9c7434` | rastro do valor que acabou de apagar |
| `--ghost` | `#1a2334` | numeral presente, apagado |
| `--ghost-lit` | `#2b3a55` | fantasma mais perto da superfície |
| `--bone` | `#ece6d9` | texto principal |
| `--bone-dim` | `#93a0b6` | secundário, **tintado do fundo** (nunca cinza neutro) |

> O dourado é travado por decisão de marca: é a mesma cor do botão "Buy now" da
> Eldorado.gg, e faz trabalho de confiança. Ver `PRODUCT.md`. O que o redesenho fez foi
> dar **significado** a ele — deixou de ser acento e passou a ser o estado ATIVO.

## Materiais

**A malha de bronze** (`--gauze`) é o material que segura o mundo. Passo de 3px,
`repeating-linear-gradient` nos dois eixos, a 5,5% de alfa.

- `.gauze-plane` é `position: fixed` e corre **além de toda borda** (`inset: -10vh -10vw`).
  Nunca é emoldurada.
- `--gauze-bite` é a mesma malha em negativo, para morder **por dentro** da letra acesa
  (`background-clip: text`). É o que faz o numeral parecer válvula em vez de texto dourado.

**Regra que não se negocia:** a mordida só vale em display **grande**. Abaixo de ~2rem as
linhas pretas atravessam a letra e comem a legibilidade — foi medido, e por isso o texto
dos botões não a usa.

**Não existe caixa, régua ou divisória de agrupamento.** O que agrupa é densidade de malha
e profundidade. Onde uma superfície precisa se destacar (o plano em destaque, o aviso do
Windows) ela usa malha + `inset box-shadow` de 1px, não borda de cartão.

## Tipografia

| Papel | Face | Uso |
| --- | --- | --- |
| Display | **Big Shoulders Display** 900 | manchetes, numerais, nomes de jogo. Condensada, caixa alta, `line-height: 0.86` |
| Corpo | **Chivo Mono** 300/500/700 | prosa, rótulos, botões |

O mono aqui **não é fantasia técnica**: todo número desta página é medição (preço, rank,
tempo), e a tabela alinha em coluna (`font-variant-numeric: tabular-nums`).

Teto do display: `4.9rem`. Foi medido — acima disso a manchete empurrava o CTA para fora
da primeira tela, que numa página de venda é o defeito mais caro que existe.

## Movimento

**Um momento autoral, não efeitos espalhados.** Uma curva só no site inteiro:
`cubic-bezier(0.16, 1, 0.3, 1)` — saída exponencial, entrando de um estado que já era
visível.

A regra do mundo: **o valor faz SNAP, nunca tween. O que desliza é a câmera.**

- `.pipeline-cena` gruda por `400svh`; o scroll move a câmera, e o passo ativo troca sem
  transição. O passo anterior fica um degrau em `--glow-decay`, como o fósforo de verdade.
- A matriz acende célula por célula: ponteiro no desktop, e um pedido "chegando" a cada
  2,6s onde não há ponteiro.
- `[data-strike]` (home) e `[data-reveal]` (pricing/install) fazem a entrada. **Ambos
  entram de um estado legível** — animação nunca é pré-requisito de leitura.

`prefers-reduced-motion: reduce` desliga o sticky, deixa os quatro passos abertos e
estáticos, e acende uma célula fixa na matriz. Nada é escondido nesse caminho.

## Componentes

**Botão** — o único retângulo com borda do site, porque é controle, não moldura.
Inativo a fio; primário preenchido de cátodo com texto `--ground-deep`.

**Logo de jogo** — silhueta `filter: brightness(0) invert(1)` em repouso, arte de verdade
sob o ponteiro. Razão medida e herdada da página de preço: a maioria dos wordmarks vem em
**preto** (Fortnite e Valorant são literalmente `#000`) e sobre o fundo escuro eles somem.
A silhueta achata emblema preenchido (Brawl Stars vira um borrão), mas o nome do jogo fica
logo abaixo. Em `(hover: none)` o repouso já é o estado final — apagado demais deixaria a
prova dos onze jogos parecendo seção vazia.

**Escala do logo** — `marcaDoJogo()` em `pricing.js` normaliza por **área**, não por
altura: com a mesma altura, um wordmark largo ocupa 4,5× a área de um quadrado e o olho lê
"esse jogo é mais importante". Três contextos com áreas próprias: `plan-tab-logo` (950),
`jogo-logo-grande` (4200), e o padrão (2600).

**Os três planos** — três valores da mesma pilha: dois apagados, o de 30 dias **struck**.
"Best value" deixou de ser selo colado e virou o estado do próprio valor.

## Superfícies do navegador

Seleção, cursor, scrollbar e anel de foco são temas da paleta, não padrões do navegador.
É o sinal mais barato de que a página foi construída, e o que mais se esquece.

## O que este mundo não faz

- Não usa cartão de ícone+título+texto como estrutura de página.
- Não usa gradiente em texto: ênfase vem de peso, escala e **luz**.
- Não usa vidro/blur como decoração.
- Não usa borda lateral colorida (o `install.html` tinha uma; saiu).
- Não inventa métrica, contagem de cliente nem review. Ver `PRODUCT.md`.

## Armadilhas deste código

- **`styles.css` é compartilhado pelas três páginas.** Mexer nos tokens quebra
  `/pricing` e `/download` junto — foi o que aconteceu no meio deste redesenho.
- **Os links são contrato.** Os onze botões WEBSITE publicados no Discord apontam para
  `firstbid.xyz/#pricing-<jogo>`, e o script no `<head>` do `index.html` os redireciona
  para `/pricing`. Remover isso mata onze botões já publicados que não dá para reeditar.
- **`admin.html` não vai para o deploy** (`.vercelignore`). Já esteve aberto na internet.
- Os números da matriz e o pedido do hero são **exemplo**, e a página diz isso na tela
  ("Example order · you set every number"). Não são preço do FirstBid nem de ninguém.
