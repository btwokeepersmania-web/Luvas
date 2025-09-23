import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  Check,
  X,
  RefreshCw,
  Home,
  Building,
  Phone,
  User,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';

import {
  getCustomerByEmail,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
  isAdminApiConfigured,
  validateAddress
} from '@/lib/shopify/adminApi.js';
import { toast } from '@/components/ui/use-toast.js';

const tWithFallback = (translator, key, fallback) => {
  const translated = translator(key);
  return translated === key ? fallback : translated;
};

const normalizeAddresses = (addresses) => {
  if (!addresses) return [];
  if (Array.isArray(addresses)) return addresses;
  if (Array.isArray(addresses.edges)) return addresses.edges.map((edge) => edge.node);
  return [];
};

const FALLBACK_COUNTRY_CODES = [
  'AF','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU','VE','VN','VG','VI','WF','EH','YE','ZM','ZW'
];

const AccountAddresses = () => {
  const { customer, fetchCustomerFromAPI } = useAuth();
  const { localization } = useLocalization();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    zip: '',
    country: '',
    countryCode: '',
    phone: '',
  });

  const countryOptions = useMemo(() => {
    const unique = new Map();
    const pushCountry = (code, name) => {
      if (!code || !name) return;
      const normalized = name.toLowerCase();
      if (!unique.has(normalized)) {
        unique.set(normalized, { code, name });
      }
    };

    localization?.availableCountries?.forEach((country) => {
      pushCountry(country.isoCode, country.name);
    });

    if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      FALLBACK_COUNTRY_CODES.forEach((code) => {
        pushCountry(code, displayNames.of(code) || code);
      });
    }

    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [localization]);

  const countryMapByName = useMemo(() => {
    const map = new Map();
    countryOptions.forEach((option) => {
      map.set(option.name.toLowerCase(), option);
    });
    return map;
  }, [countryOptions]);

  const countryMapByCode = useMemo(() => {
    const map = new Map();
    countryOptions.forEach((option) => {
      map.set(option.code.toUpperCase(), option);
    });
    return map;
  }, [countryOptions]);

  const resolveCountryOption = useCallback(
    (value) => {
      if (!value) return null;
      const normalized = value.toLowerCase();
      return countryMapByName.get(normalized) || countryMapByCode.get(value.toUpperCase()) || null;
    },
    [countryMapByCode, countryMapByName]
  );

  const fetchAddresses = useCallback(async () => {
    if (!customer?.email || !isAdminApiConfigured()) {
      return normalizeAddresses(customer?.addresses);
    }

    try {
      setLoading(true);
      const customerData = await getCustomerByEmail(customer.email);
      return normalizeAddresses(customerData?.addresses);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast({
        title: t('account.addresses.fetchError'),
        description: error.message,
        variant: 'destructive',
      });
      return normalizeAddresses(customer?.addresses);
    } finally {
      setLoading(false);
    }
  }, [customer?.email, customer?.addresses, t]);

  useEffect(() => {
    const loadAddresses = async () => {
      const addressData = await fetchAddresses();
      setAddresses(addressData);
    };

    if (customer) {
      loadAddresses();
    }
  }, [customer, fetchAddresses]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      province: '',
      zip: '',
      country: '',
      countryCode: '',
      phone: '',
    });
    setEditingAddress(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (value) => {
    const option = resolveCountryOption(value.trim());
    setFormData((prev) => ({
      ...prev,
      country: value,
      countryCode: option?.code || prev.countryCode,
    }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const matcher = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouchDevice(matcher.matches);
    update();
    matcher.addEventListener('change', update);
    return () => matcher.removeEventListener('change', update);
  }, []);

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (address) => {
    const option = resolveCountryOption(address.countryCode || address.country);
    setFormData({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      company: address.company || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      province: address.province || '',
      zip: address.zip || '',
      country: option?.name || address.country || '',
      countryCode: option?.code || address.countryCode || '',
      phone: address.phone || '',
    });
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handlePostalLookup = async () => {
    const postalCode = formData.zip?.trim();
    const countryCode = formData.countryCode || resolveCountryOption(formData.country)?.code;

    const missingZipTitle = tWithFallback(t, 'account.addresses.lookupMissingZip', 'Postal code required');
    const missingZipDescription = tWithFallback(
      t,
      'account.addresses.lookupMissingZipDescription',
      'Please enter the postal/ZIP code before running a lookup.'
    );
    const missingCountryTitle = tWithFallback(t, 'account.addresses.lookupMissingCountry', 'Country required');
    const missingCountryDescription = tWithFallback(
      t,
      'account.addresses.lookupMissingCountryDescription',
      'Select or type a country so we know which lookup service to use.'
    );
    const successTitle = tWithFallback(t, 'account.addresses.lookupSuccess', 'Address suggestions applied');
    const successDescription = tWithFallback(
      t,
      'account.addresses.lookupSuccessDescription',
      'We filled in any address details we could find. Please confirm they are correct.'
    );
    const lookupErrorTitle = tWithFallback(t, 'account.addresses.lookupError', 'Lookup unavailable');

    if (!postalCode) {
      toast({ title: missingZipTitle, description: missingZipDescription, variant: 'destructive' });
      return;
    }

    if (!countryCode) {
      toast({ title: missingCountryTitle, description: missingCountryDescription, variant: 'destructive' });
      return;
    }

    setIsLookupLoading(true);
    try {
      let response;
      if (countryCode.toUpperCase() === 'BR') {
        const sanitized = postalCode.replace(/[^0-9]/g, '');
        response = await fetch(`https://viacep.com.br/ws/${sanitized}/json/`);
        if (!response.ok) throw new Error('CEP lookup failed');
        const data = await response.json();
        if (data.erro) throw new Error('CEP not found');
        setFormData((prev) => ({
          ...prev,
          city: data.localidade || prev.city,
          province: data.uf || data.estado || prev.province,
          address1: data.logradouro || prev.address1,
          country: 'Brazil',
          countryCode: 'BR',
        }));
      } else {
        const sanitized = postalCode.replace(/\s+/g, '');
        response = await fetch(`https://api.zippopotam.us/${countryCode.toLowerCase()}/${encodeURIComponent(sanitized)}`);
        if (!response.ok) throw new Error('Postal lookup failed');
        const data = await response.json();
        const place = Array.isArray(data.places) && data.places.length ? data.places[0] : null;
        setFormData((prev) => ({
          ...prev,
          city: place?.['place name'] || prev.city,
          province: place?.state || place?.['state abbreviation'] || prev.province,
          country: countryMapByCode.get(countryCode.toUpperCase())?.name || prev.country || data.country,
          countryCode: countryCode.toUpperCase(),
        }));
      }
      toast({ title: successTitle, description: successDescription });
    } catch (error) {
      console.error('Postal lookup failed:', error);
      toast({ title: lookupErrorTitle, description: error.message, variant: 'destructive' });
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      validateAddress(formData);
      setSaving(true);

      const option = resolveCountryOption(formData.country);
      const resolvedCountryCode = (option?.code || formData.countryCode || '').toUpperCase() || undefined;
      const payload = {
        ...formData,
        country: option?.name || formData.country || '',
        countryCode: resolvedCountryCode,
      };
      if (payload.province) {
        const trimmedProvince = payload.province.trim();
        payload.province = trimmedProvince;
        if (trimmedProvince.length <= 3) payload.provinceCode = trimmedProvince.toUpperCase();
        else delete payload.provinceCode;
      } else {
        delete payload.provinceCode;
      }
      if (payload.phone) {
        payload.phone = payload.phone.trim();
        if (payload.phone === '') payload.phone = null;
      }
      if (payload.address2) {
        payload.address2 = payload.address2.trim() || null;
      }

      if (editingAddress) {
        await updateCustomerAddress(customer.id, editingAddress.id, payload);
        toast({ title: t('account.addresses.updated'), description: t('account.addresses.updatedDescription') });
      } else {
        await createCustomerAddress(customer.id, payload);
        toast({ title: t('account.addresses.created'), description: t('account.addresses.createdDescription') });
      }

      const updatedAddresses = await fetchAddresses();
      setAddresses(updatedAddresses);

      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast({ title: t('account.addresses.saveError'), description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    try {
      setSaving(true);
      await deleteCustomerAddress(customer.id, addressId);
      const updatedAddresses = await fetchAddresses();
      setAddresses(updatedAddresses);
      if (fetchCustomerFromAPI) await fetchCustomerFromAPI();
      toast({ title: t('account.addresses.deleted'), description: t('account.addresses.deletedDescription') });
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast({ title: t('account.addresses.deleteError'), description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      setSaving(true);
      await setDefaultAddress(customer.id, addressId);
      const updatedAddresses = await fetchAddresses();
      setAddresses(updatedAddresses);
      if (fetchCustomerFromAPI) await fetchCustomerFromAPI();
      toast({ title: t('account.addresses.defaultSet'), description: t('account.addresses.defaultSetDescription') });
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast({ title: t('account.addresses.defaultError'), description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isDefaultAddress = (addressId) => customer?.defaultAddress?.id === addressId;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-gray-900 border-yellow-500/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl text-yellow-400">
              <MapPin />
              {t('account.addresses.title')}
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('account.addresses.addNew')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-yellow-500/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400">
                    {editingAddress ? t('account.addresses.editAddress') : t('account.addresses.addNewAddress')}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('account.addresses.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(event) => handleInputChange('firstName', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('account.addresses.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(event) => handleInputChange('lastName', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company">{t('account.addresses.company')} ({t('account.addresses.optional')})</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(event) => handleInputChange('company', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address1">{t('account.addresses.address1')} *</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(event) => handleInputChange('address1', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address2">{t('account.addresses.address2')} ({t('account.addresses.optional')})</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(event) => handleInputChange('address2', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('account.addresses.city')} *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(event) => handleInputChange('city', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">{t('account.addresses.province')}</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(event) => handleInputChange('province', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip">{t('account.addresses.zip')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(event) => handleInputChange('zip', event.target.value)}
                        className="bg-gray-800 border-gray-700"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePostalLookup}
                        disabled={isLookupLoading}
                        className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        {isLookupLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('account.addresses.country')} *</Label>
                    {isTouchDevice ? (
                      <Select
                        value={formData.countryCode || ''}
                        onValueChange={(code) => {
                          const option = countryMapByCode.get(code);
                          setFormData((prev) => ({
                            ...prev,
                            country: option?.name || code,
                            countryCode: code,
                          }));
                        }}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-left">
                          <SelectValue placeholder={t('account.addresses.selectCountry')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto bg-gray-900 text-white" position="popper">
                          {countryOptions.map((option) => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(event) => handleCountryChange(event.target.value)}
                          list="account-country-options"
                          placeholder={t('account.addresses.selectCountry')}
                          className="bg-gray-800 border-gray-700"
                          required
                        />
                        <datalist id="account-country-options">
                          {countryOptions.map((option) => (
                            <option key={option.code} value={option.name} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">{t('account.addresses.phone')} ({t('account.addresses.optional')})</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(event) => handleInputChange('phone', event.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('account.addresses.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !formData.address1 || !formData.city || !formData.country}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    {saving ? t('account.addresses.saving') : t('account.addresses.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto text-yellow-500 animate-spin mb-2" />
              <p className="text-gray-400">{t('account.addresses.loading')}</p>
            </div>
          ) : addresses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {addresses.map((address) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-gray-800 border-gray-700 hover:border-yellow-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {isDefaultAddress(address.id) && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                {t('account.addresses.default')}
                              </Badge>
                            )}
                            {address.company && (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                <Building className="h-3 w-3 mr-1" />
                                {t('account.addresses.business')}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(address)}
                              className="h-8 w-8 p-0 hover:bg-yellow-500/10 hover:text-yellow-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-red-500/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-red-400">
                                    {t('account.addresses.confirmDelete')}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    {t('account.addresses.confirmDeleteDescription')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    {t('account.addresses.cancel')}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(address.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    {t('account.addresses.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 font-semibold">
                            <User className="h-4 w-4 text-gray-400" />
                            {address.firstName} {address.lastName}
                          </div>

                          {address.company && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Building className="h-4 w-4" />
                              {address.company}
                            </div>
                          )}

                          <div className="flex items-start gap-2 text-gray-300">
                            <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p>{address.address1}</p>
                              {address.address2 && <p>{address.address2}</p>}
                              <p>
                                {address.city}
                                {address.province ? `, ${address.province}` : ''}
                                {address.zip ? ` ${address.zip}` : ''}
                              </p>
                              <p>{address.country}</p>
                            </div>
                          </div>

                          {address.phone && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Phone className="h-4 w-4" />
                              {address.phone}
                            </div>
                          )}
                        </div>

                        {!isDefaultAddress(address.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefault(address.id)}
                            disabled={saving}
                            className="w-full mt-3 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {t('account.addresses.setAsDefault')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-yellow-500/20 rounded-lg">
              <MapPin className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">{t('account.addresses.noAddresses')}</p>
              <p className="text-gray-500 text-sm mt-2">{t('account.addresses.noAddressesDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccountAddresses;
