import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Instagram, Youtube, Mail, Phone, MapPin, Loader2, Navigation, FacebookIcon, X, XIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast.js';
import Map from '@/components/Map.jsx';
import AnimatedGradientText from '@/components/ui/animated-gradient-text.jsx';

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);


const Contact = () => {
  const { t } = useTranslation();
  const form = useRef();
  const [isSending, setIsSending] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSending(true);

    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceID || serviceID === 'YOUR_SERVICE_ID' || !templateID || !publicKey) {
      toast({
        title: t('contact.toast.notConfigured.title'),
        description: t('contact.toast.notConfigured.description'),
        variant: "destructive",
        duration: 5000,
      });
      setIsSending(false);
      return;
    }

    emailjs.sendForm(serviceID, templateID, form.current, publicKey)
      .then((result) => {
          toast({
            title: t('contact.toast.success.title'),
            description: t('contact.toast.success.description'),
            variant: "default",
          });
          e.target.reset();
      }, (error) => {
          toast({
            title: t('contact.toast.error.title'),
            description: t('contact.toast.error.description'),
            variant: "destructive",
          });
          console.error('EmailJS error:', error.text);
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/b2_gkgloves/', color: 'hover:text-pink-400' },
    { icon: FacebookIcon, label: 'Facebook', href: 'https://www.facebook.com/Bgkgloves?rdid=M9Tta4be4yEtmKFT&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16qSQQDAy6%2F#', color: 'hover:text-blue-600' },
    { icon: TikTokIcon, label: 'TikTok', href: 'https://www.tiktok.com/@b2_gkgloves?_t=ZN-8zVPv2KJIdq&_r=1', color: 'hover:text-black' },
    { icon: X, label: 'X', href: 'https://x.com/BGkgloves', color: 'hover:text-black' },
    { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@B2Goalkeeping-by4co/featured', color: 'hover:text-red-400' },
    { icon: Navigation, label: 'Google Search', href: 'https://www.google.com/search?hl=en&sxsrf=AE3TifP24onLSPPKTIC2XZh5zMGSiyYy-A:1757177017774&kgmid=/g/11pz_6nzff&q=B2+GK+Gloves&shndl=30&shem=lcuae,lsptbl1,uaasie,shrtsdl&kgs=334c03a37bcf03b0', color: 'hover:text-green-500' } // Placeholder link
  ];

  const contactInfo = [
    { icon: Mail, label: t('contact.info.email.label'), value: 'btwokeepersmania@gmail.com', href: 'mailto:btwokeepersmania@gmail.com' },
    { icon: Phone, label: t('contact.info.phone.label'), value: '+44 7535 433489', href: 'tel:+447535433489' },
    { icon: MapPin, label: t('contact.info.location.label'), value: 'B2 GK Gloves, 10 Wigley St, Manchester M12 5BA, United Kingdom', href: 'https://www.google.com/maps/dir//10+Wigley+St,+Manchester+M12+5BA,+United+Kingdom/@53.4703821,-2.2873016,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x487bb10a51207f25:0x7529e7a0dfd4e08c!2m2!1d-2.2049016!2d53.4704104?hl=en&entry=ttu&g_ep=EgoyMDI1MDkwMy4wIKXMDSoASAFQAw%3D%3D' }
  ];

  const location = {
    lat: 53.4704104,
    lng: -2.2049016,
    address: "10 Wigley St, Manchester M12 5BA, UK"
  };

  

  return (
    <section id="contato" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedGradientText className="text-4xl md:text-5xl mb-6">
            {t('contact.title')}
          </AnimatedGradientText>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            {t('contact.subtitle')}
          </motion.p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">{t('contact.form.title')}</h3>
              <form ref={form} onSubmit={sendEmail} className="space-y-6">
                <input type="text" name="_honeypot" className="hidden" tabIndex="-1" autoComplete="off" aria-hidden="true" />
                <div>
                  <Input
                    type="text"
                    name="user_name"
                    placeholder={t('contact.form.name')}
                    required
                    aria-label={t('contact.form.name')}
                    className="bg-gray-800 border-yellow-500/30 text-white placeholder:text-gray-400 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    name="user_email"
                    placeholder={t('contact.form.email')}
                    required
                    aria-label={t('contact.form.email')}
                    className="bg-gray-800 border-yellow-500/30 text-white placeholder:text-gray-400 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    name="subject"
                    placeholder={t('contact.form.subject') || 'Subject'}
                    aria-label={t('contact.form.subject') || 'Subject'}
                    className="bg-gray-800 border-yellow-500/30 text-white placeholder:text-gray-400 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <Textarea
                    name="message"
                    placeholder={t('contact.form.message')}
                    required
                    rows={6}
                    aria-label={t('contact.form.message')}
                    className="bg-gray-800 border-yellow-500/30 text-white placeholder:text-gray-400 focus:border-yellow-500 resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-[0_0_20px_rgba(234,179,8,0.25)]" disabled={isSending}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSending ? t('contact.form.sending') : t('contact.form.submit')}
                </Button>
              </form>
            </div>
            <div className="space-y-4 pt-6">
              <h4 className="text-xl font-semibold text-white mb-4">{t('contact.info.title')}</h4>
              {contactInfo.map((info, index) => (
                <motion.a key={index} href={info.href} target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group">
                  <info.icon className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300" />
                  <div>
                    <div className="text-sm text-gray-400">{info.label}</div>
                    <div className="text-white group-hover:text-yellow-400 transition-colors">{info.value}</div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="space-y-8 flex flex-col">
            <div className="relative z-0 rounded-2xl overflow-hidden aspect-video border-2 border-yellow-500/30 flex-grow">
              <Map location={location} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button asChild size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-2 h-5 w-5" />
                  {t('contact.getDirections')}
                </a>
              </Button>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">{t('contact.social.title')}</h3>
              <div className="flex space-x-6">
                {socialLinks.map((social, index) => (
                  <motion.a key={index} href={social.href} target="_blank" rel="noopener noreferrer" onClick={(e) => handleSocialClick(e, social.href)} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full border border-yellow-500/30 hover:border-yellow-500 transition-all ${social.color}`}>
                    <social.icon className="h-8 w-8" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
