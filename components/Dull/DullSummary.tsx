import React, { useState, useEffect } from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard";
import { fetchGrindingData } from "@/data/crm/filing-data";
import { IDull } from "@/interface/table.interface";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchDullData } from "@/data/crm/dull-data";

const DullSummary: React.FC = () => {
  const [dullData, setDullData] = useState<IDull[]>([]);
  const [filteredData, setFilteredData] = useState<IDull[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>("month");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

  // Add helper function for Indian timezone date formatting
  const formatIndianDateTime = (date: Date, isEndDate: boolean = false) => {
    // Add 5 hours and 30 minutes to convert to Indian time
    const indianDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    
    // Set appropriate time
    if (isEndDate) {
      indianDate.setHours(23, 59, 59, 999);
    } else {
      indianDate.setHours(0, 0, 0, 0);
    }
    
    // Format as YYYY-MM-DD HH:mm:ss
    return indianDate.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Update the useEffect for data fetching
  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        console.log("=== FETCHING DULL SUMMARY DATA ===");
        
        const now = new Date();
        let startDate: Date = new Date(now);
        let endDate: Date = new Date(now);

        switch (dateRange) {
          case "day":
            startDate = new Date(now);
            break;
          case "week":
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "month":
            startDate = new Date(now);
            startDate.setDate(1);
            break;
          case "custom":
            if (customStartDate && customEndDate) {
              startDate = new Date(customStartDate);
              endDate = new Date(customEndDate);
            }
            break;
        }

        // Format dates with Indian timezone
        const formattedStartDate = formatIndianDateTime(startDate);
        const formattedEndDate = formatIndianDateTime(endDate, true);

        console.log("Date Range:", {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          range: dateRange
        });

        const data = await fetchDullData(formattedStartDate, formattedEndDate);
        
        console.log("Received Data:", {
          totalRecords: data.length,
          sampleRecord: data[0],
          dateRange: dateRange
        });

        setDullData(data);
        filterDataByDateRange(data, dateRange);
      } catch (error) {
        console.error("Error fetching dull data:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [dateRange, customStartDate, customEndDate]);

  // Filter data when date range changes
  useEffect(() => {
    filterDataByDateRange(dullData, dateRange);
  }, [dateRange, customStartDate, customEndDate, dullData]);

  // Function to filter data by date range
  const filterDataByDateRange = (data: IDull[], range: string) => {
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

  // Update the filterByDateRange function
  const filterByDateRange = (data: IDull[], start: Date, end: Date) => {
    console.log("=== FILTERING DULL DATA ===");
    console.log("Filter Range:", {
      start: formatIndianDateTime(start),
      end: formatIndianDateTime(end, true)
    });

    const filtered = data.filter((item) => {
      const issuedDate = new Date(item.issuedDate);
      // Convert to Indian timezone for comparison
      const indianIssuedDate = new Date(issuedDate.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Convert filter dates to Indian timezone
      const indianStart = new Date(start.getTime() + (5.5 * 60 * 60 * 1000));
      const indianEnd = new Date(end.getTime() + (5.5 * 60 * 60 * 1000));
      
      return indianIssuedDate >= indianStart && indianIssuedDate <= indianEnd;
    });

    console.log("Filtering Results:", {
      totalRecords: data.length,
      filteredRecords: filtered.length
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
    const totalDullLoss = filteredData.reduce(
          (sum, item) => sum + Number(item.dullLoss || 0),
      0
    );

    // Calculate percentages
    const dullLossPercentage = totalIssuedWeight
      ? ((totalDullLoss / totalIssuedWeight) * 100).toFixed(2)
      : "0";
    
    const receivedPercentage = totalIssuedWeight 
      ? ((totalReceivedWeight / totalIssuedWeight) * 100).toFixed(2)
      : "0";

    return [
      {
        iconClass: "fa-light fa-gem",
        title: "Dull Issued",
        value: totalCastings.toString(),
                description: "Total dull jobs",
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
        title: "Dull Loss",
        value: totalDullLoss.toFixed(2) + " g",
        description: dullLossPercentage + "% of issued",
        percentageChange: dullLossPercentage,
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
        filterDataByDateRange(dullData, "custom");
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
              dateFormat="dd/MM/yyyy HH:mm"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
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
              dateFormat="dd/MM/yyyy HH:mm"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
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
            Loading Dull data...
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

export default DullSummary;
