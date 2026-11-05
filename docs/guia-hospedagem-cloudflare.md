# Guia: hospedagem no Cloudflare Pages e domínio .com.br

Substitui os passos 4 a 6 da seção "Domínio próprio" do [guia anterior](guia-dominio-google.md). O resto daquele guia (Perfil da Empresa e Search Console) continua valendo.

## Por que mudar do GitHub Pages
- O GitHub Pages não deixa configurar cabeçalhos de segurança. O Cloudflare Pages deixa, com o arquivo `_headers`.
- É gratuito, inclusive para uso comercial, e tem HTTPS automático.
- O site é o mesmo: os arquivos que estão no repositório são publicados como estão. Não há build na hospedagem.

## Quem faz o quê
| Tarefa | Quem |
|---|---|
| Registrar o domínio no Registro.br | Dono (conta no CNPJ da DGL) |
| Criar a conta no Cloudflare | Dono, com o e-mail da DGL |
| Conectar o repositório ao Cloudflare | Pedro, com o Claude guiando |
| Arquivos de configuração e troca dos endereços no site | Claude |

Conta do Registro.br, conta do Cloudflare e o domínio ficam no nome da DGL. Quem desenvolve é convidado, não dono.

## Parte 1: Registro.br (dono)
1. Em https://registro.br, procurar o nome. Ter dois nomes prontos, caso o primeiro esteja ocupado.
2. Criar a conta com o **CNPJ da DGL** e um e-mail que o dono usa de verdade. Os avisos de renovação vão para ele.
3. Registrar o domínio e pagar (PIX, boleto ou cartão, cerca de R$ 40 por ano). Se puder, pagar alguns anos de uma vez.
4. Ativar a verificação em duas etapas na conta do Registro.br. Se o domínio vencer, o site sai do ar.

## Parte 2: Cloudflare (dono ou Pedro, com a conta da DGL)
1. Criar a conta em https://dash.cloudflare.com com o e-mail da DGL e ativar a verificação em duas etapas.
2. Adicionar o domínio: **Add a site**, escrever o domínio, escolher o plano **Free**.
3. O Cloudflare mostra **dois servidores de nome** (algo como `xxx.ns.cloudflare.com`). Anotar os dois.

## Parte 3: apontar o domínio para o Cloudflare (Registro.br)
1. No painel do Registro.br, abrir o domínio e escolher **Alterar servidores DNS**.
2. Trocar pelos dois servidores do Cloudflare e salvar.
3. Voltar ao Cloudflare e esperar o status virar **Active**. Leva de alguns minutos a 2 dias, mas costuma ser rápido.

Isso é necessário porque o endereço sem `www` (`dgltelhadista.com.br`) só funciona no Cloudflare Pages com o DNS no próprio Cloudflare.

## Parte 4: publicar o site (Pedro)
1. No Cloudflare: **Workers & Pages**, **Create**, **Pages**, **Connect to Git**.
2. Autorizar o GitHub e escolher só o repositório do site. Dar acesso só a ele.
3. Configuração:
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** deixar vazio
   - **Build output directory:** `/`
4. Salvar e implantar. O site abre em um endereço de teste `nome-do-projeto.pages.dev`. Esse é o endereço para a primeira análise do GPT.
5. A partir daí, cada commit na `main` publica sozinho em cerca de um minuto.

Os nomes dos menus podem mudar. Se algum não bater, a lógica é a mesma: conectar o repositório, sem build, publicando a raiz.

## Parte 5: ligar o domínio ao site (Pedro)
1. No projeto do Cloudflare Pages: **Custom domains**, **Set up a custom domain**.
2. Escrever o domínio (`dgltelhadista.com.br`) e confirmar. Como o DNS já está no Cloudflare, ele cria os registros sozinho.
3. Repetir com `www.dgltelhadista.com.br`.
4. Criar uma regra para `www` redirecionar ao endereço sem `www` (**Rules**, **Redirect Rules**).
5. Esperar o certificado ficar ativo. O site passa a abrir com cadeado.

## Parte 6: depois que o domínio abrir
1. Claude troca o endereço antigo pelo novo no site (canonical, Open Graph, dados estruturados, `sitemap.xml`, `robots.txt`).
2. Conferir os cabeçalhos em https://securityheaders.com.
3. Desligar o GitHub Pages no repositório (**Settings**, **Pages**, desativar). Isso evita duas cópias do site no Google. O endereço antigo deixa de funcionar, então quem tem o link precisa do novo.
4. Fazer o Search Console e o Perfil da Empresa (guia anterior), agora com o domínio novo.

## Segurança
- Verificação em duas etapas no Registro.br, no Cloudflare e no GitHub.
- Todas as contas com o e-mail da DGL, nunca o de quem desenvolve.
- O site não tem senhas, chaves nem backend. O que foi enviado ao repositório é só o que já é público.
- Opcional depois: ativar o DNSSEC no Cloudflare e colocar o registro DS no Registro.br.

## Se algo der errado
- O GitHub Pages continua no ar até a Parte 6, passo 3. Se o domínio novo falhar, o site antigo segue funcionando.
- Se o domínio não ficar **Active**, conferir se os dois servidores de nome no Registro.br são exatamente os do Cloudflare.
