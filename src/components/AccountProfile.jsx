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
  redeemCustomerPoints,
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
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [lastRedeemResult, setLastRedeemResult] = useState(null);

  const tWithFallback = (key, fallback, options = {}) => {
    return t(key, { defaultValue: fallback, ...options });
  };

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

  useEffect(() => {
    if (customer?.loyalty?.availablePoints > 0) {
      const maxPoints = Math.max(
        customer.loyalty.maxRedeemablePoints || 0,
        customer.loyalty.threshold || 0,
      );
      const initialPoints = maxPoints > 0
        ? Math.min(maxPoints, customer.loyalty.availablePoints)
        : customer.loyalty.availablePoints;
      setRedeemPoints(String(initialPoints));
    } else {
      setRedeemPoints('');
    }
    setLastRedeemResult(null);
  }, [customer?.loyalty?.availablePoints, customer?.loyalty?.maxRedeemablePoints, customer?.loyalty?.threshold]);

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
      
      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
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

  const handleRedeem = async () => {
    if (!isAdminApiConfigured()) {
      toast({
        title: tWithFallback('account.loyalty.unavailableTitle', 'Loyalty unavailable'),
        description: tWithFallback('account.loyalty.unavailableDescription', 'Please contact support for assistance.'),
        variant: 'destructive',
      });
      return;
    }

    if (!customer?.id || !customer?.loyalty) return;

    const points = Math.floor(Number(redeemPoints));
    if (!Number.isFinite(points) || points <= 0) {
      toast({
        title: tWithFallback('account.loyalty.invalidPointsTitle', 'Enter a valid number of points'),
        description: tWithFallback('account.loyalty.invalidPointsDescription', 'Please enter a positive number of points to redeem.'),
        variant: 'destructive',
      });
      return;
    }

    if (points > (customer.loyalty.availablePoints || 0)) {
      toast({
        title: tWithFallback('account.loyalty.insufficientTitle', 'Not enough points'),
        description: tWithFallback('account.loyalty.insufficientDescription', 'You do not have enough points to redeem this amount.'),
        variant: 'destructive',
      });
      return;
    }

    if ((customer.loyalty.threshold || 0) > 0 && points < customer.loyalty.threshold) {
      toast({
        title: tWithFallback('account.loyalty.thresholdTitle', 'Minimum redemption not reached'),
        description: tWithFallback(
          'account.loyalty.thresholdDescription',
          `You need at least ${customer.loyalty.threshold} points to redeem a reward.`
        ),
        variant: 'destructive',
      });
      return;
    }

    const maxRedeemablePoints = Math.max(0, customer.loyalty.maxRedeemablePoints || 0);
    const maxPercent = Number.isFinite(customer.loyalty.maxDiscountPercent) && customer.loyalty.maxDiscountPercent > 0
      ? customer.loyalty.maxDiscountPercent
      : Number.parseFloat(import.meta.env.VITE_LOYALTY_MAX_DISCOUNT_PERCENT || '15');
    const percentLabel = `${maxPercent}%`;
    if (maxRedeemablePoints > 0 && points > maxRedeemablePoints) {
      toast({
        title: tWithFallback('account.loyalty.maxLimitTitle', 'Redemption limit reached'),
        description: tWithFallback(
          'account.loyalty.maxLimitDescription',
          'You can redeem up to {{points}} points ({{percent}}) per purchase.',
          {
            points: maxRedeemablePoints.toLocaleString(),
            percent: percentLabel,
          }
        ),
        variant: 'destructive',
      });
      return;
    }

    try {
      setRedeemLoading(true);
      const response = await redeemCustomerPoints(customer.id, points);
      setLastRedeemResult(response);
      toast({
        title: tWithFallback('account.loyalty.redeemSuccessTitle', 'Discount code ready!'),
        description: tWithFallback(
          'account.loyalty.redeemSuccessDescription',
          `Use code ${response.code} to enjoy your reward.`
        ),
      });
      setRedeemPoints('');
      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
      }
    } catch (error) {
      console.error('Failed to redeem loyalty points:', error);
      toast({
        title: tWithFallback('account.loyalty.redeemErrorTitle', 'Unable to redeem points'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRedeemLoading(false);
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

  const loyalty = customer?.loyalty;
  const maxDiscountPercent = Number.isFinite(loyalty?.maxDiscountPercent) && loyalty.maxDiscountPercent > 0
    ? loyalty.maxDiscountPercent
    : Number.parseFloat(import.meta.env.VITE_LOYALTY_MAX_DISCOUNT_PERCENT || '15');
  const percentLabel = `${maxDiscountPercent}%`;
  const maxRedeemablePoints = Math.max(0, loyalty?.maxRedeemablePoints ?? 0);
  const maxPointsPerRedemption = Math.max(maxRedeemablePoints, loyalty?.threshold || 0);
  const canRedeem = Boolean(
    isAdminApiConfigured() &&
      loyalty &&
      loyalty.availablePoints > 0 &&
      (!loyalty.threshold || loyalty.availablePoints >= loyalty.threshold) &&
      maxPointsPerRedemption > 0
  );

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

          {loyalty && (
            <>
              <Separator className="border-gray-700" />
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h4 className="font-semibold text-yellow-400">
                    {tWithFallback('account.loyalty.title', 'Loyalty & Rewards')}
                  </h4>
                  <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                    <Check className="h-3 w-3 mr-1" />
                    {tWithFallback('account.loyalty.active', 'Active Member')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/60 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                      {tWithFallback('account.loyalty.total', 'Total Points Earned')}
                    </p>
                    <p className="text-2xl font-bold text-purple-300 mt-1">
                      {loyalty.totalPoints.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-800/60 border border-green-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                      {tWithFallback('account.loyalty.available', 'Available Points')}
                    </p>
                    <p className="text-2xl font-bold text-green-300 mt-1">
                      {loyalty.availablePoints.toLocaleString()}
                    </p>
                    {loyalty.threshold > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {tWithFallback('account.loyalty.thresholdLabel', 'Minimum to redeem:')} {loyalty.threshold.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-800/60 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                      {tWithFallback('account.loyalty.value', 'Reward Value Available')}
                    </p>
                    <p className="text-2xl font-bold text-yellow-300 mt-1">
                      {loyalty.currency || 'GBP'} {loyalty.discountValue.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-800/40 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-200">
                    {tWithFallback('account.loyalty.redeemTitle', 'Redeem Points for a Discount')}
                  </h5>
                  <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 space-y-2">
                    <h6 className="text-base font-semibold text-yellow-300">
                      {tWithFallback('account.loyalty.howItWorksTitle', 'How do loyalty points work?')}
                    </h6>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>
                        {tWithFallback(
                          'account.loyalty.howItWorksEarn',
                          'You earn points with each purchase. Each point is worth {{currency}} {{value}} when redeemed.',
                          {
                            currency: loyalty.currency || 'GBP',
                            value: ((loyalty.pennyPerPoint || 10) / 100).toFixed(2),
                          }
                        )}
                      </li>
                      <li>
                        {tWithFallback(
                          'account.loyalty.howItWorksMax',
                          'You can redeem up to {{percent}} of an order using points (maximum {{points}} points right now).',
                          {
                            percent: percentLabel,
                            points: maxPointsPerRedemption > 0 ? maxPointsPerRedemption.toLocaleString() : '0',
                          }
                        )}
                      </li>
                      <li>
                        {tWithFallback(
                          'account.loyalty.howItWorksExample',
                          'Example: each £1 saved costs 10 points. If your purchase is £100, you may apply up to 150 points (£15).'
                        )}
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-400">
                    {tWithFallback(
                      'account.loyalty.redeemDescription',
                      'Convert your points into an exclusive discount code usable at checkout.'
                    )}
                  </p>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <Label htmlFor="loyalty-points" className="text-gray-300 text-sm">
                        {tWithFallback('account.loyalty.pointsInput', 'Points to redeem')}
                      </Label>
                      <Input
                        id="loyalty-points"
                        type="number"
                        min={loyalty.threshold || 1}
                        max={maxPointsPerRedemption > 0 ? maxPointsPerRedemption : undefined}
                        step={1}
                        value={redeemPoints}
                        onChange={(event) => setRedeemPoints(event.target.value)}
                        className="mt-1 bg-gray-900 border-gray-700 text-white"
                        disabled={!isAdminApiConfigured() || redeemLoading}
                      />
                      {maxPointsPerRedemption > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          {tWithFallback(
                          'account.loyalty.maxLimitHelper',
                          'Maximum per purchase: {{points}} points ({{percent}}).',
                          {
                            points: maxPointsPerRedemption.toLocaleString(),
                            percent: percentLabel,
                          }
                        )}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleRedeem}
                      disabled={!canRedeem || redeemLoading}
                      className="bg-purple-500 hover:bg-purple-600 text-black font-semibold"
                    >
                      {redeemLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {tWithFallback('account.loyalty.redeemButton', 'Redeem Points')}
                    </Button>
                  </div>
                  {lastRedeemResult?.code && (
                    <div className="bg-purple-500/10 border border-purple-500/30 text-purple-200 rounded-md p-3 text-sm">
                      {tWithFallback('account.loyalty.lastCode', 'Latest code:')} <span className="font-semibold">{lastRedeemResult.code}</span>
                    </div>
                  )}
                </div>

                {loyalty.redemptions.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-lg font-semibold text-gray-200">
                      {tWithFallback('account.loyalty.historyTitle', 'Recent Redemptions')}
                    </h5>
                    <div className="space-y-2">
                      {loyalty.redemptions
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((entry, index) => (
                          <div
                            key={`${entry.code}-${index}`}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-gray-800/60 border border-gray-700 rounded-lg p-3 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                                {entry.code}
                              </Badge>
                              <span className="text-gray-300">
                                {entry.points.toLocaleString()} {tWithFallback('account.loyalty.pointsLabel', 'points')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                              <span>
                                {tWithFallback('account.loyalty.valueLabel', 'Value')}: {entry.currency || loyalty.currency || 'GBP'}{' '}
                                {Number(entry.value || 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.createdAt || Date.now()).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
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
