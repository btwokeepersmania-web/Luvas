export const formatProduct = (node) => ({
  id: node.id,
  title: node.title,
  handle: node.handle,
  description: node.description,
  descriptionHtml: node.descriptionHtml,
  productType: node.productType,
  metafields: node.metafields,
  images: Array.isArray(node.images?.edges)
    ? node.images.edges.map(({ node: imageNode }) => ({
        id: imageNode?.id,
        url: imageNode?.url,
        thumbnailUrl: imageNode?.thumbnail ?? imageNode?.url,
        altText: imageNode?.altText,
      }))
    : [],
  options: node.options.map(option => ({
    id: option.id,
    name: option.name,
    values: option.values,
  })),
  variants: Array.isArray(node.variants?.edges) ? node.variants.edges.map(({ node: variantNode }) => ({
    id: variantNode?.id,
    title: variantNode?.title,
    availableForSale: Boolean(variantNode?.availableForSale),
    quantityAvailable: variantNode?.quantityAvailable ?? 0,
    price: variantNode?.price?.amount ?? null,
    currency: variantNode?.price?.currencyCode ?? null,
    compareAtPrice: variantNode?.compareAtPrice?.amount ?? null,
    image: variantNode?.image ? { id: variantNode.image.id, url: variantNode.image.url, altText: variantNode.image.altText } : null,
    selectedOptions: Array.isArray(variantNode?.selectedOptions) ? variantNode.selectedOptions.map(option => ({ name: option.name, value: option.value })) : [],
  })) : [],
  price: node.variants?.edges?.[0]?.node?.price?.amount ?? '0',
  compareAtPrice: node.variants?.edges?.[0]?.node?.compareAtPrice?.amount ?? null,
  currency: node.variants?.edges?.[0]?.node?.price?.currencyCode || 'BRL',
  variantId: node.variants?.edges?.[0]?.node?.id ?? null,
});

export const formatProducts = (edges) => {
  return edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    productType: node.productType,
    images: Array.isArray(node.images?.edges)
      ? node.images.edges.map(({ node: imageNode }) => ({
          id: imageNode?.id,
          url: imageNode?.url,
          thumbnailUrl: imageNode?.thumbnail ?? imageNode?.url,
          altText: imageNode?.altText,
        }))
      : [],
    options: Array.isArray(node.options) ? node.options.map(option => ({ name: option.name, values: option.values })) : [],
    variants: Array.isArray(node.variants?.edges) ? node.variants.edges.map(({ node: variantNode }) => ({
      id: variantNode?.id,
      title: variantNode?.title,
      availableForSale: Boolean(variantNode?.availableForSale),
      quantityAvailable: variantNode?.quantityAvailable ?? 0,
      price: variantNode?.price?.amount ?? null,
      currency: variantNode?.price?.currencyCode ?? null,
      compareAtPrice: variantNode?.compareAtPrice?.amount ?? null,
      image: variantNode?.image ? { id: variantNode.image.id, url: variantNode.image.url, altText: variantNode.image.altText } : null,
      selectedOptions: Array.isArray(variantNode?.selectedOptions) ? variantNode.selectedOptions.map(opt => ({ name: opt.name, value: opt.value })) : [],
    })) : [],
    price: node.variants?.edges?.[0]?.node?.price?.amount ?? '0',
    compareAtPrice: node.variants?.edges?.[0]?.node?.compareAtPrice?.amount ?? null,
    currency: node.variants?.edges?.[0]?.node?.price?.currencyCode || 'BRL',
    variantId: node.variants?.edges?.[0]?.node?.id ?? null,
  }));
};

export const formatCollection = (node) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    image: node.image,
});

export const formatCollections = (edges) => {
    return edges.map(({ node }) => formatCollection(node));
};
