import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Menu, X, ShoppingCart, Star, User, LogOut, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import ReviewButton from '@/components/ReviewButton.jsx';
import { useCart } from '@/context/CartContext.jsx';
import { useShopify } from '@/context/ShopifyContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import Cart from '@/components/Cart.jsx';
import LocalizationSwitcher from '@/components/LocalizationSwitcher.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.jsx";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { getTotalItems, setIsCartOpen } = useCart();
  const { shopInfo } = useShopify();
  const { isAuthenticated, customer, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleNavigation = (path, sectionId) => {
    setIsMenuOpen(false);
    if (location.pathname === path && sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (path && !sectionId) {
      navigate(path);
    } else {
      navigate(path);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const menuItems = [
    { label: t('Shop'), path: '/shop' },
    { label: t('Collections'), path: '/', sectionId: 'colecoes' },
    { label: t('About'), path: '/about' },
    { label: t('Contact'), path: '/contact' },
  ];

  const shopName = shopInfo?.name || "BTWO KEEPEERS MANIA";

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled || isMenuOpen
            ? 'bg-gray-950/90 backdrop-blur-md border-b border-yellow-500/20' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0 min-w-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo/logo.svg"
                    alt={`${shopName} Logo`}
                    className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.35)]"
                  />
                </div>
                <span className="hidden md:inline text-xl md:text-2xl font-bold gradient-text whitespace-nowrap overflow-hidden text-ellipsis">{shopName}</span>
              </motion.div>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 mx-auto">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path, item.sectionId)}
                  className="text-white hover:text-yellow-400 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center justify-end space-x-1 sm:space-x-2 flex-shrink-0">
              <div className="hidden sm:block">
                <ReviewButton
                  size="sm"
                  variant="outline"
                  className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                />
              </div>
              <LocalizationSwitcher />
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-yellow-500/50">
                        <AvatarImage src={customer?.avatarUrl} alt={customer?.displayName} />
                        <AvatarFallback className="bg-yellow-800 text-white font-bold">
                          {getInitials(customer?.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-900 border-yellow-500/30 text-white" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{customer?.displayName}</p>
                        <p className="text-xs leading-none text-gray-400">{customer?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-yellow-500/30" />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => navigate('/account')} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>{t('account.myAccount')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/account/orders')} className="cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            <span>{t('account.orders')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/account/settings')} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{t('account.settings')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-yellow-500/30" />
                    <DropdownMenuItem onSelect={logout} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/20">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('account.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/account/login')}
                  className="text-white hover:text-yellow-400 hover:bg-yellow-500/10"
                >
                  <User className="h-6 w-6" />
                </Button>
              )}

              <Button
                id="site-cart-button"
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative text-white hover:text-yellow-400 hover:bg-yellow-500/10"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white hover:text-yellow-400 hover:bg-yellow-500/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={isMenuOpen ? "open" : "closed"}
            variants={{
              open: { opacity: 1, height: '100vh', display: 'block' },
              closed: { opacity: 0, height: 0, transitionEnd: { display: 'none' } }
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-gray-950/95 backdrop-blur-xl fixed inset-0 top-[76px]"
          >
            <div className="container mx-auto px-4 pt-8 flex flex-col space-y-6">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path, item.sectionId)}
                  className="text-left text-white text-xl hover:text-yellow-400 transition-colors duration-200 font-medium py-2"
                >
                  {item.label}
                </button>
              ))}
               <div className="sm:hidden pt-4">
                  <ReviewButton
                    variant="outline"
                    className="w-full text-lg py-6 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                  />
                </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      <Cart />
    </>
  );
};

export default Header;
