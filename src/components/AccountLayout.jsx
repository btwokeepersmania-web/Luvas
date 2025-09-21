import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext.jsx';
import { motion } from 'framer-motion';
import { User, Package, Settings, LogOut, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const AccountLayout = () => {
    const { t } = useTranslation();
    const { logout, customer, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (loading || !customer) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-950">
            <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />
          </div>
        );
    }
    
    const handleLogout = async () => {
        await logout();
        navigate('/');
    };
    
    const navItems = [
        { name: t('account.orders'), href: '/account/orders', icon: Package },
        { name: t('account.profile'), href: '/account/profile', icon: User },
        { name: t('account.addresses'), href: '/account/addresses', icon: MapPin },
        { name: t('account.settings'), href: '/account/settings', icon: Settings },
    ];
    
    const activeLinkClass = "bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-500";
    const inactiveLinkClass = "text-gray-300 hover:bg-gray-800 hover:text-white";

    const isAccountRoot = location.pathname === '/account';

    return (
        <div className="container mx-auto px-4 pt-32 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <motion.aside 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-1"
                >
                    <div className="bg-gray-900 border border-yellow-500/20 rounded-lg p-6 sticky top-28">
                        <h2 className="text-2xl font-bold mb-6 text-white">{t('account.title')}</h2>
                        <nav className="flex flex-col space-y-2">
                            {navItems.map((item) => {
                                const isActive = isAccountRoot && item.href === '/account/orders' ? true : location.pathname === item.href;
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </NavLink>
                                );
                            })}
                            <div className="pt-4 mt-4 border-t border-yellow-500/20">
                               <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 space-x-3 px-4 py-3">
                                   <LogOut className="h-5 w-5" />
                                   <span>{t('account.logout')}</span>
                                </Button>
                            </div>
                        </nav>
                    </div>
                </motion.aside>

                <main className="lg:col-span-3">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AccountLayout;