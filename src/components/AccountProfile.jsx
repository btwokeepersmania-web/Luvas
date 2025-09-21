import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { 
  getCustomerByEmail, 
  updateCustomerProfile, 
  isAdminApiConfigured 
} from '@/lib/shopify/adminApi.js';
import { toast } from '@/components/ui/use-toast.js';

const AccountProfile = () => {
  const { customer, fetchCustomerFromAPI } = useAuth();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when customer data changes
  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || customer.phoneNumber?.phoneNumber || '',
      });
    }
  }, [customer]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('account.profile.errors.firstNameRequired');
    }
    
    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('account.profile.errors.lastNameRequired');
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = t('account.profile.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('account.profile.errors.emailInvalid');
    }
    
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t('account.profile.errors.phoneInvalid');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isAdminApiConfigured()) {
      toast({
        title: t('account.profile.configError'),
        description: t('account.profile.configErrorDescription'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      // Update customer profile via Admin API
      await updateCustomerProfile(customer.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
      });
      
      // Refresh customer data
      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
      }
      
      toast({
        title: t('account.profile.updated'),
        description: t('account.profile.updatedDescription'),
      });
      
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: t('account.profile.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || customer?.phoneNumber?.phoneNumber || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  // Refresh profile data
  const handleRefresh = async () => {
    if (!customer?.email || !isAdminApiConfigured()) return;
    
    try {
      setLoading(true);
      const customerData = await getCustomerByEmail(customer.email);
      
      if (customerData) {
        setFormData({
          firstName: customerData.firstName || '',
          lastName: customerData.lastName || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
        });
      }
      
      toast({
        title: t('account.profile.refreshed'),
        description: t('account.profile.refreshedDescription'),
      });
      
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      toast({
        title: t('account.profile.refreshError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get initials for avatar
  const getInitials = () => {
    const firstName = formData.firstName || customer?.firstName || '';
    const lastName = formData.lastName || customer?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-900 border-yellow-500/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl text-yellow-400">
              <User />
              {t('account.profile.title')}
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={loading || saving}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  disabled={!isAdminApiConfigured()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('account.profile.edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('account.profile.cancel')}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? t('account.profile.saving') : t('account.profile.save')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-2xl">
              {getInitials() || <User className="h-10 w-10" />}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {formData.firstName} {formData.lastName}
              </h3>
              <div className="flex gap-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <Shield className="h-3 w-3 mr-1" />
                  {t('account.profile.verified')}
                </Badge>
                {customer?.createdAt && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Calendar className="h-3 w-3 mr-1" />
                    {t('account.profile.memberSince')} {formatDate(customer.createdAt).split(',')[1]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="border-gray-700" />
          
          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-300">
                {t('account.profile.firstName')} *
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`bg-gray-800 border-gray-700 ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder={t('account.profile.firstNamePlaceholder')}
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{formData.firstName || t('account.profile.notSet')}</span>
                </div>
              )}
            </div>
            
            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-300">
                {t('account.profile.lastName')} *
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`bg-gray-800 border-gray-700 ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder={t('account.profile.lastNamePlaceholder')}
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{formData.lastName || t('account.profile.notSet')}</span>
                </div>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-gray-300">
                {t('account.profile.email')} *
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-gray-800 border-gray-700 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder={t('account.profile.emailPlaceholder')}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-lg">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{formData.email || t('account.profile.notSet')}</span>
                </div>
              )}
            </div>
            
            {/* Phone */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone" className="text-gray-300">
                {t('account.profile.phone')} ({t('account.profile.optional')})
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`bg-gray-800 border-gray-700 ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder={t('account.profile.phonePlaceholder')}
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-lg">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{formData.phone || t('account.profile.notSet')}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Account Information */}
          {customer?.createdAt && (
            <>
              <Separator className="border-gray-700" />
              <div className="space-y-4">
                <h4 className="font-semibold text-yellow-400">{t('account.profile.accountInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-400">{t('account.profile.memberSince')}</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(customer.createdAt)}
                    </p>
                  </div>
                  {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                    <div className="space-y-1">
                      <p className="text-gray-400">{t('account.profile.lastUpdated')}</p>
                      <p className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-gray-400" />
                        {formatDate(customer.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Admin API Status */}
          {!isAdminApiConfigured() && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">{t('account.profile.limitedFunctionality')}</span>
              </div>
              <p className="text-sm text-gray-300">
                {t('account.profile.limitedFunctionalityDescription')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccountProfile;
