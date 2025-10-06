import { Link } from 'react-router-dom';
import { ArrowRight, Upload, FolderOpen, Grid3x3, Users, FileText, Download, TrendingUp, Sparkles, Zap, Shield, Cloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import TopDownloadedSection from '../components/home/TopDownloadedSection';

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bg-black min-h-screen overflow-hidden">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-8 pt-20"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        <motion.div
          style={{ x: mousePosition.x, y: mousePosition.y }}
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: -mousePosition.x, y: -mousePosition.y }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-tagline inline-block text-sm font-medium text-gray-400 tracking-[0.2em] uppercase mb-6">
              Collaborative learning made simple, with College Hub
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
          >
            Academic Resources,
            <br />
            <span className="bg-gradient-to-r from-white via-purple-400 to-blue-500 bg-clip-text text-transparent">
              Assignments & Papers
            </span>
            <br />
            For College Students
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-description text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Browse, upload, and organize your study materials in an interactive
            canvas workspace. Making academic resource management feel less like
            a chore and more like exploring a personalized digital library.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hero-cta-container flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/browse"
              className="hero-cta-button group px-10 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold text-base shadow-[0_8px_32px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_48px_rgba(139,92,246,0.4)] hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Start Browsing
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/my-files"
              className="hero-cta-button px-10 py-4 bg-transparent border-2 border-white/20 text-white rounded-full font-semibold text-base hover:bg-white/5 hover:border-purple-500 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Files
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="hero-stats-grid mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { number: '1,247+', label: 'Resources' },
              { number: '856+', label: 'Students' },
              { number: '3,429+', label: 'Files' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="hero-stat-number text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="hero-stat-label text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <StatsSection />
      <TopDownloadedSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection />
    </div>
  );
};

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    { icon: FileText, value: '1,247', label: 'Resources Shared', color: 'from-purple-500 to-purple-600' },
    { icon: Users, value: '856', label: 'Active Students', color: 'from-blue-500 to-blue-600' },
    { icon: Download, value: '3,429', label: 'Files Available', color: 'from-pink-500 to-pink-600' },
    { icon: TrendingUp, value: '98%', label: 'Satisfaction Rate', color: 'from-green-500 to-green-600' },
  ];

  return (
    <section ref={ref} className="section-padding py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="stats-container bg-[#0A0A0A] border border-white/10 rounded-2xl p-12"
        >
          <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className={`inline-flex p-4 bg-gradient-to-br ${stat.color} rounded-xl mb-4`}>
                    <Icon size={32} className="text-white" />
                  </div>
                  <div className="stats-value text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      icon: Grid3x3,
      title: 'Interactive Canvas',
      description: 'Browse files in an engaging canvas workspace with drag-and-drop functionality',
      gradient: 'from-purple-500 to-blue-500',
    },
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Upload assignments, question papers, and study materials in seconds',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FolderOpen,
      title: 'Smart Organization',
      description: 'Organize files by category, subject, and date with powerful filters',
      gradient: 'from-cyan-500 to-teal-500',
    },
  ];

  return (
    <section ref={ref} className="section-padding py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center section-margin mb-16"
        >
          <h2 className="section-title text-4xl sm:text-5xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="section-subtitle text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to manage and share academic resources effectively
          </p>
        </motion.div>

        <div className="features-grid grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative group"
              >
                <div className="feature-card h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                  <div className={`inline-flex p-4 bg-gradient-to-br ${feature.gradient} rounded-xl mb-6`}>
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="feature-title text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="feature-description text-gray-400 leading-relaxed">{feature.description}</p>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up with your college email and join the community',
      icon: Users,
    },
    {
      number: '02',
      title: 'Upload Resources',
      description: 'Share your assignments, notes, and study materials',
      icon: Upload,
    },
    {
      number: '03',
      title: 'Browse & Download',
      description: 'Explore the canvas workspace and access files you need',
      icon: Download,
    },
  ];

  return (
    <section ref={ref} className="how-it-works-section section-padding py-20 px-4 sm:px-8 bg-gradient-to-b from-black to-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center section-margin mb-16"
        >
          <h2 className="section-title text-4xl sm:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="section-subtitle text-gray-400 text-lg max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="how-it-works-grid grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="how-it-works-icon inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6 relative z-10"
                  >
                    <Icon size={48} className="text-white" />
                  </motion.div>
                  <div className="text-6xl font-bold text-white/5 absolute top-0 left-1/2 -translate-x-1/2 -z-10">
                    {step.number}
                  </div>
                  <h3 className="how-it-works-title text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const benefits = [
    { icon: Zap, title: 'Lightning Fast', description: 'Quick uploads and downloads with optimized performance' },
    { icon: Shield, title: 'Secure Storage', description: 'Your files are protected with enterprise-grade security' },
    { icon: Cloud, title: 'Cloud Backup', description: 'Never lose your important academic materials' },
    { icon: Sparkles, title: 'Smart Search', description: 'Find exactly what you need with advanced filters' },
  ];

  return (
    <section ref={ref} className="section-padding py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="benefits-grid grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="benefits-title text-4xl sm:text-5xl font-bold text-white mb-6">
              Why Choose
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                College Hub?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Built by students, for students. Experience the difference.
            </p>
            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ x: 8 }}
                    className="flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-400">{benefit.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="benefits-visual relative aspect-square">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-2 border-purple-500/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-8 border-2 border-blue-500/20 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="benefits-stat text-7xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
                    10k+
                  </div>
                  <div className="text-xl text-gray-400">Happy Students</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="section-padding py-20 px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl" />

        <div className="cta-container relative bg-[#0A0A0A] border border-white/10 rounded-3xl p-12 sm:p-16 text-center">
          <h2 className="cta-title text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="cta-description text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students already using College Hub to manage their academic resources.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold text-base shadow-[0_8px_32px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_48px_rgba(139,92,246,0.4)] hover:scale-105 transition-all duration-300"
          >
            Create Free Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default Home;