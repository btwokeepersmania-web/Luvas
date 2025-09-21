import React from 'react';
import { Navigate } from 'react-router-dom';

const AccountPage = () => {
  return <Navigate to="/account/orders" replace />;
};

export default AccountPage;