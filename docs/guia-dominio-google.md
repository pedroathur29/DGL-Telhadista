# Guia: domínio próprio, Google Search Console e Perfil da Empresa no Google

Site da DGL Telhadista e Serviços Gerais. Situação de novembro de 2026.

## Situação atual

| Item | Situação |
|---|---|
| Hospedagem | GitHub Pages, de graça, com HTTPS automático |
| Endereço | https://pedroathur29.github.io/DGL-Telhadista/ |
| Código | Repositório `pedroathur29/DGL-Telhadista` (branch `main`, pasta raiz) |
| Tamanho | Cerca de 11 MB, bem abaixo do limite de 1 GB do GitHub Pages |
| Servidor e banco de dados | Não existem. O formulário só monta uma mensagem e abre o WhatsApp; nenhum dado sai do celular de quem preenche. |
| Domínio próprio | Ainda não tem |
| Search Console | Ainda não tem |
| Perfil da Empresa no Google | Ainda não tem |

Cada etapa abaixo diz quem faz:
- **Dono:** o dono da DGL.
- **Pedro:** quem cuida do site.
- **Claude:** as alterações no código do site.

Ordem recomendada:
1. Perfil da Empresa no Google. É o que mais traz clientes para um serviço local e não depende de nada.
2. Domínio próprio, se o dono quiser.
3. Search Console, de preferência já com o domínio, para não ter que verificar duas vezes.

---

## 1. Perfil da Empresa no Google (antigo Google Meu Negócio)

**O que é:** o cartão que aparece na busca e no Maps com o nome da empresa, telefone, fotos, avaliações e o botão do site. É de graça.

**Quem faz:** o dono, com a conta Google dele. O perfil precisa ser da empresa, e não de quem faz o site. Depois ele adiciona o Pedro como administrador para ajudar.

**Passo a passo**
1. O dono entra em https://business.google.com com a conta Google que vai ser da empresa. Pode ser a do e-mail DGLtelhadista@gmail.com.
2. Clica em adicionar empresa e escreve o nome exatamente como é: **DGL Telhadista e Serviços Gerais**. Não pode acrescentar palavras como "melhor telhadista da região", porque o Google pode suspender o perfil.
3. Escolhe a categoria principal. Procure por "telhado" e escolha a mais próxima, por exemplo "Empreiteiro de telhados". Outras categorias podem ser acrescentadas depois.
4. Quando o Google perguntar se há um local que os clientes podem visitar, responder **Não**. Assim a empresa fica cadastrada como prestadora de serviço no local do cliente, sem mostrar endereço. Como a DGL não tem endereço comercial, este é o caminho certo.
   - O Google ainda pode pedir um endereço para uso interno, que fica oculto. Se pedir, o dono informa um endereço onde receba correspondência.
5. Escolhe as áreas atendidas: Santa Bárbara d'Oeste e as cidades vizinhas onde ele realmente trabalha, como Americana, Nova Odessa, Piracicaba e Limeira. Só as que ele confirmar.
6. Informa o telefone (19) 99310-1979 e o site. Por enquanto o site é o endereço do GitHub; se depois houver domínio próprio, troca.
7. **Verificação.** O Google escolhe o método, que pode mudar de uma empresa para outra:
   - **Vídeo**, o mais comum hoje: um vídeo curto e contínuo, feito com o celular, mostrando a cidade ou a rua, as ferramentas ou o veículo com a marca, e uma prova de que ele é o responsável, como um documento da empresa ou o acesso ao painel. Não pode ser editado.
   - Outros métodos possíveis: ligação ou SMS, e-mail, ou carta pelo correio.
   - A análise pode levar de alguns dias a algumas semanas.
8. Com o perfil aprovado, completar:
   - horário de atendimento;
   - descrição de até 750 caracteres, que pode ser o texto da seção "Sobre a DGL" do site;
   - serviços: construção de telhados, manutenção preventiva e corretiva, reformas, pergolados e serviços de construção civil;
   - fotos: as mesmas fotos de obras do site, só as de pessoas que autorizaram.
9. Em configurações, no item de pessoas e acesso, convidar o e-mail do Pedro como administrador. Assim ninguém precisa compartilhar senha.
10. Avaliações: no painel há um botão para pedir avaliações, que gera um link. O dono manda esse link para clientes de obras já terminadas.
    - Não pode comprar avaliações, avaliar a si mesmo nem oferecer desconto em troca; o Google remove e pode punir o perfil.
    - Responder todas as avaliações, inclusive as negativas, com educação.

**Comigo:** quando o perfil existir, posso colocar no site um botão "Ver avaliações no Google" com o link do perfil e incluir esse link nos dados que o Google lê do site (campo `sameAs`). Não vou copiar as avaliações para dentro do site.

---

## 2. Domínio próprio (ex.: dgltelhadista.com.br)

**O que é:** o endereço do site. Hoje é `pedroathur29.github.io/DGL-Telhadista`. Com domínio, passa a ser algo como `dgltelhadista.com.br`. A hospedagem pode continuar no GitHub Pages, de graça.

**Quanto custa:** cerca de R$ 40 por ano no Registro.br, que é a entidade oficial dos domínios .com.br. Existe desconto para pagar vários anos de uma vez. É o único custo.

**Quem faz:** o dono registra, ou o Pedro registra junto com ele, **no CNPJ da DGL** (32.770.448/0001-91). Assim o domínio é da empresa e não depende de uma pessoa. O Pedro e o Claude configuram o resto.

**Passo a passo**
1. **Escolher o nome** (Dono e Pedro). Curto, fácil de falar no telefone, sem hífen se possível. Exemplos para checar se estão livres: `dgltelhadista.com.br`, `dgltelhados.com.br`. A busca é feita em https://registro.br.
2. **Registrar** (Dono). Criar a conta no Registro.br com o CNPJ e um e-mail que ele use de verdade, porque os avisos de renovação vão para esse e-mail. Depois pagar com PIX, boleto ou cartão.
3. **Proteger a conta do Registro.br** (Dono):
   - ativar a verificação em duas etapas;
   - deixar a renovação lembrada, e se possível pagar alguns anos de uma vez;
   - se o domínio vencer, o site sai do ar e outra pessoa pode registrar o nome.
4. **Proteger o domínio no GitHub** (Pedro). Em GitHub, Settings da conta, Pages, adicionar e verificar o domínio. O GitHub mostra um registro TXT para colocar no DNS. Isso impede que outra conta do GitHub use o domínio.
5. **Apontar o domínio para o site** (Pedro, com o Claude ajudando). No Registro.br, deixar o DNS com os servidores do próprio Registro.br, que é de graça, e criar estes registros:

   | Tipo | Nome | Valor |
   |---|---|---|
   | A | (vazio, o próprio domínio) | 185.199.108.153 |
   | A | (vazio) | 185.199.109.153 |
   | A | (vazio) | 185.199.110.153 |
   | A | (vazio) | 185.199.111.153 |
   | AAAA | (vazio) | 2606:50c0:8000::153 |
   | AAAA | (vazio) | 2606:50c0:8001::153 |
   | AAAA | (vazio) | 2606:50c0:8002::153 |
   | AAAA | (vazio) | 2606:50c0:8003::153 |
   | CNAME | www | pedroathur29.github.io |

   Confira esses valores na página oficial antes de usar: https://docs.github.com/pt/pages/configuring-a-custom-domain-for-your-github-pages-site

6. **Ligar o domínio no repositório** (Pedro). No repositório, Settings, Pages, Custom domain: escrever o domínio e salvar. O GitHub cria um arquivo `CNAME` no repositório.
   - O DNS pode levar de alguns minutos a 48 horas para funcionar.
   - Quando o certificado sair, marcar **Enforce HTTPS** para o site abrir sempre com o cadeado.
7. **Atualizar o site** (Claude). Troco o endereço antigo pelo novo em:
   - `canonical`, Open Graph (`og:url`, `og:image`) e os dados que o Google lê (JSON-LD);
   - `sitemap.xml`;
   - e crio um `robots.txt` apontando para o sitemap.

   Depois disso, o endereço antigo do GitHub passa a redirecionar para o novo sozinho.
8. **E-mail com o domínio** (opcional): algo como `contato@dgltelhadista.com.br`. Isso é pago à parte, por exemplo com Google Workspace ou Zoho. O Gmail atual funciona bem, então não é necessário.

**Sobre a hospedagem**
- O GitHub Pages tem limite de 1 GB de site e uma referência de 100 GB de tráfego por mês. O site da DGL usa cerca de 11 MB, então está muito longe desse limite.
- As regras do GitHub dizem que o Pages não deve ser usado como hospedagem para loja virtual ou sistemas com pagamentos e senhas. Um site de apresentação com WhatsApp, como o da DGL, não faz nada disso.
- Se um dia o dono preferir, o mesmo site pode ir para o Cloudflare Pages ou o Netlify, que também são gratuitos, sem mudar o código. Só mudam os registros de DNS.
- O plano gratuito da Vercel (Hobby) é para uso pessoal e não comercial, então não serve para a empresa.

---

## 3. Google Search Console

**O que é:** um painel gratuito do Google que mostra:
- se o site foi encontrado e indexado;
- por quais buscas ele aparece, quantas vezes e quantos cliques recebe;
- erros, como página que não abre ou problema no celular.

Ele não faz o site subir na busca sozinho. Serve para acompanhar e corrigir.

**Quem faz:** o Pedro, de preferência usando a conta Google da empresa e adicionando a própria conta como usuário. Assim, se o Pedro sair, a empresa continua com o acesso.

**Passo a passo, com domínio próprio (recomendado)**
1. Entrar em https://search.google.com/search-console e adicionar uma propriedade do tipo **Domínio**, escrevendo o domínio sem `https://`.
2. O Google mostra um registro **TXT**. Colar esse registro no DNS do Registro.br, do mesmo jeito do passo 5 do domínio, e clicar em verificar. Pode levar algumas horas para funcionar.
3. No menu Sitemaps, enviar `sitemap.xml`.
4. Na ferramenta Inspeção de URL, colar o endereço da página inicial e pedir indexação.
5. Em configurações, no item de usuários e permissões, adicionar a outra conta (a do Pedro ou a da empresa) como proprietária.

**Sem domínio próprio, se quiser começar já**
1. Adicionar uma propriedade do tipo **Prefixo do URL** com `https://pedroathur29.github.io/DGL-Telhadista/`.
2. Escolher a verificação por **tag HTML**. O Google mostra uma linha `<meta name="google-site-verification" ...>`. Mandar essa linha para o Claude, que coloca no site. Depois clicar em verificar.
3. Enviar o sitemap e pedir indexação, como acima.
4. Desvantagem: se depois mudar para domínio próprio, é preciso criar outra propriedade e o histórico recomeça.

**Comigo:** colocar a tag de verificação, o `robots.txt` e o sitemap atualizado, e depois ajudar a ler os relatórios.

---

## 4. Segurança e acessos

| Conta | O que proteger |
|---|---|
| GitHub (do Pedro) | Verificação em duas etapas ligada. É ela que controla o site. |
| Google da empresa | Verificação em duas etapas e um telefone de recuperação do dono. Dá acesso ao Perfil da Empresa e ao Search Console. |
| Registro.br | Verificação em duas etapas, e-mail de contato que o dono leia, renovação em dia. |

- **Nunca compartilhar senha.** O Perfil da Empresa, o Search Console e o GitHub têm convite de usuário; usar sempre o convite.
- **Quem é dono do quê:** o domínio, o perfil no Google e o Search Console devem ficar em nome da DGL. O repositório hoje está na conta do Pedro. Se um dia o dono quiser, dá para transferir o repositório para uma conta da DGL, e o site continua igual.
- **HTTPS:** o GitHub Pages já usa. Com domínio próprio, marcar "Enforce HTTPS".
- **Dados de clientes:** o site não guarda nada. O nome, o telefone e a mensagem vão direto para o WhatsApp da DGL, e o aviso de privacidade no formulário diz isso. Se um dia entrar uma ferramenta de estatísticas de visitas, a preferência é por uma que não use cookies (por exemplo GoatCounter ou Cloudflare Web Analytics), para não precisar de aviso de cookies.
- **Fotos:** usar só fotos de pessoas que autorizaram. As fotos do site já estão sem a localização GPS do celular, e os números das casas foram borrados.

---

## Resumo: o que cada um faz

| Etapa | Dono | Pedro | Claude |
|---|---|---|---|
| Perfil da Empresa | Cria, verifica, responde avaliações | Recebe convite, ajuda a completar | Põe o link do perfil no site |
| Domínio | Registra no CNPJ e paga | Configura DNS e GitHub | Atualiza endereços, sitemap e robots.txt |
| Search Console | (opcional) Dono da conta | Cria e acompanha | Põe a tag e ajuda a ler os relatórios |
| Segurança | Duas etapas no Google e no Registro.br | Duas etapas no GitHub | Mantém o site sem coleta de dados |

## Pendências do site que dependem do dono
- Respostas para o FAQ sobre orçamento (se é grátis), visita, garantia, formas de pagamento e prazos.
- Confirmar que as pessoas que aparecem nas fotos autorizam.
- Decidir se quer domínio próprio.
