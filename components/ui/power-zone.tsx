"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  MessageSquare, 
  Shield,
  Zap,
  Bell
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

const BentoCard = ({ 
  children, 
  className, 
  hover = true,
  onMouseEnter,
  onMouseLeave
}: { 
  children: React.ReactNode; 
  className?: string; 
  hover?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm h-full",
        hover && "hover:border-white/20 transition-all duration-500",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
      {children}
    </div>
  );
};

const TeamManagementCard = () => {
  const [activeUser, setActiveUser] = useState(0);
  const users = [
    { name: "Alex Chen", role: "Lead", avatar: "AC", color: "from-blue-500 to-purple-500" },
    { name: "Sarah Kim", role: "Designer", avatar: "SK", color: "from-green-500 to-blue-500" },
    { name: "Mike Johnson", role: "Developer", avatar: "MJ", color: "from-yellow-500 to-orange-500" },
    { name: "Emma Davis", role: "Manager", avatar: "ED", color: "from-pink-500 to-red-500" }
  ];

  return (
    <BentoCard className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-500/20">
          <Users className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Team Management</h3>
      </div>
      
      <div className="space-y-3">
        {users.map((user, index) => (
          <motion.div
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300",
              activeUser === index ? "bg-white/10" : "bg-white/5 hover:bg-white/8"
            )}
            onClick={() => setActiveUser(index)}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm",
              `bg-gradient-to-br ${user.color}`
            )}>
              {user.avatar}
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">{user.name}</div>
              <div className="text-white/60 text-xs">{user.role}</div>
            </div>
            {activeUser === index && (
              <motion.div
                className="h-2 w-2 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 space-y-3">
        <Button 
          size="sm" 
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
          variant="outline"
        >
          Invite Members
        </Button>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">Team Size</span>
          <span className="text-white font-medium">4 / 10</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">Active Now</span>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
            <span className="text-green-400">3 online</span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
};

const EventSchedulingCard = () => {
  const [selectedDate, setSelectedDate] = useState(15);
  const events = [
    { time: "09:00", title: "Team Standup", type: "meeting" },
    { time: "14:00", title: "Project Review", type: "review" },
    { time: "16:30", title: "Client Call", type: "call" }
  ];

  return (
    <BentoCard className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-500/20">
          <Calendar className="h-5 w-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Event Scheduling</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: 28 }, (_, i) => i + 1).map((date) => (
          <motion.button
            key={date}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-medium transition-all duration-200",
              selectedDate === date 
                ? "bg-purple-500 text-white" 
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
            onClick={() => setSelectedDate(date)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {date}
          </motion.button>
        ))}
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          {events.map((event, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              whileHover={{ x: 3 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-purple-400 text-xs font-mono">{event.time}</div>
              <div className="text-white text-sm">{event.title}</div>
              <div className={cn(
                "ml-auto h-2 w-2 rounded-full",
                event.type === "meeting" && "bg-green-400",
                event.type === "review" && "bg-yellow-400",
                event.type === "call" && "bg-blue-400"
              )} />
            </motion.div>
          ))}
        </div>
        
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">This Week</span>
            <span className="text-purple-400 font-medium">12 events</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Team availability</span>
            <span className="text-green-400">6 members free</span>
          </div>
        
          <div className="flex items-center justify-between text-xs">
          <span className='text-white/60'>Mail attendees</span>
            <span className="text-green-400">3000</span>
          </div>

          
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
            Add Event
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-white/20 bg-white/5 text-white/70 hover:bg-white/10">
            View All
          </Button>
        </div>
      </div>
    </BentoCard>
  );
};

const PaymentTrackingCard = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <BentoCard 
      className="p-6 md:p-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-green-500/20">
          <CreditCard className="h-5 w-5 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Payment Tracking</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-sm">Total Revenue</span>
          <motion.span 
            className="text-2xl font-bold text-green-400"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            $12,450
          </motion.span>
        </div>
        
        <div className="space-y-3 mb-4">
          {[
            { label: "Membership Dues", amount: "$8,200", percentage: 66, color: "from-green-400 to-green-500" },
            { label: "Event Tickets", amount: "$3,150", percentage: 25, color: "from-blue-400 to-blue-500" },
            { label: "Donations", amount: "$1,100", percentage: 9, color: "from-purple-400 to-purple-500" }
          ].map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">{item.label}</span>
                <span className="text-white font-medium">{item.amount}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">This Month</div>
            <div className="text-sm font-bold text-green-400">$2,340</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">Pending</div>
            <div className="text-sm font-bold text-yellow-400">$450</div>
          </div>
        </div>
        
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Next payment due</span>
            <span className="text-green-400">Dec 15, 2024</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Outstanding invoices</span>
            <span className="text-yellow-400">3 pending</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Payment success rate</span>
            <span className="text-green-400">98.5%</span>
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs">
            Send Invoice
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-white/20 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            View Reports
          </Button>
        </div>
      </div>
    </BentoCard>
  );
};

const AnalyticsCard = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const metrics = [
    { label: "Active Members", value: "142", change: "+12%" },
    { label: "Events This Month", value: "8", change: "+25%" },
    { label: "Engagement Rate", value: "87%", change: "+5%" }
  ];

  return (
    <BentoCard className="p-8 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-orange-500/20">
          <BarChart3 className="h-5 w-5 text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Analytics Dashboard</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            className={cn(
              "p-3 rounded-xl cursor-pointer transition-all duration-300",
              activeMetric === index ? "bg-orange-500/20" : "bg-white/5 hover:bg-white/10"
            )}
            onClick={() => setActiveMetric(index)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xl font-bold text-white">{metric.value}</div>
            <div className="text-xs text-white/60 mb-1">{metric.label}</div>
            <div className="text-xs text-green-400 font-medium">{metric.change}</div>
          </motion.div>
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="h-24 bg-white/5 rounded-xl p-4 flex items-end gap-1">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-sm"
              style={{ height: `${Math.random() * 60 + 20}%` }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.random() * 60 + 20}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">Revenue Growth</div>
            <div className="text-lg font-bold text-green-400">+23%</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">New Members</div>
            <div className="text-lg font-bold text-blue-400">+18</div>
          </div>
        </div>

        
        
        <div className="flex items-center justify-between text-xs border-t border-white/10 pt-3">
          <span className="text-white/60">Last updated</span>
          <span className="text-orange-400">2 minutes ago</span>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="flex-1 border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs">
            Export Data
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-white/20 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
            View Report
          </Button>
        </div>
      </div>
    </BentoCard>
  );
};

const CommunicationCard = () => {
  const [messages, setMessages] = useState([
    { user: "Alex", message: "Meeting at 3 PM today", time: "2m ago", unread: true },
    { user: "Sarah", message: "Design mockups ready", time: "1h ago", unread: false },
    { user: "Chen", message: "Weekly standup notes", time: "3h ago", unread: false },
    { user: "Mia", message: "New members added", time:"10h ago", unread: false}
  ]);

  return (
    <BentoCard className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-pink-500/20">
          <MessageSquare className="h-5 w-5 text-pink-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Team Communication</h3>
      </div>
      
      <div className="space-y-3">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
            whileHover={{ x: 3 }}
            onClick={() => {
              setMessages(prev => prev.map((m, i) => 
                i === index ? { ...m, unread: false } : m
              ));
            }}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
              {msg.user[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{msg.user}</span>
                <span className="text-white/40 text-xs">{msg.time}</span>
                {msg.unread && (
                  <motion.div
                    className="h-2 w-2 rounded-full bg-pink-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
              <div className="text-white/70 text-sm">{msg.message}</div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <input 
            placeholder="Type a message..." 
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-400 transition-colors"
          />
          <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">Channel Activity</span>
          <span className="text-pink-400 font-medium">24 messages today</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border border-background"></div>
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-green-500 border border-background"></div>
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 border border-background"></div>
          </div>
          <span className="text-xs text-white/60">3 active in chat</span>
        </div>
      </div>
    </BentoCard>
  );
};

const SecurityCard = () => {
  const [securityLevel, setSecurityLevel] = useState(95);
  
  return (
    <BentoCard className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-500/20">
          <Shield className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Security & Privacy</h3>
      </div>
      
      <div className="text-center mb-6">
        <motion.div 
          className="relative w-24 h-24 mx-auto mb-4"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgb(16 185 129)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - securityLevel / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - securityLevel / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-400">{securityLevel}%</span>
          </div>
        </motion.div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Encryption</span>
            <span className="text-emerald-400">✓ Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">2FA Enabled</span>
            <span className="text-emerald-400">✓ Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Backup</span>
            <span className="text-emerald-400">✓ Daily</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">SSL Certificate</span>
            <span className="text-emerald-400">✓ Valid</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Firewall</span>
            <span className="text-emerald-400">✓ Protected</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Access Logs</span>
            <span className="text-emerald-400">✓ Enabled</span>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">Last Security Scan</span>
            <span className="text-emerald-400 text-xs">All Clear</span>
          </div>
          <div className="text-xs text-white/40">2 hours ago • No threats detected</div>
        </div>
        
        <Button size="sm" variant="outline" className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs">
          Run Security Check
        </Button>
      </div>
    </BentoCard>
  );
};

export const PowerZone = () => {
  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-[#0A0A0B] relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4 px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary"
          >
            Features
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-white"
          >
            Everything You Need
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Powerful tools designed to streamline your organization&apos;s workflow and boost productivity
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          <div className="md:col-span-1 lg:col-span-1">
            <TeamManagementCard />
          </div>
          
          <div className="md:col-span-1 lg:col-span-1">
            <EventSchedulingCard />
          </div>
          
          <div className="md:col-span-1 lg:col-span-1">
            <PaymentTrackingCard />
          </div>
          
          <div className="md:col-span-1 lg:col-span-1">
            <CommunicationCard />
          </div>
          
          <div className="md:col-span-1 lg:col-span-1">
            <AnalyticsCard />
          </div>
          
          <div className="md:col-span-1 lg:col-span-1">
            <SecurityCard />
          </div>
        </div>
      </div>
    </section>
  );
}; 