# DGL Telhadista e Serviços Gerais

Site de uma página, estático e feito do zero, sem framework e sem servidor.

## O que tem
- **Telhado em 3D (Three.js)**: uma casa com telhado de telhas coloniais com espessura de verdade (capa e canal), cumeeira, madeiramento, testeira, calha, reboco, janelas, muro, grama e árvores procedurais. O cenário tem céu de fim de tarde, sombras suaves, oclusão de ambiente e antisserrilhado.
- **Os serviços contados na rolagem**: o telhado é montado (Construção), algumas telhas sobem e voltam novas (Manutenção) e uma onda troca o telhado velho por um novo (Reformas).
- **Animações (GSAP + ScrollTrigger + SplitText, rolagem suave com Lenis)**: entrada do título, palavras que acendem na rolagem, faixas que correm, imagens que se abrem, menu do celular em círculo, acordeão do FAQ e prévia ao vivo da mensagem de WhatsApp.
- **Galeria**: 25 fotos de obras com filtro por tipo e "ver mais". Sem JavaScript, todas as fotos aparecem.
- **Orçamento**: o formulário só monta a mensagem e abre o WhatsApp. Nenhum dado é guardado ou enviado pelo site, e a mensagem só chega à DGL quando a pessoa toca em enviar no WhatsApp.
- **Acessibilidade**: HTML semântico, link para pular ao conteúdo, foco visível, erros do formulário ligados a cada campo e anunciados, menu com foco preso e Esc. Com `prefers-reduced-motion` o site vira uma versão estática.
- **Desempenho**: o 3D carrega depois da página, com uma imagem de reserva enquanto isso.
  - **Qualidade adaptativa (`js/src/quality.js`):** um só lugar com a tabela de níveis, a detecção do aparelho e o ajuste em tempo real. Três faixas, com dois degraus cada: **alta** (0 completo; 1 efeitos com a oclusão em meia resolução), **média** (2 sem pós-processamento; 3 resolução 1x, sombra 1024 e metade da grama) e **baixa** (4 texturas leves, resolução 0,75x, um quarto da grama e sombra com filtro simples; 5 resolução 0,6x, sem grama solta e sombra 512). Do 3 em diante, com as telhas em movimento a sombra é refeita a cada 3 quadros; da média em diante o cabeçalho e os cartões sobre o 3D não desfocam o fundo. O céu é desenhado uma vez num cubo e vira o fundo, e os shaders são preparados antes do primeiro quadro sem travar a página. O telhado, a casa, as árvores e as animações são os mesmos em todos.
  - **Detecção e ajuste:** antes de baixar a cena, uma pontuação soma núcleos, memória, recursos do WebGL (versão, tamanho máximo de textura), classe da placa, pixels da tela e se é celular (sem dado, vale zero); economia de dados vai direto para o 5; sem placa de vídeo (desenho pelo processador, como em máquinas virtuais e no PageSpeed) o site mostra as imagens da casa no lugar do 3D, e no celular o mínimo é o 2. A faixa baixa já baixa as texturas leves (metade da resolução, ~70% menos dados). Em uso, desce rápido se mais da metade de 40 quadros ficar abaixo de 30 por segundo (dois degraus se abaixo de 20); sobe um degrau por vez só depois de 3 períodos seguidos de rolagem com folga e 8 s sem troca, sem criar o pós-processamento num aparelho que começou sem ele. O degrau que subiu fica 15 s em teste: se cair abaixo de ~50 quadros por segundo, volta e fica bloqueado; depois de dois bloqueios, não sobe mais.
  - **Parado e fora da tela:** sem rolar nem mexer o mouse, abaixo do nível 0 a cena desenha 30 quadros por segundo; na faixa baixa fica sempre em 30. Fora da tela ou com a aba em segundo plano, não desenha. Com `prefers-reduced-motion`, o 3D não é carregado e ficam as imagens.
  - **Cena:** as matrizes da cena são calculadas uma vez, e não a cada quadro. As telhas só recalculam o que mudou: a posição na montagem e na manutenção, e a cor na reforma. A sombra não é refeita quando só a cor muda. As árvores ao longe são instâncias.
  - **Página:** as faixas que correm e as animações em CSS que repetem sem parar ficam paradas fora da tela.

## Estrutura
- `index.html`, `css/style.css`
- `js/app.js` (página e animações) e `js/scene.js` (cena 3D) são arquivos gerados.
- `js/tex/` também é gerada: são as texturas da cena em WebP, com o hash no nome do arquivo.
- As fontes ficam em `js/src/`:
  - `app.js`: animações e interações
  - `roof-scene.js`: a cena 3D
  - `scene-entry.js`: ponto de entrada do `js/scene.js`
  - `textures/`: texturas geradas a partir do `roof-scene.js` e salvas em WebP
  - `vendor/ez-tree/`: gerador de árvores ez-tree (MIT, Daniel Greenheck), reduzido às texturas de carvalho (casca: Poly Haven, CC0) e às folhas de carvalho e freixo
- `assets/logo.svg` e `assets/favicon.svg`: logo da DGL em vetor
- `assets/img/obra-*.webp`: 25 fotos de obras enviadas pela DGL
- `assets/img/` (demais): ilustrações renderizadas a partir da mesma cena 3D
- As imagens estão em WebP com duas larguras, e o navegador escolhe a menor que serve para a tela.
- Fonte Archivo (licença OFL), embutida no CSS
- `docs/`: guias para o cliente
- `scripts/csp-hash.sh`: confere se a política de segurança bate com o script inline do `index.html`

## Como gerar os arquivos
Precisa do Node.js 18 ou mais novo. As versões ficam travadas no `package-lock.json`.
```
npm ci          # instala exatamente as versões do lockfile
npm run build   # gera js/app.js, js/scene.js e js/tex/
npm run check   # confere a CSP e roda npm audit nas dependências usadas pelo site
```
O build é reproduzível: rodar `npm ci && npm run build` numa cópia limpa gera arquivos idênticos aos do repositório.

Para testar localmente, sirva a pasta por HTTP, por exemplo com `python3 -m http.server`, e abra `http://localhost:8000`. Abrir o arquivo direto, com `file://`, não carrega as texturas.

Opções na URL para testes:
- `?sem3d`: sem a cena 3D
- `?qualidade=alta`, `media` ou `baixa` (níveis 0, 2 e 4), ou `?qualidade=0` a `5`: força um nível e desliga o ajuste automático
- `?fps`: mostra quadros por segundo, o nível e a faixa em uso
- `?animar`: animações mesmo com movimento reduzido no sistema
- `?debug`: expõe a cena no console

## Publicação e segurança
- **GitHub Pages**: branch `main`, pasta raiz, sem GitHub Actions. A hospedagem não roda build, então os arquivos gerados vão no repositório.
- **HTTPS**: o GitHub Pages serve o site por HTTPS. Em Settings → Pages, deixe marcado **Enforce HTTPS**.
- **Cabeçalhos**: o GitHub Pages não permite configurar cabeçalhos HTTP. Por isso a `Content-Security-Policy` e a `Referrer-Policy` estão em `<meta>` no `index.html`.
  - Só são permitidos scripts do próprio site e o script inline do `<head>`, identificado pelo hash `sha256`.
  - Não há atributos `onerror` nem `onclick`.
  - Se mudar o script inline do `<head>`, rode `sh scripts/csp-hash.sh` e atualize o hash na CSP.
- **Cache**: troque o `?v=` do CSS e do `js/app.js` no `index.html` a cada publicação para o navegador não usar a versão antiga. O `js/scene.js` usa o mesmo número automaticamente.
- **Dados**: o site não tem segredos nem chaves. O histórico do Git foi verificado. Telefone, e-mail e CNPJ são os dados públicos da empresa, passados pela DGL.
- **Fotos**: as fotos estão sem metadados (incluindo GPS), conferido arquivo por arquivo e também nas versões antigas do histórico. Os números de casa estão borrados.

## Pendências do cliente
- O FAQ não fala de preço, visita, garantia, pagamento nem prazos: a DGL combina isso direto pelo WhatsApp, e o site diz isso.
- Cidades: o site diz "Santa Bárbara d'Oeste e região", sem lista de cidades, por decisão da DGL.
- Fotos: não aparece ninguém nelas, e a DGL dispensou legendas por obra.
- Opcional: domínio próprio, Google Search Console e Perfil da Empresa no Google. Passo a passo em [docs/guia-dominio-google.md](docs/guia-dominio-google.md).
- Hospedagem no Cloudflare Pages e domínio: [docs/guia-hospedagem-cloudflare.md](docs/guia-hospedagem-cloudflare.md).

A DGL não tem Instagram nem endereço comercial, então o site não tem link de Instagram nem mapa.
