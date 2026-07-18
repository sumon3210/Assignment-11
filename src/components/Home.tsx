import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Flame, Heart, Cpu, Sparkles, Star, Shield, HelpCircle, Users, Coins, TrendingUp } from "lucide-react";
import { Campaign } from "../types";

interface HomeProps {
  onNavigate: (route: string) => void;
  onSelectCampaign: (campaignId: string) => void;
}

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=1600&q=80",
    title: "Innovate the Future",
    heading: "Launch Next-Gen Clean Energy Solutions",
    description: "Support engineers and creators developing sustainable technologies to combat climate change and empower communities."
  },
  {
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&q=80",
    title: "Sustain Our Oceans",
    heading: "Transforming Plastic Waste into Art & Gear",
    description: "Back incredible community-driven cleanup projects that recycle coastal plastic into beautiful, sustainable daily accessories."
  },
  {
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80",
    title: "Empower Classrooms",
    heading: "STEAM Robotics Kits for Rural Schools",
    description: "Fund educational kits that teach code and robotics to underfunded elementary schools worldwide."
  }
];

const TESTIMONIALS = [
  {
    name: "Dr. Marcus Vance",
    role: "CleanTech Pioneer",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    quote: "CrowdFund Platform gave us the pre-seed credits to construct our solar pump prototype. The creator dashboard made communicating with our 140 supporters incredibly simple!"
  },
  {
    name: "Emily Watson",
    role: "Social Innovator",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    quote: "With the platform's automatic refund guarantee, supporters feel completely secure pledging credits to our water well projects. It's a game changer for transparency!"
  },
  {
    name: "Ji-Min Park",
    role: "Supporter & Tech Blogger",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    quote: "The visual campaign storytellers and the absolute ease of purchasing credits made me an active supporter. Watching projects come to life is genuinely satisfying."
  }
];

export default function Home({ onNavigate, onSelectCampaign }: HomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [topCampaigns, setTopCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Auto rotate hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch top campaigns from the server API
  useEffect(() => {
    fetch("/api/campaigns/top-funded")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setTopCampaigns(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading top campaigns", err);
        setLoading(false);
      });
  }, []);

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <div id="home-root" className="w-full bg-slate-50 min-h-screen pb-16">
      {/* 1. Hero Section: Premium Animated Image Slider */}
      <div id="hero-slider-section" className="relative h-[550px] w-full overflow-hidden bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* Background Image with Dark Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
              style={{ backgroundImage: `url(${HERO_SLIDES[currentSlide].image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/60 to-transparent" />

            {/* Slider Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-4xl mx-auto w-full px-6 md:px-12">
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs uppercase tracking-wider rounded-full border border-indigo-500/30 mb-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {HERO_SLIDES[currentSlide].title}
                </motion.span>
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-tight mb-4"
                >
                  {HERO_SLIDES[currentSlide].heading}
                </motion.h1>
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-slate-300 text-base md:text-xl leading-relaxed mb-8 max-w-2xl font-sans"
                >
                  {HERO_SLIDES[currentSlide].description}
                </motion.p>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap gap-4"
                >
                  <button
                    onClick={() => onNavigate("explore")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-indigo-600/25 transition-all cursor-pointer font-sans"
                  >
                    Explore Campaigns
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate("register")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-medium rounded-lg transition-all cursor-pointer font-sans"
                  >
                    Start a Campaign
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                idx === currentSlide ? "bg-indigo-500 border-indigo-500 w-8" : "bg-white/40 border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. Top Funded Campaigns Section */}
      <div id="top-campaigns-section" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-indigo-600 font-mono text-sm uppercase tracking-wider font-semibold mb-2 block">
              Trending Projects
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
              Top Funded Campaigns
            </h2>
            <p className="text-slate-600 mt-2 max-w-2xl font-sans">
              Discover the most supported innovations, social causes, and creative projects raising credits from supporters globally.
            </p>
          </div>
          <button
            onClick={() => onNavigate("explore")}
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-indigo-600 font-semibold font-sans hover:text-indigo-700 transition"
          >
            View All Campaigns
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topCampaigns.map((camp) => {
              const pct = Math.min(100, Math.round((camp.amount_raised / camp.funding_goal) * 100));
              return (
                <motion.div
                  key={camp.id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm flex flex-col h-full cursor-pointer"
                  onClick={() => onSelectCampaign(camp.id)}
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={camp.campaign_image_url}
                      alt={camp.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-slate-950/80 text-white font-mono text-xs rounded-full uppercase tracking-wider">
                        {camp.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs mb-2">
                        <span>By {camp.creator_name}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-slate-900 leading-snug line-clamp-2 hover:text-indigo-600 transition mb-3">
                        {camp.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4 font-sans">
                        {camp.story}
                      </p>
                    </div>

                    <div className="mt-auto">
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between font-mono text-xs text-slate-500">
                        <div>
                          <span className="text-slate-900 font-bold text-sm block">
                            {camp.amount_raised.toLocaleString()}
                          </span>
                          Raised
                        </div>
                        <div className="text-right">
                          <span className="text-slate-900 font-bold text-sm block">
                            {pct}%
                          </span>
                          Goal: {camp.funding_goal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Extra Section A: How It Works */}
      <div id="how-it-works-section" className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-indigo-400 font-mono text-xs uppercase tracking-wider font-semibold">
              Simplified Funding
            </span>
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight mt-2 text-white">
              How CrowdFund Works
            </h2>
            <p className="text-slate-400 mt-4 font-sans">
              An ecosystem built on secure platform credits, creator milestones, and full refund protection for backers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                  <Coins className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  1. Acquire Credits
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-sans">
                  Supporters purchase platform credits easily through Stripe-powered checkouts (10 credits = $1). These credits allow direct project backing.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 uppercase mt-8 block">Step One</span>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  2. Back Campaigns
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-sans">
                  Browse approved clean-tech, art, and community causes. Pledge credits toward campaigns and claim early backer rewards once verified.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 uppercase mt-8 block">Step Two</span>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  3. Secure Refunds
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-sans">
                  Creators withdraw raised funds (20 credits = $1) once verified. If a creator deletes a campaign, all approved contributions are automatically refunded!
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 uppercase mt-8 block">Step Three</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Extra Section B: Explore by Category */}
      <div id="category-section" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-indigo-600 font-mono text-xs uppercase tracking-wider font-semibold">
            Categorical Discovery
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 mt-1">
            Focus Your Impact
          </h2>
          <p className="text-slate-600 mt-2 font-sans">
            Choose the categories that align with your passion and explore tailored projects seeking pre-seed backing.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Technology", desc: "STEAM, AI, Energy, Hardware", icon: Cpu, color: "text-blue-500", bg: "bg-blue-50/60" },
            { name: "Art", desc: "Design, Crafts, Galleries, Centers", icon: Star, color: "text-purple-500", bg: "bg-purple-50/60" },
            { name: "Community", desc: "Social welfare, Recycling, Eco", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50/60" },
            { name: "Health", desc: "Clean water, Clinics, Wellness", icon: Heart, color: "text-rose-500", bg: "bg-rose-50/60" }
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                whileHover={{ scale: 1.03 }}
                onClick={() => onNavigate("explore")}
                className={`p-6 rounded-2xl border border-slate-200/70 hover:border-indigo-500/40 cursor-pointer ${cat.bg} transition-all flex flex-col justify-between h-44`}
              >
                <div className={`w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">{cat.name}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-snug">{cat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 5. Testimonial Section with Slider */}
      <div id="testimonial-slider-section" className="bg-slate-100 py-20 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-indigo-600 font-mono text-xs uppercase tracking-wider font-semibold">
              Platform Voices
            </span>
            <h2 className="font-display font-bold text-3xl text-slate-900 mt-1">
              Testimonials from Our Community
            </h2>
          </div>

          <div className="relative min-h-[260px] bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-indigo-600 bg-slate-100">
                  <img
                    src={TESTIMONIALS[testimonialIndex].photo}
                    alt={TESTIMONIALS[testimonialIndex].name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-slate-700 italic text-base md:text-lg font-sans leading-relaxed">
                    "{TESTIMONIALS[testimonialIndex].quote}"
                  </p>
                  <div className="mt-4">
                    <h4 className="font-display font-bold text-slate-900">
                      {TESTIMONIALS[testimonialIndex].name}
                    </h4>
                    <p className="text-indigo-600 text-xs font-mono">
                      {TESTIMONIALS[testimonialIndex].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Controls */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={prevTestimonial}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition"
              >
                &larr;
              </button>
              <button
                onClick={nextTestimonial}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Extra Section C: Platform Impact in Numbers */}
      <div id="impact-section" className="py-24 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-10 md:p-16 text-white border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-indigo-400 font-mono text-xs uppercase tracking-wider font-semibold">
                Measurable Global Change
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight mt-2">
                Empowering Creators & Backers Globally
              </h2>
              <p className="text-slate-400 mt-4 leading-relaxed font-sans text-sm">
                We're on a mission to align financial support with social responsibility. Every credit pledged makes a tangible contribution to local livelihoods, artistic exploration, and environmental preservation.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => onNavigate("register")}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-indigo-600/25 transition cursor-pointer font-sans"
                >
                  Join the Community
                </button>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-6 md:gap-8">
                <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl text-center">
                  <span className="font-display font-bold text-3xl md:text-5xl text-indigo-400 block mb-1">
                    14.5M+
                  </span>
                  <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                    Credits Raised
                  </span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl text-center">
                  <span className="font-display font-bold text-3xl md:text-5xl text-indigo-400 block mb-1">
                    9,800+
                  </span>
                  <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                    Active Backers
                  </span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl text-center">
                  <span className="font-display font-bold text-3xl md:text-5xl text-indigo-400 block mb-1">
                    94.2%
                  </span>
                  <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                    Project Success Rate
                  </span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl text-center">
                  <span className="font-display font-bold text-3xl md:text-5xl text-indigo-400 block mb-1">
                    52+
                  </span>
                  <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                    Countries Active
                  </span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
