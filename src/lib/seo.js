const MAX_DESCRIPTION_LENGTH = 155;

const toString = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const stripHtml = (value) => {
  return toString(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
};

const normaliseWhitespace = (value) => {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncate = (value, limit = MAX_DESCRIPTION_LENGTH) => {
  if (value.length <= limit) {
    return value;
  }
  const shortened = value.slice(0, limit).trimEnd();
  return `${shortened.replace(/[.,;:-]*$/, '')}...`;
};

export const buildMetaDescription = (...candidates) => {
  for (const candidate of candidates) {
    const plain = normaliseWhitespace(stripHtml(candidate || ''));
    if (plain) {
      return truncate(plain);
    }
  }
  return '';
};

export const buildPageTitle = (primaryTitle, siteName, { separator = ' - ' } = {}) => {
  const cleanPrimary = normaliseWhitespace(toString(primaryTitle));
  const cleanSite = normaliseWhitespace(toString(siteName));
  if (cleanPrimary && cleanSite) {
    if (cleanPrimary.includes(cleanSite)) {
      return cleanPrimary;
    }
    return `${cleanPrimary}${separator}${cleanSite}`;
  }
  return cleanPrimary || cleanSite || '';
};

export const chooseFirstString = (...candidates) => {
  for (const candidate of candidates) {
    const value = normaliseWhitespace(toString(candidate));
    if (value) {
      return value;
    }
  }
  return '';
};
