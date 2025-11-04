"use client";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, ShieldCheck, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// DashboardPage.tsx — No sidebar version for use inside AppLayout

const STAT_CARDS = [
  {
    id: "active-users",
    title: "Active Users",
    value: "128",
    subtitle: "on site",
    icon: <Users size={22} />,
    bg: "#2B6CB0",
    text: "#F6F8FB",
  },
  {
    id: "incidents",
    title: "Open Incidents",
    value: "12",
    subtitle: "last 24h",
    icon: <AlertTriangle size={22} />,
    bg: "#E04B4B",
    text: "#F6F8FB",
  },
  {
    id: "compliance",
    title: "Compliance Rate",
    value: "93%",
    subtitle: "overall",
    icon: <ShieldCheck size={22} />,
    bg: "#1E9A61",
    text: "#F6F8FB",
  },
  {
    id: "reports",
    title: "Reports Generated",
    value: "56",
    subtitle: "this month",
    icon: <FileText size={22} />,
    bg: "#F6A623",
    text: "#10243A",
  },
];

const areaData = [
  { date: "01 Sep", incidents: 8, compliance: 85 },
  { date: "08 Sep", incidents: 5, compliance: 87 },
  { date: "15 Sep", incidents: 12, compliance: 82 },
  { date: "22 Sep", incidents: 9, compliance: 88 },
  { date: "29 Sep", incidents: 6, compliance: 91 },
  { date: "06 Oct", incidents: 4, compliance: 93 },
];

const barData = [
  { name: "Site A", incidents: 12 },
  { name: "Site B", incidents: 8 },
  { name: "Site C", incidents: 4 },
  { name: "Site D", incidents: 6 },
  { name: "Site E", incidents: 2 },
];

const pieData = [
  { name: "Minor", value: 45 },
  { name: "Major", value: 35 },
  { name: "Critical", value: 20 },
];

const COLORS = ["#2B6CB0", "#F6A623", "#E04B4B"];

/* Framer variants for smooth, accessible motion */
const containerVariants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, when: "beforeChildren" },
  },
};
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function StatCard({ card }: { card: any }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.02, translateY: -4 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="rounded-2xl p-5 shadow-md focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/30"
      style={{
        backgroundColor: card.bg,
        boxShadow:
          "0 6px 18px rgba(16,36,58,0.06), inset 0 -6px 12px rgba(0,0,0,0.03)",
      }}
      role="region"
      aria-labelledby={`stat-${card.id}-title`}
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            id={`stat-${card.id}-title`}
            className="text-sm font-medium"
            style={{ color: card.text }}
          >
            {card.title}
          </div>
          <div
            className="mt-3 text-3xl font-bold"
            style={{ color: card.text }}
            aria-hidden
          >
            {card.value}
          </div>
          <div className="mt-1 text-xs" style={{ color: card.text }}>
            {card.subtitle}
          </div>
        </div>

        <div
          className="rounded-xl p-2 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            minWidth: 40,
            minHeight: 40,
          }}
          aria-hidden
        >
          {card.icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <div className="w-full bg-[#F6F8FB] text-[#10243A] p-4 md:p-8">
      {/* Header + quick stats */}
      <section className="mt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-[#10243A]/70 mt-1 max-w-2xl">
              At-a-glance safety insights — incident trends, compliance, and
              actionables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a href="/unsafety">
              <motion.button
                whileHover={{
                  y: -2,
                  boxShadow: "0 10px 20px rgba(246,166,35,0.08)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="px-4 py-2 rounded-lg shadow-sm bg-[#2B6CB0] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6A623]/30"
                aria-label="Create new report"
              >
                New Report
              </motion.button>
            </a>
          </div>
        </div>

        {/* Animated stat cards container */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          {STAT_CARDS.map((c) => (
            <StatCard key={c.id} card={c} />
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* Large area chart */}
          <div className="col-span-2 rounded-2xl bg-white p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium">Incident Trend</div>
                <div className="text-xs text-[#10243A]/60">Last 6 weeks</div>
              </div>
              <div className="text-sm text-[#10243A]/60">Filter: All sites</div>
            </div>

            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={areaData}
                  margin={{ top: 10, right: 18, left: -8, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="colorComply"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#1E9A61" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1E9A61" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#E04B4B"
                        stopOpacity={0.28}
                      />
                      <stop offset="100%" stopColor="#E04B4B" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF5" />
                  <Tooltip />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="compliance"
                    stroke="#1E9A61"
                    fillOpacity={1}
                    fill="url(#colorComply)"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="incidents"
                    stroke="#E04B4B"
                    fillOpacity={1}
                    fill="url(#colorInc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#1E9A61" }}
                />
                <div>Compliance</div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#E04B4B" }}
                />
                <div>Incidents</div>
              </div>
            </div>
          </div>

          {/* Right column: pie + bar */}
          <div className="rounded-2xl bg-white p-4 shadow-md">
            <div className="text-sm font-medium">Incident Breakdown</div>
            <div className="text-xs text-[#10243A]/60 mb-4">By severity</div>

            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={36}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              {pieData.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between text-sm my-1"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <div>{p.name}</div>
                  </div>
                  <div className="text-sm">{p.value}%</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium">Incidents by Site</div>
              <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={barData}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar
                      dataKey="incidents"
                      fill="#E04B4B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recent incidents table + actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <motion.div
  className="col-span-2 rounded-2xl bg-white p-4 shadow-md"
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="text-sm font-semibold text-[#10243A]">
        Recent Incidents
      </div>
      <div className="text-xs text-[#10243A]/60">Latest 10 reports logged</div>
    </div>
    <div className="text-sm text-[#2B6CB0] font-medium cursor-pointer hover:underline">
      View all →
    </div>
  </div>

  {/* Table */}
  <div className="overflow-x-auto rounded-lg border border-[#E6EDF5]">
    <table className="w-full text-sm">
      <thead className="bg-[#F6F8FB] text-[#10243A]/70 text-xs uppercase">
        <tr>
          <th className="py-3 px-2 text-left">Time</th>
          <th className="py-3 px-2 text-left">Site</th>
          <th className="py-3 px-2 text-left">Type</th>
          <th className="py-3 px-2 text-left">Severity</th>
          <th className="py-3 px-2 text-left">Status</th>
          <th className="py-3 px-2 text-left">Owner</th>
          <th className="py-3 px-2 text-left">Location</th>
          <th className="py-3 px-2 text-left">Action Required</th>
        </tr>
      </thead>

      <tbody>
        {[
          {
            time: "2025-10-31 09:12",
            site: "Site A",
            type: "Slip",
            severity: "Minor",
            status: "Open",
            owner: "Ravi",
            location: "North Zone",
            action: "Inspection pending",
          },
          {
            time: "2025-10-30 17:03",
            site: "Site B",
            type: "Equipment Failure",
            severity: "Major",
            status: "Investigating",
            owner: "Priya",
            location: "South Zone",
            action: "Awaiting vendor feedback",
          },
          {
            time: "2025-10-29 11:20",
            site: "Site C",
            type: "Near-miss",
            severity: "Minor",
            status: "Resolved",
            owner: "Amit",
            location: "Warehouse",
            action: "Documentation review",
          },
          {
            time: "2025-10-27 08:45",
            site: "Site D",
            type: "Fall from Height",
            severity: "Critical",
            status: "Open",
            owner: "Sana",
            location: "Maintenance Area",
            action: "PPE audit required",
          },
          {
            time: "2025-10-25 14:10",
            site: "Site E",
            type: "Fire",
            severity: "Major",
            status: "Closed",
            owner: "Rohit",
            location: "Control Room",
            action: "Training follow-up",
          },
        ].map((incident, index) => (
          <motion.tr
            key={index}
            className="border-t hover:bg-[#F6F8FB] transition-all duration-200 cursor-pointer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <td className="py-3 px-2 text-xs text-[#10243A]/80">
              {incident.time}
            </td>
            <td className="py-3 px-2 font-medium">{incident.site}</td>
            <td className="py-3 px-2 text-[#10243A]/80">{incident.type}</td>
            <td className="py-3 px-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  incident.severity === "Critical"
                    ? "bg-[#E04B4B]/10 text-[#E04B4B]"
                    : incident.severity === "Major"
                    ? "bg-[#F6A623]/10 text-[#F6A623]"
                    : "bg-[#1E9A61]/10 text-[#1E9A61]"
                }`}
              >
                {incident.severity}
              </span>
            </td>
            <td className="py-3 px-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  incident.status === "Open"
                    ? "bg-[#2B6CB0]/10 text-[#2B6CB0]"
                    : incident.status === "Investigating"
                    ? "bg-[#F6A623]/10 text-[#F6A623]"
                    : incident.status === "Resolved"
                    ? "bg-[#1E9A61]/10 text-[#1E9A61]"
                    : "bg-[#10243A]/10 text-[#10243A]"
                }`}
              >
                {incident.status}
              </span>
            </td>
            <td className="py-3 px-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-[#2B6CB0]/10 flex items-center justify-center text-xs font-semibold text-[#2B6CB0]">
                  {incident.owner.charAt(0)}
                </div>
                <span>{incident.owner}</span>
              </div>
            </td>
            <td className="py-3 px-2 text-xs text-[#10243A]/80">
              {incident.location}
            </td>
            <td
              className="py-3 px-2 text-xs text-[#10243A]/70"
              title={incident.action}
            >
              {incident.action}
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Small Summary Below */}
  <div className="mt-4 text-xs text-[#10243A]/70 flex flex-wrap gap-3">
    <div>🟢 <span className="font-semibold">2 Resolved</span></div>
    <div>🟠 <span className="font-semibold">1 Investigating</span></div>
    <div>🔴 <span className="font-semibold">2 Open/Critical</span></div>
    <div>📍 Highlighted zones: Maintenance, South, Control Room</div>
  </div>
</motion.div>

          <div className="rounded-2xl bg-white p-4 shadow-md">
            <div className="text-sm font-medium">Quick Actions</div>
            <div className="text-xs text-[#10243A]/60 mb-3">
              Create report, assign owner or escalate
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="/create-incident"
                className="w-full py-2 rounded-lg bg-[#2B6CB0] text-[#F6F8FB] text-center block shadow-sm hover:scale-[1.01] transition-transform focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/30"
              >
                ChatBot
              </a>

              <a
                href="/Unsafety"
                className="w-full py-2 rounded-lg bg-[#F6A623] text-[#10243A] text-center block shadow-sm hover:scale-[1.01] transition-transform focus:outline-none focus:ring-2 focus:ring-[#F6A623]/30"
              >
                Generate Report
              </a>

              <a
                href="/escalate"
                className="w-full py-2 rounded-lg bg-[#E04B4B] text-[#F6F8FB] text-center block shadow-sm hover:scale-[1.01] transition-transform focus:outline-none focus:ring-2 focus:ring-[#E04B4B]/30"
              >
                Module 3
              </a>

              <a
                href="/assign-owner"
                className="w-full py-2 rounded-lg border border-[#E6EDF5] text-center block text-[#10243A] shadow-sm hover:scale-[1.01] transition-transform focus:outline-none focus:ring-2 focus:ring-[#10243A]/10"
              >
                Module 4
              </a>
            </div>

            <div className="mt-4 text-xs text-[#10243A]/70">
              Tip: Click a row in Recent Incidents to open the detail drawer for
              recommended next-steps.
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-[#10243A]/60">
          © {new Date().getFullYear()} DATTU — Safety AI insights
        </div>
      </section>
    </div>
  );
}
