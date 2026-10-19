# Shopify: analytics, consentimento e vídeos de produto

## Resumo

O site é uma storefront própria em React/Vite. Ele consulta produtos e cria
carrinhos com a Storefront API da Shopify, e depois redireciona o cliente para o
checkout hospedado pela Shopify.

O Shopify oferece recursos para analytics e consentimento em lojas headless. O
repositório, porém, não tinha eventos de analytics enviados à Shopify nem uma
integração explícita da Customer Privacy API. O Vercel Speed Insights presente
no site mede desempenho e não substitui os relatórios de sessões e vendas da
Shopify.

A galeria de produto consultava apenas imagens. Esta alteração passa a consultar
a mídia de produto da Shopify e exibir imagens, vídeos hospedados pela Shopify e
vídeos externos compatíveis.

## O que foi alterado

- A consulta de detalhe do produto agora solicita a conexão `media` da
  Storefront API.
- O formatador converte mídia de imagem, vídeo e vídeo externo em estruturas
  que a interface consegue renderizar.
- A galeria do produto reproduz vídeos hospedados pela Shopify com controles do
  navegador; vídeos externos usam o endereço de incorporação fornecido pela
  Shopify.
- A navegação por miniaturas, setas e imagens associadas a variantes continua
  funcionando. Se a API não retornar mídia nova, a galeria usa a lista de
  imagens que já existia.
- Não foram alteradas credenciais, configurações do Admin, pixels publicados ou
  dados da loja.

Para ver vídeos na galeria, o produto precisa ter o vídeo cadastrado em **Shopify
Admin > Products > produto > Media**. Os vídeos promocionais que já estão em
`public/Videos/` são assets separados e não são automaticamente vídeos de
produto.

## O que a Shopify oferece para analytics

A Shopify documenta analytics para storefronts headless, incluindo os utilitários
`sendShopifyAnalytics` e `useShopifyCookies` do pacote
`@shopify/hydrogen-react`, que já é uma dependência deste projeto. A Shopify
também oferece a Customer Privacy API e o banner de cookies nativo. A coleta de
analytics deve respeitar as decisões de consentimento e as regiões configuradas
no Admin.

Esses recursos não cobram uma tarifa por evento enviada pela API. Continuam
valendo o custo do plano Shopify e quaisquer custos de apps ou serviços de
terceiros escolhidos pela loja. O trabalho de configurar, testar e manter a
integração pode ser cobrado como serviço de desenvolvimento; não é necessário
criar um app pago para começar a investigar o problema.

## Por que os pedidos podem não aparecer ligados a sessões

O fluxo de checkout existe, mas isso por si só não confirma que a atribuição está
funcionando. Para uma storefront customizada, confira no Admin e no ambiente de
deploy:

1. **Canal Headless e storefront:** confirme que a storefront foi criada e
   gerenciada pelo canal Headless da Shopify e que o token usado no site pertence
   a essa storefront. A documentação da Shopify informa que o token de outro
   canal pode não alimentar os relatórios de analytics da storefront headless.
2. **Identificador da storefront:** confirme o identificador de storefront
   gerado pelo canal e que a build em produção o utiliza.
3. **Domínios e cookies:** o domínio da storefront e o domínio do checkout
   precisam permitir que os cookies de analytics/consentimento sejam
   compartilhados. A documentação alerta que checkout em uma raiz de domínio
   diferente da storefront não consegue honrar o consentimento e os cookies da
   storefront como esperado.
4. **Consentimento:** confira **Settings > Customer privacy** e se o banner está
   habilitado/configurado para as regiões relevantes. Sem consentimento em uma
   região que o exige, os eventos de analytics não devem ser enviados.
5. **Pixels:** confira **Settings > Customer events** para saber quais pixels
   estão publicados, se algum pixel de app está ativo e se ele está recebendo
   eventos de checkout.
6. **Teste real:** abra a loja em uma janela limpa, percorra página inicial,
   produto e checkout, registre a escolha de consentimento e confira Shopify Live
   View e as requisições de analytics no navegador. Depois compare com um pedido
   de teste. A ausência no painel não identifica sozinha qual etapa falhou.

Este checkout é montado por `cartCreate` na Storefront API e a página navega para
a `checkoutUrl` retornada pela Shopify. O comportamento de checkout e a
atribuição final também dependem das configurações do Admin, do domínio público
real e do canal/tokens ativos — itens que este repositório não consegue
confirmar.

## Por que analytics não foi ativado por esta alteração

O pixel, o banner e as permissões de analytics precisam corresponder à
configuração da loja e aos domínios de produção. Não é seguro presumir esses
valores a partir do clone local, e ligar um pixel sem consentimento ou com o
domínio incorreto pode deixar o rastreamento inconsistente. Por isso, esta
alteração não envia eventos novos à Shopify e não muda pixels ou consentimento.

Depois de confirmar os itens acima no Admin, a integração pode ser implementada
com os helpers oficiais de Hydrogen React e a Customer Privacy API, sem
desinstalar o app `frontendBTWO` nem substituir credenciais. O identificador do
app e seu criador precisam ser confirmados no Shopify Admin; não há prova disso
no código local.

## Resposta sugerida ao cliente

> I built the custom storefront and its Shopify integration. I confirmed that
> the site creates carts through Shopify and redirects customers to Shopify
> checkout. The product gallery previously supported images only; it now also
> supports Shopify-hosted and external product videos. Shopify provides
> headless analytics and consent APIs, but I still need to verify the Headless
> storefront token, storefront ID, customer privacy settings, published pixels,
> and production/checkout domains in Shopify Admin before enabling tracking. I
> won't uninstall the app or change live credentials.

## Referências oficiais

- [Shopify Customer Privacy API](https://shopify.dev/docs/api/customer-privacy)
- [Shopify Web Pixels API](https://shopify.dev/docs/api/web-pixels-api)
- [Shopify analytics com Hydrogen](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/analytics)
- [Validação e troubleshooting de analytics headless](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/analytics/validation)
- [sendShopifyAnalytics (Hydrogen React)](https://shopify.dev/docs/api/hydrogen-react/latest/utilities/sendshopifyanalytics)
- [useShopifyCookies (Hydrogen React)](https://shopify.dev/docs/api/hydrogen-react/latest/hooks/useshopifycookies)
- [Objeto Video da Storefront API](https://shopify.dev/docs/api/storefront/latest/objects/Video)
- [Objeto ExternalVideo da Storefront API](https://shopify.dev/docs/api/storefront/latest/objects/ExternalVideo)
