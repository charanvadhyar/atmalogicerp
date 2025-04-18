import React, { useState, useEffect } from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard";
import { fetchGrindingData } from "@/data/crm/grinding-data";
import { IFiling, IGrinding } from "@/interface/table.interface";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

    const GrindingSummary: React.FC = () => {
  const [grindingData, setGrindingData] = useState<IGrinding[]>([]);
  const [filteredData, setFilteredData] = useState<IGrinding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>("month");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

  // Fetch casting data
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const data = await fetchGrindingData();
        setGrindingData(data);
        filterDataByDateRange(data, dateRange);
      } catch (error) {
          console.error("Error fetching grinding data:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  // Filter data when date range changes
  useEffect(() => {
    filterDataByDateRange(grindingData, dateRange);
  }, [dateRange, customStartDate, customEndDate, grindingData]);

  // Function to filter data by date range
  const filterDataByDateRange = (data: IGrinding[], range: string) => {
    if (!data.length) {
      setFilteredData([]);
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "day":
        // Today
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        filterByDateRange(data, startDate, now);
        break;
      case "week":
        // Current week (last 7 days)
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        filterByDateRange(data, startDate, now);
        break;
      case "month":
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        filterByDateRange(data, startDate, now);
        break;
      case "custom":
        // Custom date range
        if (customStartDate && customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          filterByDateRange(data, customStartDate, endDate);
        }
        break;
      default:
        setFilteredData(data);
    }
  };

  // Helper function to filter by date range
  const filterByDateRange = (data: IGrinding[], start: Date, end: Date) => {
    const filtered = data.filter((item) => {
      try {
        // Parse the ISO date string to Date object
        const issuedDate = new Date(item.issuedDate);
        
        // Set the time to start of day for start date and end of day for end date
        const startOfDay = new Date(start);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);

        return issuedDate >= startOfDay && issuedDate <= endOfDay;
      } catch (error) {
        console.error('Error parsing date:', error, item.issuedDate);
        return false;
      }
    });
    setFilteredData(filtered);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalGrinding = filteredData.length;
    const totalIssuedWeight = filteredData.reduce(
      (sum, item) => sum + Number(item.issuedWeight || 0),
      0
    );
    const totalReceivedWeight = filteredData.reduce(
      (sum, item) => sum + Number(item.receivedWeight || 0),
      0
    );
    const totalGrindingLoss = filteredData.reduce(
          (sum, item) => sum + Number(item.grindingLoss || 0),
      0
    );

    // Calculate percentages
    const grindingLossPercentage = totalIssuedWeight
      ? ((totalGrindingLoss / totalIssuedWeight) * 100).toFixed(2)
      : "0";
    
    const receivedPercentage = totalIssuedWeight 
      ? ((totalReceivedWeight / totalIssuedWeight) * 100).toFixed(2)
      : "0";

    return [
      {
        iconClass: "fa-light fa-gem",
        title: "Grinding Issued",
        value: totalGrinding.toString(),
        description: "Total grinding jobs",
        percentageChange: "",
        isIncrease: true,
      },
      {
        iconClass: "fa-light fa-weight-scale",
        title: "Weight Issued",
        value: totalIssuedWeight.toFixed(2) + " g",
            description: "Total gold issued",
        percentageChange: "",
        isIncrease: true,
      },
      {
        iconClass: "fa-light fa-scale-balanced",
        title: "Weight Received",
        value: totalReceivedWeight.toFixed(2) + " g",
          description: receivedPercentage + "% of issued",
        percentageChange: receivedPercentage,
        isIncrease: true,
      },  
      {
        iconClass: "fa-light fa-arrow-trend-down",
        title: "Grinding Loss",
        value: totalGrindingLoss.toFixed(2) + " g",
        description: grindingLossPercentage + "% of issued",
        percentageChange: grindingLossPercentage,
        isIncrease: false
      },
    ];
  };

  // Handle date range change
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    if (range === "custom") {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      filterDataByDateRange(grindingData, "custom");
      setShowCustomDatePicker(false);
    }
  };

  const summaryData = calculateSummary();

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      {/* Date Range Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="text-sm font-medium">Filter by:</div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              dateRange === "day"
                ? "bg-primary text-white"
                : "bg-gray-100 text-slate-600"
            }`}
            onClick={() => handleDateRangeChange("day")}
          >
            Today
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              dateRange === "week"
                ? "bg-primary text-white"
                : "bg-gray-100 text-slate-600"
            }`}
            onClick={() => handleDateRangeChange("week")}
          >
            This Week
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              dateRange === "month"
                ? "bg-primary text-white"
                : "bg-gray-100 text-slate-600"
            }`}
            onClick={() => handleDateRangeChange("month")}
          >
            This Month
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              dateRange === "custom"
                ? "bg-primary text-white"
                : "bg-gray-100 text-slate-600"
            }`}
            onClick={() => handleDateRangeChange("custom")}
          >
            Custom Range
          </button>
        </div>
        
        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <DatePicker
              selected={customStartDate}
              onChange={(date) => setCustomStartDate(date)}
              selectsStart
              startDate={customStartDate}
              endDate={customEndDate}
              placeholderText="Start Date"
              className="px-2 py-1 text-sm border rounded"
            />
            <span>to</span>
            <DatePicker
              selected={customEndDate}
              onChange={(date) => setCustomEndDate(date)}
              selectsEnd
              startDate={customStartDate}
              endDate={customEndDate}
              minDate={customStartDate}
              placeholderText="End Date"
              className="px-2 py-1 text-sm border rounded"
            />
            <button
              onClick={handleApplyCustomRange}
              className="px-3 py-1 text-xs font-medium text-white rounded-md bg-primary"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading casting data...
          </div>
        ) : (
          summaryData.map((item, index) => (
            <div key={index}>
              <SummarySingleCard {...item} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GrindingSummary;
