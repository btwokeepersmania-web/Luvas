import React, { useState } from 'react';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Globe, Languages, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LocalizationSwitcher = () => {
  const { localization, country, language, setCountry, setLanguage, loading } = useLocalization();
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  if (loading || !localization) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Globe className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  const filteredCountries = localization.availableCountries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DropdownMenu onOpenChange={() => setSearch('')}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-green-400 hover:bg-green-500/10 flex items-center gap-2 px-2">
          <Globe className="h-5 w-5" />
          <span className="text-xs font-semibold">{country.isoCode} | {country.currency.isoCode}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black border-green-500/30 text-white w-64 p-2">
        <div className="px-2 py-1.5">
          <Input
            placeholder={t('localization.searchCountry')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-900 border-gray-700 focus:border-green-500 focus:ring-green-500 h-8"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto mt-1 custom-scrollbar">
          {filteredCountries.map((c) => (
            <DropdownMenuItem
              key={c.isoCode}
              onClick={() => setCountry(c)}
              className="focus:bg-green-500/20 focus:text-green-300 flex justify-between items-center"
            >
              <span>{c.name} ({c.currency.isoCode})</span>
              {c.isoCode === country.isoCode && <Check className="h-4 w-4 text-green-400" />}
            </DropdownMenuItem>
          ))}
        </div>
        {country && country.availableLanguages.length > 1 && (
            <>
                <DropdownMenuSeparator className="bg-green-500/20 my-2" />
                <DropdownMenuLabel className="px-2">{t('localization.language')}</DropdownMenuLabel>
                <div className="mt-1">
                    {country.availableLanguages.map((l) => (
                        <DropdownMenuItem
                            key={l.isoCode}
                            onClick={() => setLanguage(l)}
                            className="focus:bg-green-500/20 focus:text-green-300 flex justify-between items-center"
                        >
                           <span>{l.name}</span>
                           {l.isoCode === language.isoCode && <Check className="h-4 w-4 text-green-400" />}
                        </DropdownMenuItem>
                    ))}
                </div>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LocalizationSwitcher;