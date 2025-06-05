"use client";

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import Head from 'next/head';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  Target, 
  Users2, 
  CreditCard, 
  CalendarDays, 
  BarChart2, 
  MessageSquare 
} from 'lucide-react';
import { Features } from '@/components/ui/features-8'
import { Squares } from '@/components/ui/squares-background'

// GSAP ScrollSmoother type (can be refined if more specific types are available)
interface ScrollSmoother {
  effects: (target: HTMLElement, config: object) => void;
  [key: string]: any; // For other ScrollSmoother methods/properties
}

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly');
  const router = useRouter();
  
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle the loading state
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  // Initialize GSAP ScrollSmoother
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initScrollSmoother = async () => {
      try {
        const gsapModule = await import('gsap');
        const ScrollTriggerModule = await import('gsap/ScrollTrigger');
        const ScrollSmootherModule = await import('gsap/ScrollSmoother');

        const gsap = gsapModule.default;
        gsap.registerPlugin(ScrollTriggerModule.ScrollTrigger, ScrollSmootherModule.ScrollSmoother);

        if (smoothWrapperRef.current && smoothContentRef.current) {
          ScrollSmootherModule.ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: smoothContentRef.current,
            smooth: 1.2, // Adjust for desired smoothness
            effects: true, // Enable parallax effects if needed
            smoothTouch: 0.1,
          });
        }
      } catch (error) {
        console.error("Error initializing GSAP ScrollSmoother:", error);
      }
    };

    if (!isLoading) {
      initScrollSmoother();
    }

    return () => {
      // Cleanup GSAP instances on unmount
      if (typeof window !== 'undefined') {
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
          ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        });
        import('gsap/ScrollSmoother').then(({ ScrollSmoother }) => {
          const smoother = ScrollSmoother.get();
          if (smoother) smoother.kill();
        });
      }
    };
  }, [isLoading]);

  

  const heroTextVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const heroChildVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };
  
  const heroImageVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1],
        delay: delay
      }
    })
  };

  const fadeInVariant = {
    hidden: { opacity: 0 },
    visible: (delay = 0) => ({
      opacity: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay: delay
      }
    })
  };

  const scaleInVariant = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (delay = 0) => ({
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay: delay
      }
    })
  };

  const AnimatedSection = ({ children, className = "", id }: AnimatedSectionProps) => {
    const [ref, inView] = useInView({
      triggerOnce: false,
      threshold: 0.2,
      rootMargin: "-100px 0px"
    });

    return (
      <motion.section
        id={id}
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={fadeInUpVariant}
        className={className}
      >
        {children}
      </motion.section>
    );
  };

  if (isLoading) {
    return <PageLoader text="Loading MissionBoard..." />;
  }

  const handleGetStarted = () => {
    router.push('/auth/signin');
  };

  const scrollToSection = (id: string) => {
    if (typeof window !== 'undefined') {
      import('gsap').then(gsapModule => {
        import('gsap/ScrollToPlugin').then(ScrollToPluginModule => {
          const gsap = gsapModule.default;
          gsap.registerPlugin(ScrollToPluginModule.ScrollToPlugin);
          gsap.to(window, { duration: 1, scrollTo: `#${id}`, ease: 'power2.inOut' });
        });
      });
    }
  };

  const faqs = [
    {
      id: "faq-1",
      question: "How easy is it to get started with MissionBoard?",
      answer: "Getting started with MissionBoard is extremely straightforward. Simply sign up for an account, invite your team members, and begin creating your first mission or event. Our intuitive interface requires no technical expertise, and we offer comprehensive onboarding resources including video tutorials and documentation. Most teams are up and running within minutes."
    },
    {
      id: "faq-2",
      question: "Can I integrate MissionBoard with other tools?",
      answer: "Absolutely! MissionBoard offers seamless integration with popular tools like Slack, Google Workspace, Microsoft Office 365, Zapier, and many more. Our open API also allows for custom integrations with your existing workflows and systems. The Professional and Enterprise plans include more advanced integration capabilities."
    },
    {
      id: "faq-3",
      question: "Is my data secure with MissionBoard?",
      answer: "Security is our top priority. MissionBoard employs industry-leading security measures, including end-to-end encryption, regular security audits, and compliance with global data protection regulations. Your data is backed up regularly and stored in secure, geographically distributed data centers. Our Enterprise plan offers additional security features including SSO, custom data retention policies, and dedicated environments."
    },
    {
      id: "faq-4",
      question: "Can I change plans as my team grows?",
      answer: "Yes, you can upgrade or downgrade your plan at any time to accommodate your team's evolving needs. When upgrading, you'll be prorated for the remainder of your billing cycle. Our flexible pricing ensures you only pay for what you need, and all your missions, events, and data seamlessly transfer when you change plans."
    },
    {
      id: "faq-5",
      question: "Do you offer discounts for non-profits or educational institutions?",
      answer: "Yes, we offer special pricing for qualifying non-profit organizations and educational institutions. Contact our sales team to learn more about our discount programs and how we can support your organization's mission."
    },
    {
      id: "faq-6",
      question: "What kind of support do you offer?",
      answer: "All plans include access to our comprehensive help center and community forum. The Starter plan includes email support with a 24-hour response time. Professional plans add priority support with faster response times and scheduled onboarding calls. Enterprise customers receive dedicated account management, 24/7 phone support, and custom training sessions for your team."
    }
  ];

  const integrationLogos = [
    { name: "Slack", logo: "/logos/slack.svg" },
    { name: "Google", logo: "/logos/google.svg" },
    { name: "Microsoft", logo: "/logos/microsoft.svg" },
    { name: "GitHub", logo: "/logos/github.svg" },
    { name: "Jira", logo: "/logos/jira.svg" },
    { name: "Notion", logo: "/logos/notion.svg" },
    { name: "Zapier", logo: "/logos/zapier.svg" },
    { name: "Figma", logo: "/logos/figma.svg" }
  ];


  
  
  // Generic Icon component for How It Works (example)
  const Icon = ({ name, className }: { name: string; className?: string }) => {
    const SvgIcon = {
      Lightbulb: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
      Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
      Award: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
    }[name];
    if (!SvgIcon) return null;
    return <SvgIcon />;
  };


  return (
    <>
      

      <div id="smooth-wrapper" ref={smoothWrapperRef} className="min-h-screen overflow-x-hidden font-body bg-[#09090B]">
        <div id="smooth-content" ref={smoothContentRef}>
          <div className="bg-gradient-to-b from-[#09090B] via-[#09090B] to-[#09090B] text-foreground">
            {/* Modern Floating Header */}
            <motion.header 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className={cn(
                "fixed left-0 right-0 z-50 mx-auto px-4 sm:px-6 transition-all duration-500",
                isScrolled ? "top-2" : "top-4"
              )}
            >
              <div className={cn(
                "mx-auto max-w-7xl rounded-2xl backdrop-blur-xl border border-white/[0.08]",
                isScrolled 
                  ? "bg-[#09090B]/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-3" 
                  : "bg-[#09090B]/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-4"
              )}>
                <div className="flex justify-between items-center px-6">
                  <div 
                    className="flex items-center cursor-pointer group"
                    onClick={() => router.push('/')}
                  >
                    <Image src="/appicon.png" alt="MissionBoard Logo" width={42} height={42} className="rounded-xl group-hover:scale-95 transition-transform duration-300 mr-1" />
                    <h1 className="text-xl font-semibold font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      MissionBoard
                    </h1>
                  </div>
                  
                  <nav className="hidden md:flex items-center space-x-8">
                    {/* <a 
                      href="#features" 
                      onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
                      className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >Working</a> */}
                    <a 
                    href="/discover-events"
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >Events</a>
                    
                    <a 
                      href="#faqs" 
                      onClick={(e) => { e.preventDefault(); scrollToSection('faqs'); }}
                      className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >FAQs</a>
                  </nav>
                  
                  <div className="flex items-center space-x-4">
                    {status === 'authenticated' ? (
                      <Button 
                        onClick={() => router.push('/dashboard')}
                        className="bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl px-6 py-2.5 transition-all duration-300"
                      >
                        Dashboard
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={handleGetStarted}
                          variant="outline" 
                          className="font-medium rounded-xl px-6 py-2.5 border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hidden md:block"
                        >
                          Sign In
                        </Button>
                        <Button 
                          onClick={handleGetStarted}
                          className="font-medium rounded-xl px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
                        >
                          Get Started
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.header>

            {/* Hero Section */}
            <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 px-4 sm:px-6 overflow-hidden">
            
              
              <div className="absolute inset-0 z-0">
                
          
                <Squares 
                  direction="diagonal"
                  className="opacity-30"
                  speed={0.1}
                  squareSize={80}
                  borderColor="#252525" 
                  hoverFillColor="#313131"
                />
              </div>

              <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-8 md:gap-4 lg:gap-8 md:items-center relative z-10">
                <motion.div 
                  className="md:col-span-2 space-y-6 md:space-y-8 text-center md:text-left order-1 md:order-1"
                  variants={heroTextVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div 
                    variants={heroChildVariants}
                    className="inline-flex items-center gap-x-2 bg-[#1A1A1F] backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm font-medium text-white/90 mb-4 md:mb-6 mx-auto md:mx-0"
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </span>
                    Early Access Launching June 2025
                  </motion.div>

                  <motion.h1 
                    variants={heroChildVariants} 
                    className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight !leading-[1.1] md:!leading-[1.05] text-white font-heading"
                  >
                    Simplify Your
                    <br />
                    <motion.span 
                      className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary"
                      animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                      style={{ backgroundSize: '200%' }}
                    >
                      Team&apos;s Mission
                    </motion.span>
                  </motion.h1>

                  <motion.p 
                    variants={heroChildVariants} 
                    className="text-lg sm:text-xl text-white/80 max-w-lg mx-auto md:mx-0 leading-relaxed"
                  >
                    Track members, collect dues, plan events — your all-in-one mission control panel.
                  </motion.p>

                  <motion.div 
                    variants={heroChildVariants} 
                    className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start"
                  >
                    <motion.div whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.96 }}>
                      <Button 
                        onClick={status === 'authenticated' 
                          ? () => router.push('/dashboard')
                          : handleGetStarted
                        }
                        size="lg" 
                        className="bg-white text-[#0A0A0B] hover:bg-white/90 shadow-[0_8px_16px_rgba(255,255,255,0.1)] transition-all duration-300 ease-out hover:shadow-xl h-14 px-8 rounded-xl text-lg font-medium"
                      >
                        {status === 'authenticated' ? 'Go to Dashboard' : 'Get Started'}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.96 }}>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white shadow-md transition-all duration-300 ease-out hover:shadow-lg h-14 px-8 rounded-xl text-lg font-medium"
                        onClick={() => { scrollToSection('features'); }}
                      >
                        Learn More
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  variants={heroImageVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative h-[500px] sm:h-[610px] w-full order-2 md:order-2 md:col-span-3"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="relative w-[150%] h-[90%] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 30px 60px rgba(0,0,0,0.12), 0 10px 30px rgba(0,0,0,0.12)"
                      }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {/* Top floating card */}
                      <motion.div 
                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] h-auto backdrop-blur-md bg-white/5 rounded-xl border border-white/15 shadow-xl p-4 z-20 transform rotate-[-5deg] opacity-90 hover:opacity-100 transition-opacity duration-300"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ 
                          y: -5, 
                          rotate: -3,
                          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">M</div>
                          <div className="flex-1">
                            <div className="h-2.5 bg-white/30 rounded-full w-24 mb-2"></div>
                            <div className="h-2 bg-white/20 rounded-full w-16"></div>
                          </div>
                          <div className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full font-medium border border-green-500/30">Mission Active</div>
                        </div>
                      </motion.div>
                        
                      {/* Main dashboard mockup */}
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-2xl overflow-hidden z-10 border border-white/10">
                        <div className="h-14 border-b border-white/10 flex items-center px-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 10.5L11 12.5L16 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-white">Mission Dashboard</span>
                          </div>
                          <div className="ml-auto flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                              <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-medium border-2 border-background shadow-sm">
                              A
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-sm font-medium text-white/90">Missions Overview</div>
                                <div className="bg-primary/20 rounded-full h-7 w-7 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-white/70">Active</div>
                                    <div className="text-xs font-medium text-white/90">72%</div>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: "72%" }}></div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-white/70">Completed</div>
                                    <div className="text-xs font-medium text-white/90">24%</div>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full rounded-full" style={{ width: "24%" }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-sm font-medium text-white/90">Team Activity</div>
                                <div className="bg-purple-500/20 rounded-full h-7 w-7 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background flex items-center justify-center text-xs text-white font-medium">AS</div>
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 border-2 border-background flex items-center justify-center text-xs text-white font-medium">JD</div>
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 border-2 border-background flex items-center justify-center text-xs text-white font-medium">MK</div>
                                  <div className="h-8 w-8 rounded-full bg-white/20 border-2 border-background flex items-center justify-center text-xs text-white font-medium"><div>+4</div></div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg">
                                  Invite
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-sm font-medium text-white/90">Upcoming Activities</div>
                              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-lg">
                                View All
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                                <div className="flex items-center space-x-3">
                                  <div className="h-5 w-5 rounded bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                    <svg className="h-3 w-3 text-green-500" viewBox="0 0 24 24" fill="none">
                                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <span className="text-sm text-white/80">Finalize Q3 Mission Plan</span>
                                </div>
                                <span className="text-xs text-white/50">Yesterday</span>
                              </div>
                              
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                                <div className="flex items-center space-x-3">
                                  <div className="h-5 w-5 rounded bg-white/10 border border-white/30 flex items-center justify-center">
                                  </div>
                                  <span className="text-sm text-white/80">Coordinate Volunteer Schedules</span>
                                </div>
                                <span className="text-xs text-white/50">Today</span>
                              </div>
                              
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                                <div className="flex items-center space-x-3">
                                  <div className="h-5 w-5 rounded bg-white/10 border border-white/30 flex items-center justify-center">
                                  </div>
                                  <span className="text-sm text-white/80">Send Event Invitations</span>
                                </div>
                                <span className="text-xs text-white/50">Tomorrow</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom notification */}
                      <motion.div 
                        className="absolute -bottom-12 right-8 w-[75%] backdrop-blur-md bg-white/5 rounded-xl border border-white/15 shadow-xl p-3 z-20 transform rotate-[3deg] opacity-90 hover:opacity-100 transition-opacity duration-300"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ 
                          y: -5, 
                          rotate: 1,
                          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">New Event Scheduled!</div>
                            <div className="text-xs text-white/60">Team meetup next Friday.</div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div> {/* End of right column mockup */}
              </div> {/* End of Hero Grid */}
            </section> {/* End of Hero Section */}

            {/* How It Works Section */}
            {/* <AnimatedSection id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 bg-[#121212] relative">
              <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
              <span className="inline-block mb-4 px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary">
                    Working
                  </span>
                <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">How It Works</h2>
                <p className="text-xl text-muted-foreground">Understand the architecture and flow</p>
              </div>
              <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px 0px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image src="/architecturediagram.svg" alt="Architecture Diagram" layout="responsive" width={500} height={500} className="w-full h-auto -mt-10" />
                </motion.div>
              </div>
            </AnimatedSection> */}

            {/* FAQs Section */}
            <AnimatedSection id="faqs" className="py-16 md:py-24 px-4 sm:px-6 bg-[#050505] relative">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-[#050505] to-[#020202]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.05),transparent_70%)] ml-[50px]" />
               
              </div>
              <div className="max-w-3xl mx-auto text-center mb-16 relative z-10">
              <span className="inline-block mb-4 px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary">
                    Want to know more?
                  </span>
                <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
                <p className="text-xl text-muted-foreground">Everything you need to know about MissionBoard</p>
              </div>
              <div className="max-w-4xl mx-auto relative z-10">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px 0px" }}
                      transition={{ 
                        duration: 0.7, 
                        ease: [0.22, 1, 0.36, 1],
                        delay: index * 0.1
                      }}
                    >
                      <AccordionItem value={faq.id} className="border-b border-white/10">
                        <AccordionTrigger className="py-5 text-xl font-medium text-white hover:text-primary text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-lg text-muted-foreground pb-5 px-1">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </div>
            </AnimatedSection>

            {/* CTA Section */}
          <AnimatedSection className="py-16 md:py-24 px-4 sm:px-6 relative bg-[#09090B]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_60%)]" />
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/[0.02] to-transparent" />
              <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/[0.02] to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="relative rounded-3xl overflow-hidden"
                whileHover={{ 
                  scale: 1.01,
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                }}
              >
                <motion.div 
                  className="absolute inset-0"
                  initial={{ opacity: 0.8 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-background opacity-80" />
                  <motion.div 
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]"
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
                  <motion.div
                    className="space-y-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px 0px" }}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.2
                        }
                      }
                    }}
                  >
                    <motion.div 
                      variants={fadeInUpVariant}
                      className="inline-flex items-center justify-center px-4 py-1.5 mb-4 border border-primary/20 rounded-full bg-primary/10 backdrop-blur-sm"
                    >
                      <span className="text-sm font-medium text-primary">Join thousands of teams</span>
                    </motion.div>
                    
                    <motion.h2 
                      variants={fadeInUpVariant}
                      className="text-4xl sm:text-5xl font-bold max-w-2xl mx-auto leading-tight"
                    >
                      Ready to Elevate Your{" "}
                      <motion.span 
                        className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary"
                        animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        style={{ backgroundSize: '200%' }}
                      >
                        Project Management
                      </motion.span>
                      ?
                    </motion.h2>
                    
                    <motion.p 
                      variants={fadeInUpVariant}
                      className="text-lg sm:text-xl text-muted-foreground/90 max-w-2xl mx-auto"
                    >
                      Join thousands of successful teams transforming their workflow with MissionBoard.
                    </motion.p>

                    <motion.div 
                      variants={fadeInUpVariant}
                      className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
                    >
                      <motion.div whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.96 }}>
                        <Button
                          onClick={status === 'authenticated' 
                            ? () => router.push('/dashboard')
                            : handleGetStarted
                          }
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-14 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                        >
                          {status === 'authenticated' ? 'Go to Your Dashboard' : 'Get Started'}
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.96 }}>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-primary/20 bg-background/50 hover:bg-background/80 backdrop-blur-sm text-lg h-14 px-8 rounded-xl transition-all duration-200"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              import('gsap').then(gsapModule => {
                                import('gsap/ScrollToPlugin').then(ScrollToPluginModule => {
                                  const gsap = gsapModule.default;
                                  gsap.registerPlugin(ScrollToPluginModule.ScrollToPlugin);
                                  gsap.to(window, { duration: 1, scrollTo: "#features", ease: 'power2.inOut' });
                                });
                              });
                            }
                          }}
                        >
                          Learn More
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 border-t border-white/[0.08] bg-[#09090B]/70 relative">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.02),transparent_50%)]" />
              </div>
              <div className="max-w-7xl mx-auto relative">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px 0px" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12"
                >
                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center group cursor-pointer" 
                      onClick={() => router.push('/')}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image src="/appicon.png" alt="MissionBoard Logo" width={40} height={40} className="rounded-xl group-hover:scale-95 transition-transform duration-300 mr-1" />
                      <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 -mr-8">
                        MissionBoard
                      </h1>
                    </motion.div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      Streamlining management tools for small organizations.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground/90">Product</h3>
                    <ul className="space-y-3">
                      {/* <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Working
                        </a>
                      </motion.li> */}
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Pricing
                        </a>
                      </motion.li>
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Changelog
                        </a>
                      </motion.li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground/90">Company</h3>
                    <ul className="space-y-3">
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          About Us
                        </a>
                      </motion.li>
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Blog
                        </a>
                      </motion.li>
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Careers
                        </a>
                      </motion.li>
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Contact
                        </a>
                      </motion.li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground/90">Legal</h3>
                    <ul className="space-y-3">
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Privacy Policy
                        </a>
                      </motion.li>
                      <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                          <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Terms of Service
                        </a>
                      </motion.li>
                    </ul>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="border-t border-border/20 pt-8 flex flex-col sm:flex-row justify-between items-center"
                >
                  <p className="text-sm text-muted-foreground order-2 sm:order-1">
                    © {new Date().getFullYear()} MissionBoard. All rights reserved.
                  </p>
                  <div className="text-sm text-muted-foreground order-1 sm:order-2">
                    A project by <motion.a 
                      href="http://akshatsingh.xyz" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      Akshat Singh
                    </motion.a>
                  </div>
                </motion.div>
              </div>
            </footer>
          </div> {/* End of bg-gradient-to-b */}
        </div> {/* End of smooth-content */}
      </div> {/* End of smooth-wrapper */}
    </>
  );
}
