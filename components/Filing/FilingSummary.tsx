import React, { useState, useEffect } from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard";
import { fetchGrindingData } from "@/data/crm/filing-data";
import { IFiling } from "@/interface/table.interface";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

    const FilingSummary: React.FC = () => {
  const [filingData, setFilingData] = useState<IFiling[]>([]);
  const [filteredData, setFilteredData] = useState<IFiling[]>([]);
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
        setFilingData(data);
        filterDataByDateRange(data, dateRange);
      } catch (error) {
          console.error("Error fetching filing data:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  // Filter data when date range changes
  useEffect(() => {
    filterDataByDateRange(filingData, dateRange);
  }, [dateRange, customStartDate, customEndDate, filingData]);

  // Function to filter data by date range
  const filterDataByDateRange = (data: IFiling[], range: string) => {
    if (!data.length) {
      setFilteredData([]);
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "day":
        // Today
        startDate = new Date(now.setHours(0, 0, 0, 0));
        filterByDateRange(data, startDate, new Date());
        break;
      case "week":
        // Current week (last 7 days)
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        filterByDateRange(data, startDate, new Date());
        break;
      case "month":
        // Current month
        startDate = new Date();
        startDate.setDate(1);
        filterByDateRange(data, startDate, new Date());
        break;
      case "custom":
        // Custom date range
        if (customStartDate && customEndDate) {
          filterByDateRange(data, customStartDate, customEndDate);
        }
        break;
      default:
        setFilteredData(data);
    }
  };

  // Helper function to filter by date range
  const filterByDateRange = (data: IFiling[], start: Date, end: Date) => {
    const filtered = data.filter((item) => {
      const issuedDate = new Date(item.issuedDate);
      return issuedDate >= start && issuedDate <= end;
    });
    setFilteredData(filtered);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalCastings = filteredData.length;
    const totalIssuedWeight = filteredData.reduce(
      (sum, item) => sum + Number(item.issuedWeight || 0),
      0
    );
    const totalReceivedWeight = filteredData.reduce(
      (sum, item) => sum + Number(item.receivedWeight || 0),
      0
    );
    const totalFilingLoss = filteredData.reduce(
          (sum, item) => sum + Number(item.filingLoss || 0),
      0
    );

    // Calculate percentages
    const filingLossPercentage = totalIssuedWeight
      ? ((totalFilingLoss / totalIssuedWeight) * 100).toFixed(2)
      : "0";
    
    const receivedPercentage = totalIssuedWeight 
      ? ((totalReceivedWeight / totalIssuedWeight) * 100).toFixed(2)
      : "0";

    return [
      {
        iconClass: "fa-light fa-gem",
        title: "Filing Issued",
        value: totalCastings.toString(),
        description: "Total filing jobs",
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
        title: "Filing Loss",
        value: totalFilingLoss.toFixed(2) + " g",
        description: filingLossPercentage + "% of issued",
        percentageChange: filingLossPercentage,
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
      filterDataByDateRange(filingData, "custom");
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

export default FilingSummary;
