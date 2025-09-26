import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/context/LocalizationContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ExternalLink, 
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { getCustomerByEmail, getOrderDetails, isAdminApiConfigured } from '@/lib/shopify/adminApi.js';
import { toast } from '@/components/ui/use-toast.js';

const AccountOrders = () => {
  const { customer } = useAuth();
  const { t } = useTranslation();
  const { formatPrice } = useLocalization();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(new Set());

    const formatMoney = (amount, currencyCode, fallback) => {
    const safeCurrency = currencyCode || 'GBP';
    if (amount === null || amount === undefined) {
      return fallback || formatPrice(0, safeCurrency);
    }
    const numeric = typeof amount === 'number' ? amount : Number.parseFloat(amount);
    if (!Number.isFinite(numeric)) {
      return fallback || formatPrice(0, safeCurrency);
    }
    return formatPrice(numeric, safeCurrency);
  };
    const numeric = typeof amount === 'number' ? amount : Number.parseFloat(amount);
    if (!Number.isFinite(numeric)) {
      return fallback || formatPrice(0, currencyCode);
    }
    return formatPrice(numeric, currencyCode);
  };

    const buildTimeline = (order, details, translator) => {
    const timeline = [];
    const placedAt = order.processedAt || order.createdAt || order.updatedAt;
    if (placedAt) {
      timeline.push({
        key: 'placed',
        label: translator('account.orders.timeline.placed'),
        description: translator('account.orders.timeline.placedDescription'),
        date: placedAt,
        icon: Calendar,
        status: 'completed',
      });
    }

    const paymentStatus = order.displayFinancialStatus || order.financialStatus;
    timeline.push({
      key: 'payment',
      label: translator('account.orders.timeline.payment'),
      description: paymentStatus ? paymentStatus.replace(/_/g, ' ') : translator('account.orders.timeline.paymentDescription'),
      date: placedAt,
      icon: CreditCard,
      status: paymentStatus && paymentStatus.toLowerCase().includes('paid') ? 'completed' : 'current',
    });

    const fulfillments = details?.fulfillments || order.fulfillments || [];
    const firstFulfillment = fulfillments.find((fulfillment) => fulfillment.status && fulfillment.status !== 'CANCELLED');
    timeline.push({
      key: 'fulfillment',
      label: translator('account.orders.timeline.fulfillment'),
      description: firstFulfillment?.status ? firstFulfillment.status.replace(/_/g, ' ') : translator('account.orders.timeline.fulfillmentDescription'),
      date: firstFulfillment?.updatedAt || null,
      icon: Package,
      status: firstFulfillment ? 'current' : 'upcoming',
    });

    const delivered = fulfillments.some((fulfillment) => (fulfillment.status || '').toUpperCase() === 'DELIVERED' || (details?.displayFulfillmentStatus || order.displayFulfillmentStatus || order.fulfillmentStatus) === 'FULFILLED');
    timeline.push({
      key: 'delivered',
      label: translator('account.orders.timeline.delivered'),
      description: translator('account.orders.timeline.deliveredDescription'),
      date: fulfillments.find((f) => (f.status || '').toUpperCase() === 'DELIVERED')?.updatedAt || null,
      icon: Truck,
      status: delivered ? 'completed' : 'upcoming',
    });

    return timeline;
  };

  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Fetch enhanced order data from Admin API
  const fetchEnhancedOrders = useCallback(async () => {
    if (!customer?.email || !isAdminApiConfigured()) {
      return customer?.orders?.edges || [];
    }

    try {
      setLoading(true);
      const customerData = await getCustomerByEmail(customer.email);
      return customerData?.orders?.edges || [];
    } catch (error) {
      console.error('Failed to fetch enhanced orders:', error);
      toast({
        title: t('account.orders.fetchError'),
        description: error.message,
        variant: 'destructive',
      });
      return customer?.orders?.edges || [];
    } finally {
      setLoading(false);
    }
  }, [customer?.email, t]);

  // Initial load
  useEffect(() => {
    const loadOrders = async () => {
      const orderData = await fetchEnhancedOrders();
      setOrders(orderData);
    };
    
    if (customer) {
      loadOrders();
    }
  }, [customer, fetchEnhancedOrders]);

  // Refresh orders

  const fetchOrderDetailsById = useCallback(async (orderId) => {
    if (!isAdminApiConfigured() || !orderId) return null;
    try {
      setLoadingDetails((prev) => new Set(prev).add(orderId));
      const data = await getOrderDetails(orderId);
      setOrderDetails((prev) => ({ ...prev, [orderId]: data || null }));
      return data || null;
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast({
        title: t('account.orders.detailError'),
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoadingDetails((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, [t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const orderData = await fetchEnhancedOrders();
      setOrders(orderData);
      toast({
        title: t('account.orders.refreshed'),
        description: t('account.orders.refreshedDescription'),
      });
    } catch (error) {
      toast({
        title: t('account.orders.refreshError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    const alreadyExpanded = newExpanded.has(orderId);
    if (alreadyExpanded) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!orderDetails[orderId] && !loadingDetails.has(orderId)) {
        fetchOrderDetailsById(orderId);
      }
    }
    setExpandedOrders(newExpanded);
  };

  // Get order status details
  const getOrderStatus = (order) => {
    const financial = order.displayFinancialStatus || order.financialStatus;
    const fulfillment = order.displayFulfillmentStatus || order.fulfillmentStatus;
    
    if (fulfillment === 'FULFILLED') {
      return { 
        status: 'delivered', 
        label: t('account.orders.status.delivered'), 
        color: 'bg-green-500', 
        icon: CheckCircle,
        progress: 100 
      };
    }
    
    if (fulfillment === 'PARTIALLY_FULFILLED' || fulfillment === 'PARTIAL') {
      return { 
        status: 'shipping', 
        label: t('account.orders.status.shipping'), 
        color: 'bg-blue-500', 
        icon: Truck,
        progress: 75 
      };
    }
    
    if (financial === 'PAID') {
      return { 
        status: 'processing', 
        label: t('account.orders.status.processing'), 
        color: 'bg-yellow-500', 
        icon: Package,
        progress: 50 
      };
    }
    
    if (financial === 'PENDING') {
      return { 
        status: 'pending', 
        label: t('account.orders.status.pending'), 
        color: 'bg-orange-500', 
        icon: Clock,
        progress: 25 
      };
    }
    
    return { 
      status: 'unknown', 
      label: t('account.orders.status.unknown'), 
      color: 'bg-gray-500', 
      icon: AlertCircle,
      progress: 0 
    };
  };

  // Get financial status color
  const getFinancialStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PENDING':
      case 'AUTHORIZED':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Get fulfillment status color
  const getFulfillmentStatusColor = (status) => {
    switch (status) {
      case 'FULFILLED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PARTIALLY_FULFILLED':
      case 'PARTIAL':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PENDING_FULFILLMENT':
      case 'IN_PROGRESS':
      case 'ON_HOLD':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'UNFULFILLED':
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getMoneyValue = (moneySet, fallbackAmount, fallbackCurrency) => {
    if (moneySet?.shopMoney) {
      return {
        amount: moneySet.shopMoney.amount,
        currencyCode: moneySet.shopMoney.currencyCode,
      };
    }
    return { amount: fallbackAmount, currencyCode: fallbackCurrency };
  };

  const resolveTranslationKey = (base, status) => {
    if (!status) return `${base}.unknown`;
    return `${base}.${status.toUpperCase()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
            {t('account.welcome', { name: customer?.firstName || customer?.displayName || 'Guest' })}
          </h1>
          <p className="text-xl text-gray-300">{t('account.orderHistory')}</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('account.orders.refresh')}
        </Button>
      </div>

      <div className="space-y-6">
        {orders?.length > 0 ? (
          orders.map(({ node: order }) => {
            const isExpanded = expandedOrders.has(order.id);
            const statusInfo = getOrderStatus(order);
            const StatusIcon = statusInfo.icon;
            const totalMoney = getMoneyValue(
              order.currentTotalPriceSet,
              order.totalPrice?.amount || order.totalPrice,
              order.currentTotalPriceSet?.shopMoney?.currencyCode || order.totalPrice?.currencyCode || order.currencyCode
            );
            const orderItemsCount = order.lineItems?.edges?.length || 0;
            const financialStatusRaw = (order.displayFinancialStatus || order.financialStatus || '').toString();
            const fulfillmentStatusRaw = (order.displayFulfillmentStatus || order.fulfillmentStatus || 'UNFULFILLED').toString();
            const financialStatusKey = resolveTranslationKey('account.financialStatus', financialStatusRaw);
            const fulfillmentStatusKey = resolveTranslationKey('account.fulfillmentStatus', fulfillmentStatusRaw);
            const financialStatusLabel = t(financialStatusKey, {
              defaultValue: financialStatusRaw ? financialStatusRaw.replace(/_/g, ' ') : t('account.orders.status.unknown'),
            });
            const fulfillmentStatusLabel = t(fulfillmentStatusKey, {
              defaultValue: fulfillmentStatusRaw ? fulfillmentStatusRaw.replace(/_/g, ' ') : t('account.orders.status.unknown'),
            });
            const details = orderDetails[order.id];
            const isDetailLoading = loadingDetails.has(order.id);
            const subtotalMoney = (details?.currentSubtotalPriceSet || order.currentSubtotalPriceSet)?.shopMoney || null;
            const shippingMoney = (details?.currentShippingPriceSet || order.currentShippingPriceSet)?.shopMoney || null;
            const taxMoney = (details?.currentTotalTaxSet || order.currentTotalTaxSet)?.shopMoney || null;
            const currenciesGuess = totalMoney?.currencyCode || subtotalMoney?.currencyCode || shippingMoney?.currencyCode || taxMoney?.currencyCode || order.currencyCode || 'GBP';
            const timeline = buildTimeline(order, details, t);
            const transactions = details?.transactions || [];
            const fulfillments = details?.fulfillments || order.fulfillments || [];

            return (
              <Card key={order.id} className="bg-gray-900 border-yellow-500/20 text-white overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
                        <StatusIcon className="h-5 w-5" />
                        {t('account.order')} #{order.confirmationNumber || order.name}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.processedAt || order.createdAt)}
                        </div>
                        {order.updatedAt !== order.createdAt && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-4 w-4" />
                            {t('account.orders.updated')} {formatDateShort(order.updatedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:items-end gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getFinancialStatusColor(financialStatusRaw)}>
                          <CreditCard className="h-3 w-3 mr-1" />
                          {financialStatusLabel}
                        </Badge>
                        <Badge className={getFulfillmentStatusColor(fulfillmentStatusRaw)}>
                          <Package className="h-3 w-3 mr-1" />
                          {fulfillmentStatusLabel}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            {formatPrice(totalMoney.amount, totalMoney.currencyCode)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {orderItemsCount} {t('account.orders.items')}
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => toggleOrderExpansion(order.id)}
                          variant="ghost"
                          size="sm"
                          className="text-yellow-400 hover:bg-yellow-500/10"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Progress */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('account.orders.progress')}</span>
                      <span className="text-yellow-400 font-medium">{statusInfo.label}</span>
                    </div>
                    <Progress value={statusInfo.progress} className="h-2" />
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0 space-y-6">
                        <Separator className="border-gray-700" />

                        {isDetailLoading && !details && (
                          <div className="flex items-center gap-3 text-sm text-gray-400 bg-gray-800/60 p-3 rounded-lg">
                            <RefreshCw className="h-4 w-4 animate-spin text-yellow-400" />
                            {t('account.orders.loadingDetails')}
                          </div>
                        )}

                        {timeline.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              {t('account.orders.timeline.title')}
                            </h4>
                            <div className="grid gap-3 md:grid-cols-2">
                              {timeline.map((step) => {
                                const StepIcon = step.icon;
                                const statusStyles = step.status === 'completed'
                                  ? 'border-green-500/30 bg-green-500/10 text-green-200'
                                  : step.status === 'current'
                                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
                                    : 'border-gray-700 bg-gray-800 text-gray-400';
                                return (
                                  <div key={`${order.id}-${step.key}`} className={`rounded-lg border px-4 py-3 space-y-2 ${statusStyles}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <StepIcon className="h-4 w-4" />
                                        <span className="font-medium">{step.label}</span>
                                      </div>
                                      {step.date && (
                                        <span className="text-xs text-gray-300">{formatDateShort(step.date)}</span>
                                      )}
                                    </div>
                                    <p className="text-xs leading-relaxed">{step.description}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                            <h4 className="font-semibold text-yellow-400">{t('account.orders.summary')}</h4>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>{t('account.orders.summarySubtotal')}</span>
                              <span>{subtotalMoney ? formatMoney(subtotalMoney.amount, subtotalMoney.currencyCode) : formatMoney(totalMoney.amount, totalMoney.currencyCode)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>{t('account.orders.summaryShipping')}</span>
                              <span>{shippingMoney ? formatMoney(shippingMoney.amount, shippingMoney.currencyCode) : formatMoney(0, currenciesGuess)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>{t('account.orders.summaryTax')}</span>
                              <span>{taxMoney ? formatMoney(taxMoney.amount, taxMoney.currencyCode) : formatMoney(0, currenciesGuess)}</span>
                            </div>
                            <Separator className="border-gray-700" />
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-yellow-300">{t('account.orders.summaryTotal')}</span>
                              <span className="font-semibold text-yellow-300">{formatMoney(totalMoney.amount, totalMoney.currencyCode)}</span>
                            </div>
                          </div>

                          {transactions.length > 0 && (
                            <div className="space-y-2 bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                              <h4 className="font-semibold text-yellow-400">{t('account.orders.payments')}</h4>
                              <div className="space-y-3">
                                {transactions.map((tx) => (
                                  <div key={tx.id} className="text-sm text-gray-300 bg-gray-900/60 border border-gray-700 rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{tx.kind} • {tx.gateway}</span>
                                      <span className="text-xs text-gray-400">{tx.createdAt ? formatDateShort(tx.createdAt) : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span>{tx.status}</span>
                                      <span>{formatMoney(tx.amount, currenciesGuess)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {t('account.orders.shippingAddress')}
                            </h4>
                            <div className="bg-gray-800 p-3 rounded-lg text-sm">
                              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                              <p>{order.shippingAddress.address1}</p>
                              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                              <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
                              <p>{order.shippingAddress.country}</p>
                            </div>
                          </div>
                        )}

                        {/* Tracking Information */}
                        {Array.isArray(order.fulfillments) && order.fulfillments.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              {t('account.orders.tracking')}
                            </h4>
                            
                            {order.fulfillments?.map((fulfillment) => (
                              <div key={fulfillment.id} className="bg-gray-800 p-3 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{fulfillment.trackingInfo?.[0]?.company || fulfillment.status}</span>
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                    {fulfillment.status}
                                  </Badge>
                                </div>
                                
                                {fulfillment.trackingInfo?.map((info) => (
                                  <div key={`${info?.company || 'carrier'}-${info?.number || 'ref'}`} className="flex items-center justify-between text-sm">
                                    <span className="font-mono">{info?.number || 'N/A'}</span>
                                    {info?.url && (
                                      <a
                                        href={info.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                                      >
                                        {t('account.orders.trackPackage')}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                                
                                {fulfillment.estimatedDeliveryAt && (
                                  <p className="text-sm text-gray-400">
                                    {t('account.orders.estimatedDelivery')}: {formatDate(fulfillment.estimatedDeliveryAt)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {t('account.orders.items')}
                          </h4>
                          
                          <div className="space-y-3">
                            {order.lineItems?.edges?.map(({ node: item }) => {
                              const unitMoney = item.originalUnitPriceSet?.shopMoney || null;
                              const lineMoney = item.discountedTotalSet?.shopMoney || (unitMoney ? { ...unitMoney, amount: (Number(item.quantity) * Number(unitMoney.amount || 0)).toFixed(2) } : null);
                              return (
                                <div key={`${item.variant?.id}-${item.title}`} className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-800 p-3 rounded-lg">
                                  {item.variant?.image?.url && (
                                    <img
                                      src={item.variant.image.url}
                                      alt={item.variant.image.altText || item.title}
                                      className="w-16 h-16 object-cover rounded-md border-2 border-gray-700"
                                    />
                                  )}
                                  <div className="flex-1 space-y-1">
                                    <p className="font-semibold text-white">{item.title}</p>
                                    {item.variant?.title && item.variant.title !== 'Default Title' && (
                                      <p className="text-sm text-gray-400">{item.variant.title}</p>
                                    )}
                                    <p className="text-sm text-gray-400">{t('account.orders.quantity')}: {item.quantity}</p>
                                  </div>
                                  <div className="text-sm text-gray-300 md:text-right">
                                    {unitMoney && (
                                      <p>{t('account.orders.priceEach')}: <span className="font-medium">{formatMoney(unitMoney.amount, unitMoney.currencyCode)}</span></p>
                                    )}
                                    {lineMoney && (
                                      <p>{t('account.orders.lineTotal')}: <span className="font-medium">{formatMoney(lineMoney.amount, lineMoney.currencyCode)}</span></p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Note */}
                        {order.note && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-400">{t('account.orders.note')}</h4>
                            <div className="bg-gray-800 p-3 rounded-lg text-sm">
                              {order.note}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-900 border border-dashed border-yellow-500/20 rounded-lg">
            <Package className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">{t('account.noOrders')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('account.noOrdersDescription')}</p>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto text-yellow-500 animate-spin mb-2" />
          <p className="text-gray-400">{t('account.orders.loading')}</p>
        </div>
      )}
    </motion.div>
  );
};

export default AccountOrders;
