import { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
  Upload,
  Download,
  Settings,
  Home,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Mock data for development
const mockCommunities = [
  { id: 1, name: "Riverside Community", unitCount: 12, avgConsumption: 245.5 },
];

const mockConsumption = [
  { month: "Jan", water: 220, electricity: 180 },
  { month: "Feb", water: 195, electricity: 165 },
  { month: "Mar", water: 240, electricity: 190 },
  { month: "Apr", water: 260, electricity: 210 },
  { month: "May", water: 285, electricity: 235 },
  { month: "Jun", water: 310, electricity: 260 },
  { month: "Jul", water: 335, electricity: 285 },
  { month: "Aug", water: 320, electricity: 275 },
  { month: "Sep", water: 290, electricity: 245 },
  { month: "Oct", water: 265, electricity: 220 },
  { month: "Nov", water: 240, electricity: 195 },
  { month: "Dec", water: 225, electricity: 185 },
];

const mockUnits = [
  {
    id: 1,
    unitNumber: "A101",
    currentUsage: 245,
    avgUsage: 220,
    status: "normal",
    trend: "up",
  },
  {
    id: 2,
    unitNumber: "A102",
    currentUsage: 189,
    avgUsage: 220,
    status: "good",
    trend: "down",
  },
  {
    id: 3,
    unitNumber: "A103",
    currentUsage: 267,
    avgUsage: 220,
    status: "warning",
    trend: "up",
  },
  {
    id: 4,
    unitNumber: "A104",
    currentUsage: 298,
    avgUsage: 220,
    status: "danger",
    trend: "up",
  },
  {
    id: 5,
    unitNumber: "B101",
    currentUsage: 201,
    avgUsage: 220,
    status: "good",
    trend: "down",
  },
  {
    id: 6,
    unitNumber: "B102",
    currentUsage: 234,
    avgUsage: 220,
    status: "normal",
    trend: "up",
  },
  {
    id: 7,
    unitNumber: "B103",
    currentUsage: 276,
    avgUsage: 220,
    status: "warning",
    trend: "up",
  },
  {
    id: 8,
    unitNumber: "B104",
    currentUsage: 312,
    avgUsage: 220,
    status: "danger",
    trend: "up",
  },
];

const mockBenchmark = {
  communityAverage: 245.5,
  unitComparisons: mockUnits.map((unit) => ({
    unitId: unit.id,
    unitNumber: unit.unitNumber,
    currentUsage: unit.currentUsage,
    diffPercent: (((unit.currentUsage - 245.5) / 245.5) * 100).toFixed(1),
    status: unit.status,
    message:
      unit.status === "good"
        ? "Great job! Below average usage."
        : unit.status === "normal"
          ? "Usage within normal range."
          : unit.status === "warning"
            ? "Usage above average. Consider conservation."
            : "High usage detected. Immediate action recommended.",
  })),
};

// API service with mock fallback
const apiService = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "",

  async fetchWithFallback(endpoint, mockData) {
    try {
      if (!this.baseURL) {
        console.log("Using mock data for:", endpoint);
        return mockData;
      }
      const response = await fetch(`${this.baseURL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`API call failed for ${endpoint}, using mock data:`, error);
      return mockData;
    }
  },

  getCommunities: () =>
    apiService.fetchWithFallback("/api/communities", mockCommunities),
  getConsumption: (id) =>
    apiService.fetchWithFallback(
      `/api/communities/${id}/consumption`,
      mockConsumption,
    ),
  getBenchmark: (id) =>
    apiService.fetchWithFallback(`/api/benchmark/${id}`, mockBenchmark),
  getUnits: () => apiService.fetchWithFallback("/api/units", mockUnits),
};

// Animated counter component
function AnimatedCounter({ value, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Overview cards component
function OverviewCards() {
  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: apiService.getCommunities,
  });

  const { data: benchmark } = useQuery({
    queryKey: ["benchmark", 1],
    queryFn: () => apiService.getBenchmark(1),
  });

  const totalUnits = communities.reduce((sum, c) => sum + c.unitCount, 0);
  const avgConsumption = benchmark?.communityAverage || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Home size={20} className="text-[#7A7A7A] dark:text-[#999999]" />
          <span className="font-opensans font-semibold text-[16px] text-[#4D4D4D] dark:text-[#B0B0B0]">
            Total Units
          </span>
        </div>
        <div className="text-[48px] font-bold text-black dark:text-white font-sora">
          <AnimatedCounter value={totalUnits} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Droplets size={20} className="text-[#7A7A7A] dark:text-[#999999]" />
          <span className="font-opensans font-semibold text-[16px] text-[#4D4D4D] dark:text-[#B0B0B0]">
            Avg Water Usage
          </span>
        </div>
        <div className="text-[48px] font-bold text-black dark:text-white font-sora">
          <AnimatedCounter value={Math.round(avgConsumption)} />
          <span className="text-[24px] text-[#7A7A7A] dark:text-[#999999] ml-2">
            gal
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap size={20} className="text-[#7A7A7A] dark:text-[#999999]" />
          <span className="font-opensans font-semibold text-[16px] text-[#4D4D4D] dark:text-[#B0B0B0]">
            Avg Electric Usage
          </span>
        </div>
        <div className="text-[48px] font-bold text-black dark:text-white font-sora">
          <AnimatedCounter value={195} />
          <span className="text-[24px] text-[#7A7A7A] dark:text-[#999999] ml-2">
            kWh
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp
            size={20}
            className="text-[#7A7A7A] dark:text-[#999999]"
          />
          <span className="font-opensans font-semibold text-[16px] text-[#4D4D4D] dark:text-[#B0B0B0]">
            Efficiency Score
          </span>
        </div>
        <div className="text-[48px] font-bold text-black dark:text-white font-sora">
          <AnimatedCounter value={87} />
          <span className="text-[24px] text-[#7A7A7A] dark:text-[#999999] ml-2">
            %
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Consumption chart component
function ConsumptionChart() {
  const { data: consumption = [] } = useQuery({
    queryKey: ["consumption", 1],
    queryFn: () => apiService.getConsumption(1),
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-8"
    >
      <h3 className="text-xl font-bold text-black dark:text-white mb-6 font-sora">
        Monthly Consumption Trends
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={consumption}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="water"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              name="Water (gal)"
            />
            <Line
              type="monotone"
              dataKey="electricity"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
              name="Electricity (kWh)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible table fallback */}
      <div className="sr-only">
        <table>
          <caption>Monthly consumption data</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Water (gallons)</th>
              <th>Electricity (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {consumption.map((item, index) => (
              <tr key={index}>
                <td>{item.month}</td>
                <td>{item.water}</td>
                <td>{item.electricity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Unit list component
function UnitList() {
  const { data: benchmark } = useQuery({
    queryKey: ["benchmark", 1],
    queryFn: () => apiService.getBenchmark(1),
  });

  const units = benchmark?.unitComparisons || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case "good":
        return <CheckCircle size={16} className="text-green-500" />;
      case "warning":
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case "danger":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "danger":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
    >
      <h3 className="text-xl font-bold text-black dark:text-white mb-6 font-sora">
        Unit Performance
      </h3>

      <div className="space-y-4">
        {units.map((unit, index) => (
          <motion.div
            key={unit.unitId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              {getStatusIcon(unit.status)}
              <div>
                <div className="font-semibold text-black dark:text-white">
                  Unit {unit.unitNumber}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {unit.currentUsage} gal/month
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(unit.status)}`}
              >
                {unit.diffPercent > 0 ? "+" : ""}
                {unit.diffPercent}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs avg
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Action banner component
function ActionBanner() {
  const { data: benchmark } = useQuery({
    queryKey: ["benchmark", 1],
    queryFn: () => apiService.getBenchmark(1),
  });

  const highUsageUnits =
    benchmark?.unitComparisons?.filter((unit) => unit.status === "danger") ||
    [];

  if (highUsageUnits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-600" />
        <div>
          <h4 className="font-semibold text-red-800">High Usage Alert</h4>
          <p className="text-red-700 text-sm">
            {highUsageUnits.length} unit{highUsageUnits.length > 1 ? "s" : ""}{" "}
            showing usage over 20% above average. Consider sending conservation
            tips to these residents.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Top navigation component
function TopNav({ onMenuClick }) {
  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/export/csv/1");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "community_consumption.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch("/api/export/pdf/1");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "community_report.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="h-16 bg-[#F3F3F3] dark:bg-[#1A1A1A] flex items-center justify-between px-4 md:px-6 flex-shrink-0 border-b border-[#E6E6E6] dark:border-[#333333]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#1E1E1E] active:bg-[#EEEEEE] dark:active:bg-[#2A2A2A] active:scale-95"
        >
          <Menu size={20} className="text-[#4B4B4B] dark:text-[#B0B0B0]" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white tracking-tight font-inter">
          Community Utility Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <a
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Upload Data</span>
        </a>
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#404040] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <button
              onClick={handleExportCSV}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg"
            >
              Export as CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b-lg"
            >
              Export as PDF
            </button>
          </div>
        </div>
        <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Settings size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// Main dashboard component
function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      <TopNav onMenuClick={() => setSidebarOpen(true)} />

      <div className="p-4 md:p-8">
        <ActionBanner />
        <OverviewCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ConsumptionChart />
          <UnitList />
        </div>
      </div>
    </div>
  );
}

// Query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main app component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
