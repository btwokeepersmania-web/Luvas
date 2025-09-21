import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
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
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog.jsx';
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

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
];

const AccountAddresses = () => {
  const { customer, fetchCustomerFromAPI } = useAuth();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    phone: '',
  });

  // Fetch addresses from Admin API
  const fetchAddresses = useCallback(async () => {
    if (!customer?.email || !isAdminApiConfigured()) {
      return customer?.addresses || [];
    }

    try {
      setLoading(true);
      const customerData = await getCustomerByEmail(customer.email);
      return customerData?.addresses || [];
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast({
        title: t('account.addresses.fetchError'),
        description: error.message,
        variant: 'destructive',
      });
      return customer?.addresses || [];
    } finally {
      setLoading(false);
    }
  }, [customer?.email, customer?.addresses, t]);

  // Load addresses on component mount
  useEffect(() => {
    const loadAddresses = async () => {
      const addressData = await fetchAddresses();
      setAddresses(addressData);
    };
    
    if (customer) {
      loadAddresses();
    }
  }, [customer, fetchAddresses]);

  // Reset form
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
      phone: '',
    });
    setEditingAddress(null);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Open dialog for adding new address
  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing address
  const handleEdit = (address) => {
    setFormData({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      company: address.company || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      province: address.province || '',
      zip: address.zip || '',
      country: address.country || '',
      phone: address.phone || '',
    });
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    try {
      // Validate required fields
      validateAddress(formData);
      
      setSaving(true);
      
      if (editingAddress) {
        // Update existing address
        await updateCustomerAddress(customer.id, editingAddress.id, formData);
        toast({
          title: t('account.addresses.updated'),
          description: t('account.addresses.updatedDescription'),
        });
      } else {
        // Create new address
        await createCustomerAddress(customer.id, formData);
        toast({
          title: t('account.addresses.created'),
          description: t('account.addresses.createdDescription'),
        });
      }
      
      // Refresh addresses and customer data
      const updatedAddresses = await fetchAddresses();
      setAddresses(updatedAddresses);
      
      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
      }
      
      setIsDialogOpen(false);
      resetForm();
      
    } catch (error) {
      console.error('Failed to save address:', error);
      toast({
        title: t('account.addresses.saveError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete address
  const handleDelete = async (addressId) => {
    try {
      setSaving(true);
      await deleteCustomerAddress(customer.id, addressId);
      
      // Refresh addresses
      const updatedAddresses = await fetchAddresses();
      setAddresses(updatedAddresses);
      
      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
      }
      
      toast({
        title: t('account.addresses.deleted'),
        description: t('account.addresses.deletedDescription'),
      });
      
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast({
        title: t('account.addresses.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle set as default
  const handleSetDefault = async (addressId) => {
    try {
      setSaving(true);
      await setDefaultAddress(customer.id, addressId);
      
      // Refresh addresses
      const updatedAddresses = await fetchAddresses();
      setAddresses(updatedAddresses);
      
      if (fetchCustomerFromAPI) {
        await fetchCustomerFromAPI();
      }
      
      toast({
        title: t('account.addresses.defaultSet'),
        description: t('account.addresses.defaultSetDescription'),
      });
      
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast({
        title: t('account.addresses.defaultError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if address is default
  const isDefaultAddress = (addressId) => {
    return customer?.defaultAddress?.id === addressId;
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
              <MapPin />
              {t('account.addresses.title')}
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleAddNew}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
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
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('account.addresses.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company">{t('account.addresses.company')} ({t('account.addresses.optional')})</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address1">{t('account.addresses.address1')} *</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(e) => handleInputChange('address1', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address2">{t('account.addresses.address2')} ({t('account.addresses.optional')})</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(e) => handleInputChange('address2', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('account.addresses.city')} *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="province">{t('account.addresses.province')}</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip">{t('account.addresses.zip')}</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => handleInputChange('zip', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">{t('account.addresses.country')} *</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder={t('account.addresses.selectCountry')} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">{t('account.addresses.phone')} ({t('account.addresses.optional')})</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('account.addresses.cancel')}
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !formData.address1 || !formData.city || !formData.country}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
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
                              <p>{address.city}, {address.province} {address.zip}</p>
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
