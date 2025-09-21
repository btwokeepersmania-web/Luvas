import React from 'react';
import Hero from '@/components/Hero.jsx';
import Collections from '@/components/Collections.jsx';
import About from '@/components/About.jsx';
import Reviews from '@/components/Reviews.jsx';
import SocialMediaFeed from '@/components/SocialMedia.jsx';
import EmailSubscription from '@/components/EmailSubscription.jsx';
import Contact from '@/components/Contact.jsx';

const HomePage = () => {
  return (
    <>
      <Hero />
      <Collections />
      <About />
      <Reviews />
      <SocialMediaFeed />
      <Contact />
      <EmailSubscription />
    </>
  );
};

export default HomePage;