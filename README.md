# DGL Telhadista e Serviços em Gerais

Site de uma página, feito do zero (sem Bootstrap). Basta abrir o `index.html`: tudo está embutido e funciona sem servidor.

## O que tem
- **Telhado em 3D (Three.js)**: uma casa com telhado de telhas coloniais com espessura de verdade (capa e canal),
  cumeeira, madeiramento, testeira, calha e tubos de descida, reboco, caixilhos com vidro que reflete o céu,
  cortinas e luz acesa por dentro, arandela, vasos, calçada, muro com portão, grama que balança e árvores
  procedurais com folhas ao vento. Céu físico de fim de tarde, sombras suaves, oclusão de ambiente (GTAO),
  brilho leve e antisserrilhado.
- **A história dos serviços na rolagem**: as telhas saem voando de um palete no chão até o lugar delas
  (Construção), algumas sobem e voltam novas (Manutenção) e uma onda troca o telhado velho por um novo (Reformas).
- **Animações (GSAP + ScrollTrigger + SplitText, rolagem suave com Lenis)**: tela de carregamento, títulos
  letra a letra, palavras que acendem na rolagem, faixas que correm conforme a velocidade da rolagem, valores em
  rolagem lateral, imagens que se abrem, paralaxe, cartões que inclinam, botões magnéticos com preenchimento,
  cursor próprio, menu do celular em círculo, acordeão com altura animada e prévia ao vivo da mensagem de WhatsApp.
- **Acessibilidade**: HTML semântico, foco visível, `aria-*`, menu com foco preso e Esc, e com
  `prefers-reduced-motion` o site vira uma versão estática com as ilustrações.
- **Desempenho**: qualidade máxima no computador, versão mais leve no celular e redução automática de efeitos
  se o aparelho não sustentar a cena.

## Estrutura
- `index.html`, `css/style.css`
- `js/app.js`: arquivo final (gerado). As fontes estão em `js/src/`:
  - `app.js`: animações e interações
  - `roof-scene.js`: a cena 3D
  - `textures/`: texturas geradas pelo próprio `roof-scene.js` e salvas em WebP
  - `vendor/ez-tree/`: gerador de árvores ez-tree (MIT, Daniel Greenheck), reduzido às texturas de carvalho
    (casca: Poly Haven, CC0) e folhas de carvalho e freixo
- `assets/logo.svg`: logo da DGL em vetor (azul #0147af e vermelho #fa1b1b), usada no cabeçalho, no carregamento, no rodapé e no ícone da aba (`assets/favicon.svg`)
- `assets/img/`: ilustrações 3D renderizadas a partir da mesma cena (fictícias)
- `assets/fonts/`: Bricolage Grotesque (licença OFL), a única fonte do site

Para gerar o `js/app.js` de novo depois de mexer em `js/src/`:
```
npm install
npm run build
```

## Publicar na Vercel
Importe o repositório em vercel.com/new, deixe "Framework Preset" em **Other** e clique em **Deploy**. O `vercel.json` já configura o cache das imagens.

Bibliotecas: Three.js (MIT), GSAP (licença padrão gratuita da GreenSock), Lenis (MIT), ez-tree (MIT).

## Pendências do cliente
- Endereço (pergunta "Onde fica a DGL?" e rodapé)
- Links do Instagram e do Facebook (rodapé)
- Fotos reais das obras, se quiser substituir as ilustrações
