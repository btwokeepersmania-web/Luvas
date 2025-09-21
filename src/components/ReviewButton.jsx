import React, { useEffect, useRef } from 'react';
import { Star, MessageSquare, Youtube, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";

const GoogleIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2.18 12.19,2.18C6.42,2.18 2.03,6.8 2.03,12C2.03,17.05 6.16,21.82 12.19,21.82C17.8,21.82 21.52,18.06 21.52,12.33C21.52,11.76 21.45,11.43 21.35,11.1Z" />
  </svg>
);

const defaultPlatforms = [
  { i18nKey: "platforms.google", icon: GoogleIcon, href: "https://www.google.com/search?hl=en&sxsrf=AE3TifMzFYFHh31V09wruj2vBvscWUv4vQ:1757390471616&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E6jWzBWFWw00DvLCd_gdmrD_nYXPsPebFzVwom-652a8X8SDcpoW8s_g8Nh6kGJIyhWB9Ht5M7BX3zwVpjQxX7i4Psrm&q=B2+GK+Gloves+Reviews#lrd=0x487bb10a51207f25:0x7529e7a0dfd4e08c,3,,,,", color: "text-blue-400" },
  { i18nKey: "platforms.trustpilot", icon: MessageSquare, href: "https://www.trustpilot.com/review/b2goalkeeping.com", color: "text-green-400" },
  { i18nKey: "platforms.facebook", icon: Facebook, href: "https://www.facebook.com/Bgkgloves/reviews", color: "text-blue-600" }, // Placeholder URL
  { i18nKey: "platforms.youtube", icon: Youtube, href: "https://www.youtube.com/@B2Goalkeeping-by4co/featured", color: "hover:text-red-400" }
];

const ReviewButton = ({ 
  children, 
  size = 'lg', 
  variant, 
  className = '', 
  platforms = defaultPlatforms,
  displayMode = 'button' // Nova prop para controlar o modo de exibição
}) => {
  const { t } = useTranslation();
  const trustpilotRef = useRef(null);

  // UseEffect para carregar o widget do Trustpilot
  useEffect(() => {
    if (displayMode === 'reviews' && window.Trustpilot) {
      window.Trustpilot.loadFromElement(trustpilotRef.current, true);
    }
  }, [displayMode]);

  // Se o modo for 'reviews', renderiza o widget
  if (displayMode === 'reviews') {
    return (
      <div 
        ref={trustpilotRef}
        className="trustpilot-widget"
        data-locale="pt-BR"
        data-template-id="5631976062fdf21459a939f6"
        data-businessunit-id="65f4d8a5996f9479e0a2731b"
        data-theme="dark"
        data-stars="4,5"
        data-review-languages="en,pt"
        data-style-height="400px"
        data-style-width="100%"
        data-font-family="-apple-system, system-ui"
      >
        <a href="https://br.trustpilot.com/review/b2goalkeeping.com" target="_blank" rel="noopener"> {t('reviews.trustpilot')} </a>
      </div>
    );
  }

  // Comportamento padrão: renderiza o botão com dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          {children ? (
            children
          ) : (
            <>
              <Star className="mr-3 h-5 w-5 animate-pulse" />
              {t('reviews.leaveReview')}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border-yellow-500/30 text-white">
        <DropdownMenuLabel>{t('reviews.whereToReview')}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-yellow-500/20" />
        {platforms.map((platform) => (
          <DropdownMenuItem key={platform.i18nKey} asChild>
            <a href={platform.href} target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
              <platform.icon className={`mr-2 h-4 w-4 ${platform.color}`} />
              <span>{t('reviews.reviewOn', { platform: t(platform.i18nKey) })}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReviewButton;