"use client";

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { MemberRole } from '@/lib/generated/prisma';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

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

  // Framer Motion variants
  const heroTextVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const heroChildVariants = {
    hidden: { opacity: 0, y: 15, filter: 'blur(3px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: "circOut" }
    }
  };
  
  const heroImageVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.9, delay: 0.4, ease: "circOut" }
    }
  };

  const AnimatedSection = ({ children, className = "", id }: AnimatedSectionProps) => {
    return (
      <section
        id={id}
        className={className}
      >
        {children}
      </section>
    );
  };

  if (isLoading) {
    return <PageLoader text="Loading MissionBoard..." />;
  }

  const handleGetStarted = () => {
    router.push('/auth/signin');
  };

  return (
    <div id="smooth-wrapper" ref={smoothWrapperRef} className="min-h-screen overflow-x-hidden">
      <div id="smooth-content" ref={smoothContentRef}>
        <div className="bg-gradient-to-b from-background to-background/95 text-foreground">
          {/* Modern Floating Header */}
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className={cn(
              "fixed left-0 right-0 z-50 mx-auto px-4 sm:px-6 transition-all duration-500",
              isScrolled ? "top-2" : "top-4"
            )}
          >
            <div className={cn(
              "mx-auto max-w-7xl rounded-2xl backdrop-blur-xl border border-white/10",
              isScrolled 
                ? "bg-background/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-3" 
                : "bg-background/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] py-4"
            )}>
              <div className="flex justify-between items-center px-6">
                <div 
                  className="flex items-center cursor-pointer group"
                  onClick={() => router.push('/')}
                >
                  <Image src="/appicon.png" alt="MissionBoard Logo" width={42} height={42} className="rounded-xl group-hover:scale-95 transition-transform duration-300 mr-1" />
                  <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                    MissionBoard
                  </h1>
                </div>
                
                <nav className="hidden md:flex items-center space-x-8">
                  <a 
                    href="#features" 
                    onClick={(e) => {
                      e.preventDefault();
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
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >Features</a>
                  <a 
                    href="/discover-events"
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >Events</a>
                  <a 
                    href="#testimonials" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (typeof window !== 'undefined') {
                        import('gsap').then(gsapModule => {
                          import('gsap/ScrollToPlugin').then(ScrollToPluginModule => {
                            const gsap = gsapModule.default;
                            gsap.registerPlugin(ScrollToPluginModule.ScrollToPlugin);
                            gsap.to(window, { duration: 1, scrollTo: "#testimonials", ease: 'power2.inOut' });
                          });
                        });
                      }
                    }}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >Testimonials</a>
                  <a 
                    href="#pricing" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (typeof window !== 'undefined') {
                        import('gsap').then(gsapModule => {
                          import('gsap/ScrollToPlugin').then(ScrollToPluginModule => {
                            const gsap = gsapModule.default;
                            gsap.registerPlugin(ScrollToPluginModule.ScrollToPlugin);
                            gsap.to(window, { duration: 1, scrollTo: "#pricing", ease: 'power2.inOut' });
                          });
                        });
                      }
                    }}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >Pricing</a>
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
                    <Button 
                      onClick={handleGetStarted}
                      variant="outline" 
                      className="font-medium rounded-xl px-6 py-2.5 border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.header>

          {/* Hero Section */}
          <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 sm:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-zinc-950" />
            <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-white/5 rounded-full blur-3xl -translate-x-2/3 -translate-y-2/3 opacity-50" />
            <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-30" />
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 md:items-start items-center relative z-10">
              <motion.div 
                className="space-y-8 md:space-y-10 text-center md:text-left"
                variants={heroTextVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Launching Soon Capsule */}
                <motion.div 
                  variants={heroChildVariants} 
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-x-2 bg-neutral-700/20 border border-neutral-600 rounded-full px-4 py-1.5 text-sm font-medium text-neutral-200 mb-4 md:mb-6 mx-auto md:mx-0"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  Launching soon
                </motion.div>

                <motion.h1 
                  variants={heroChildVariants} 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight !leading-[1.15] md:!leading-[1.1]"
                >
                  Manage Your Projects
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
                    with Precision
                  </span>
                </motion.h1>
                <motion.p 
                  variants={heroChildVariants} 
                  className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed"
                >
                  MissionBoard helps teams collaborate, track progress, and deliver exceptional results, all in one powerful platform.
                </motion.p>
                <motion.div 
                  variants={heroChildVariants} 
                  className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start"
                >
                  <Button 
                    onClick={status === 'authenticated' 
                      ? () => router.push('/dashboard')
                      : handleGetStarted
                    }
                    size="lg" 
                    className="bg-white text-background hover:bg-white/90 shadow-[0_8px_16px_rgba(0,0,0,0.2)] transform hover:scale-[0.98] transition-all duration-300 ease-out hover:shadow-lg h-14 px-8 rounded-xl text-lg"
                  >
                    {status === 'authenticated' ? 'Go to Dashboard' : 'Get Started Free'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white/10 bg-background/50 hover:bg-white/5 text-white shadow-md transform hover:scale-[0.98] transition-all duration-300 ease-out hover:shadow-lg h-14 px-8 rounded-xl text-lg"
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
              
              <motion.div 
                variants={heroImageVariants}
                initial="hidden"
                animate="visible"
                className="relative h-[450px] sm:h-[510px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111] backdrop-blur-sm flex items-center justify-center p-3"
              >
                <div className="w-full h-full bg-background backdrop-blur-sm rounded-xl border border-white/10 shadow-inner p-6 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.08),transparent_25%)]" />
                  <div className="h-6 flex items-center space-x-2 mb-6">
                    <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                    <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/[0.08]">
                        <div className="text-xl font-semibold text-white/90">7</div>
                        <div className="text-xs text-white/50 mt-1">Total Users</div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/[0.08]">
                        <div className="text-xl font-semibold text-white/90">3</div>
                        <div className="text-xs text-white/50 mt-1">Active Plans</div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/[0.08]">
                        <div className="text-xl font-semibold text-white/90">12</div>
                        <div className="text-xs text-white/50 mt-1">Events</div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/[0.08]">
                        <div className="text-xl font-semibold text-white/90">$1.2k</div>
                        <div className="text-xs text-white/50 mt-1">Revenue</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center border border-white/[0.08] hover:bg-white/10 transition-colors group cursor-pointer">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:bg-white/20 transition-colors">
                          <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="text-sm text-white/80 group-hover:text-white/90 transition-colors">Add User</div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center border border-white/[0.08] hover:bg-white/10 transition-colors group cursor-pointer">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:bg-white/20 transition-colors">
                          <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="text-sm text-white/80 group-hover:text-white/90 transition-colors">Create Plan</div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center border border-white/[0.08] hover:bg-white/10 transition-colors group cursor-pointer">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:bg-white/20 transition-colors">
                          <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-sm text-white/80 group-hover:text-white/90 transition-colors">Schedule</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-white/90">Recent Users</div>
                        <div className="text-xs text-[#3B82F6] cursor-pointer hover:text-[#60A5FA] transition-colors">View All</div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/[0.08] hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-white font-medium border border-white/[0.08]">A</div>
                            <div>
                              <div className="text-sm text-white/90">Akshat</div>
                              <div className="text-xs text-white/50">Admin</div>
                            </div>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/[0.08] hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/30 to-green-500/30 flex items-center justify-center text-white font-medium border border-white/[0.08]">AS</div>
                            <div>
                              <div className="text-sm text-white/90">Akshat Singh</div>
                              <div className="text-xs text-white/50">Member</div>
                            </div>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <AnimatedSection id="features" className="py-16 md:py-24 px-4 sm:px-6 bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(120,119,198,0.03),transparent_25%)]" />
            <div className="max-w-7xl mx-auto relative">
              <div className="text-center mb-16 md:mb-20">
                <div
                  className="inline-block mb-6 px-4 py-1.5 bg-neutral-700/20 border border-neutral-600 rounded-full text-sm font-medium text-neutral-200"
                >
                  Features
                </div>
                <h2 
                  className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white"
                >
                  Powerful Features, Effortless Management
                </h2>
                <p 
                  className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                  MissionBoard provides everything you need to manage projects effectively, from start to finish.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    title: "Intuitive Dashboards",
                    description: "Get a clear overview of all your projects with customizable, easy-to-understand dashboards.",
                    icon: "📊"
                  },
                  {
                    title: "Seamless Collaboration",
                    description: "Work together in real-time with shared tasks, comments, and instant notifications.",
                    icon: "👥"
                  },
                  {
                    title: "Smart Resource Allocation",
                    description: "Efficiently assign and track resources across projects to maximize productivity.",
                    icon: "⚙️"
                  },
                  {
                    title: "Insightful Progress Tracking",
                    description: "Monitor milestones and deadlines with interactive charts and detailed reports.",
                    icon: "📈"
                  },
                  {
                    title: "Flexible Workflows",
                    description: "Adapt MissionBoard to your team's unique processes with customizable workflows.",
                    icon: "🔄"
                  },
                  {
                    title: "Comprehensive Reporting",
                    description: "Generate in-depth reports to share insights with stakeholders and your team.",
                    icon: "📝"
                  }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="group relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 will-change-transform overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Testimonials Section */}
          <AnimatedSection id="testimonials" className="py-16 md:py-24 px-4 sm:px-6 bg-black/30 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.03),transparent_25%)]" />
            <div className="max-w-7xl mx-auto relative">
              <div className="text-center mb-16 md:mb-20">
                <h2 
                  className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white"
                >
                  Loved by Teams Worldwide
                </h2>
                <p 
                  className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                  Hear what our satisfied users have to say about their experience with MissionBoard.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    quote: "MissionBoard has revolutionized how our team manages complex projects. Productivity is up by over 30%!",
                    author: "Alex P.",
                    role: "Project Lead, Innovate Solutions"
                  },
                  {
                    quote: "The user-friendly interface made onboarding a breeze. Our entire team was up and running in days, not weeks.",
                    author: "Maria S.",
                    role: "Operations Manager, BuildCo"
                  },
                  {
                    quote: "I can finally see the big picture and drill down into specifics without getting lost. This tool is a game-changer.",
                    author: "David K.",
                    role: "Director, Tech Forward Inc."
                  }
                ].map((testimonial, index) => (
                  <div 
                    key={index}
                    className="group relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-lg will-change-transform h-full flex flex-col overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex-grow">
                      <div className="text-4xl text-white/80 mb-4">❝</div>
                      <p className="mb-6 text-white/80 leading-relaxed italic">{`"${testimonial.quote}"`}</p>
                      <div className="pt-4 border-t border-white/10">
                        <p className="font-semibold text-white/90">{testimonial.author}</p>
                        <p className="text-sm text-white/60 mt-1">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Pricing Section */}
          <AnimatedSection id="pricing" className="py-16 md:py-24 px-4 sm:px-6 bg-background relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)]" />
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2" />
            </div>

            <div className="max-w-7xl mx-auto relative">
              <div className="text-center mb-16 md:mb-20">
                <div
                  className="inline-block mb-4 px-4 py-1.5 bg-white/5 rounded-full text-sm font-medium text-white/80"
                >
                  Flexible Plans
                </div>
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white"
                >
                  Simple, Transparent Pricing
                </h2>
                <p 
                  className="text-lg text-white/70 max-w-2xl mx-auto"
                >
                  Choose the plan that&apos;s right for your team. No hidden fees, no surprises.
                </p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8">
                {[
                  {
                    name: "Starter",
                    price: "$29",
                    description: "Perfect for small teams getting started with project management.",
                    features: [
                      "Up to 5 team members",
                      "3 active projects",
                      "Basic reporting",
                      "Email support",
                      "1GB storage",
                      "Basic integrations"
                    ]
                  },
                  {
                    name: "Professional",
                    price: "$79",
                    description: "Ideal for growing teams needing advanced features and support.",
                    features: [
                      "Up to 20 team members",
                      "Unlimited projects",
                      "Advanced reporting & analytics",
                      "Priority support",
                      "20GB storage",
                      "Advanced integrations",
                      "Custom workflows",
                      "Team training"
                    ],
                    popular: true
                  },
                  {
                    name: "Enterprise",
                    price: "Contact Us",
                    description: "Tailored solutions for large organizations with custom needs.",
                    features: [
                      "Unlimited team members",
                      "Dedicated account manager",
                      "Custom integrations & API",
                      "Advanced security",
                      "Unlimited storage",
                      "24/7 phone support",
                      "Custom training",
                      "SLA guarantee"
                    ]
                  }
                ].map((plan, index) => (
                  <div
                    key={index}
                    className={`relative group rounded-2xl ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 blur" />
                    <div className={`relative h-full backdrop-blur-sm rounded-2xl border ${plan.popular ? 'border-white/20' : 'border-white/10'} ${plan.popular ? 'bg-[#18181B]' : 'bg-black/40'} p-8 flex flex-col`}>
                      {plan.popular && (
                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                          <div className="bg-[#18181B] text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg border border-white/20">
                            Most Popular
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                        <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                        <div className="flex items-baseline mb-2">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          {plan.price !== "Contact Us" && <span className="text-white/60 ml-2">/month</span>}
                        </div>
                      </div>

                      <div className="flex-grow">
                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm">
                              <svg className="h-5 w-5 text-white/70 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-white/70">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button 
                        onClick={plan.price === "Contact Us" ? () => console.log("Contact Sales") : handleGetStarted}
                        size="lg"
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-white hover:bg-white/90 text-background shadow-lg' 
                            : 'bg-white/5 hover:bg-white/10 text-white'
                        } rounded-xl h-12 transition-all duration-200 hover:scale-[0.98]`}
                      >
                        {plan.price === "Contact Us" ? "Contact Sales" : "Get Started"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* CTA Section */}
          <AnimatedSection className="py-16 md:py-24 px-4 sm:px-6 relative">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary/5 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-purple-500/5 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto">
              <div 
                className="relative rounded-3xl overflow-hidden"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-background opacity-80" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
                  <div
                    className="space-y-6"
                  >
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 border border-primary/20 rounded-full bg-primary/10 backdrop-blur-sm">
                      <span className="text-sm font-medium text-primary">Join thousands of teams</span>
                    </div>
                    
                    <h2 className="text-4xl sm:text-5xl font-bold max-w-2xl mx-auto leading-tight">
                      Ready to Elevate Your{" "}
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
                        Project Management
                      </span>
                      ?
                    </h2>
                    
                    <p className="text-lg sm:text-xl text-muted-foreground/90 max-w-2xl mx-auto">
                      Join thousands of successful teams transforming their workflow with MissionBoard.
                    </p>

                    <div 
                      className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
                    >
                      <Button
                        onClick={status === 'authenticated' 
                          ? () => router.push('/dashboard')
                          : handleGetStarted
                        }
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-14 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transform hover:scale-[0.98] transition-all duration-200"
                      >
                        {status === 'authenticated' ? 'Go to Your Dashboard' : 'Start Your Free Trial'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-primary/20 bg-background/50 hover:bg-background/80 backdrop-blur-sm text-lg h-14 px-8 rounded-xl transform hover:scale-[0.98] transition-all duration-200"
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
                    </div>

                    <div className="pt-8 mt-8 border-t border-primary/10">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-muted-foreground">14-day free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-muted-foreground">No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-muted-foreground">Cancel anytime</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Footer */}
          <footer className="py-12 px-4 sm:px-6 border-t border-border/30 bg-background/70 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.03),transparent_25%)]" />
            <div className="max-w-7xl mx-auto relative">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                <div className="space-y-4">
                  <div className="flex items-center group cursor-pointer" onClick={() => router.push('/')}>
                    <Image src="/appicon.png" alt="MissionBoard Logo" width={40} height={40} className="rounded-xl group-hover:scale-95 transition-transform duration-300 mr-1" />
                    <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 -mr-8">
                      MissionBoard
                    </h1>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    Streamlining project management for ambitious teams. Build better projects, faster.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/90">Product</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a href="#testimonials" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Testimonials
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Changelog
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/90">Company</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Careers
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/90">Legal</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center">
                        <svg className="h-4 w-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-border/20 pt-8 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  © {new Date().getFullYear()} MissionBoard. All rights reserved.
                </p>
                <div className="flex space-x-6 mb-4 sm:mb-0 order-1 sm:order-2">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.979 1.029-2.675-.103-.252-.446-1.266.098-2.638 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.372.202 2.386.1 2.638.64.696 1.028 1.587 1.028 2.675 0 3.83-2.339 4.673-4.566 4.92.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48 3.97-1.32 6.833-5.054 6.833-9.458C22 6.463 17.522 2 12 2z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}