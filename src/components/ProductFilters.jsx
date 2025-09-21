import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import { Filter } from 'lucide-react';

const ProductFilters = ({ products, filters, setFilters }) => {
  const { t } = useTranslation();

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.productType).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const sizes = useMemo(() => {
    const allSizes = new Set();
    products.forEach(p => {
      const sizeOption = p.options.find(opt => opt.name.toLowerCase() === 'size');
      if (sizeOption) {
        sizeOption.values.forEach(val => allSizes.add(val));
      }
    });
    const sortedSizes = Array.from(allSizes).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
    return ['all', ...sortedSizes];
  }, [products]);

  const handleFilterChange = (filterName) => (value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <div className="mb-12 flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
            <Filter className="h-4 w-4" />
            {t('shop.filters.title')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-gray-900 border-yellow-500/30 text-white">
          <DropdownMenuLabel>{t('shop.filters.sortBy')}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-yellow-500/20" />
          <DropdownMenuRadioGroup value={filters.sort} onValueChange={handleFilterChange('sort')}>
            <DropdownMenuRadioItem value="relevance">{t('shop.filters.relevance')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="price-asc">{t('shop.filters.priceAsc')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="price-desc">{t('shop.filters.priceDesc')}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator className="bg-yellow-500/20"/>
          <DropdownMenuLabel>{t('shop.filters.category')}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-yellow-500/20"/>
          <DropdownMenuRadioGroup value={filters.category} onValueChange={handleFilterChange('category')}>
            {categories.map(cat => (
              <DropdownMenuRadioItem key={cat} value={cat}>
                {cat === 'all' ? t('shop.filters.allCategories') : cat}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator className="bg-yellow-500/20"/>
          <DropdownMenuLabel>{t('shop.filters.size')}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-yellow-500/20"/>
          <DropdownMenuRadioGroup value={filters.size} onValueChange={handleFilterChange('size')}>
            {sizes.map(size => (
              <DropdownMenuRadioItem key={size} value={size}>
                {size === 'all' ? t('shop.filters.allSizes') : size}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProductFilters;