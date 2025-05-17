import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VolunteerNavbar from "../components/VolunteerNavbar";
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaClock } from "react-icons/fa";

const CampRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestData, setRequestData] = useState(null);
  const [formData, setFormData] = useState({
    campName: "",
    dateOfCamp: "",
    timeOfCamp: "",
    numberOfVolunteers: 10,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract request ID from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const requestId = searchParams.get("requestId");

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Fetch request details on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token) {
      navigate("/login");
      return;
    }

    // Check if the user is a volunteer
    if (user.role !== "volunteer") {
      navigate("/");
      return;
    }

    // Check if request ID exists
    if (!requestId) {
      setError("No request ID provided");
      setLoading(false);
      return;
    }

    // Fetch request details
    console.log("Fetching request details for ID:", requestId);
    fetch(`http://localhost:5000/api/request/${requestId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Request data fetched:", data);
        setRequestData(data);
        // Pre-fill description from request
        setFormData((prev) => ({
          ...prev,
          description: data.description || "",
        }));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching request details:", err);
        setError("Failed to load request details. Please try again.");
        setLoading(false);
      });
  }, [requestId, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Prepare data for submission
      const campData = {
        requestId: parseInt(requestId),
        campName: formData.campName,
        dateOfCamp: formData.dateOfCamp,
        timeOfCamp: formData.timeOfCamp,
        numberOfVolunteers: parseInt(formData.numberOfVolunteers),
        description: formData.description,
      };

      console.log("Submitting camp data:", campData);

      const response = await fetch("http://localhost:5000/api/camp_register", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create camp");
      }

      // Success - redirect to volunteer dashboard
      alert("Camp created successfully!");
      navigate("/volunteer");
    } catch (err) {
      console.error("Error creating camp:", err);
      setError(err.message || "Failed to create camp. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#d1f1fa]">
      <VolunteerNavbar active="Camps" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-green-700 mb-2">
            Create Cleanup Camp
          </h1>
          <p className="text-gray-600 mb-6">
            Register a new cleanup camp based on the selected waste request.
          </p>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
                <div className="h-10 bg-slate-200 rounded mb-6"></div>
                <div className="h-10 bg-slate-200 rounded mb-6"></div>
                <div className="h-10 bg-slate-200 rounded mb-6"></div>
                <div className="h-24 bg-slate-200 rounded mb-6"></div>
                <div className="h-10 bg-slate-200 rounded w-1/3 ml-auto"></div>
              </div>
            </div>
          ) : requestData ? (
            <div>
              {/* Request Details Card */}
              <div className="bg-green-50 rounded-xl shadow-sm p-6 mb-6 border border-green-200">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  Request Details
                </h2>
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-green-600 mt-1 mr-2" />
                  <div>
                    <p className="text-gray-800">{requestData.address}</p>
                    <p className="text-sm text-gray-500">
                      Pincode: {requestData.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Camp Creation Form */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label 
                      className="block text-gray-700 font-bold mb-2" 
                      htmlFor="campName"
                    >
                      Camp ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg"
                      value={requestId}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-generated unique identifier
                    </p>
                  </div>

                  <div className="mb-6">
                    <label 
                      className="block text-gray-700 font-bold mb-2" 
                      htmlFor="campName"
                    >
                      Camp Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-green-600">
                        <FaCalendarAlt />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                        id="campName"
                        placeholder="Give your cleanup camp a name"
                        value={formData.campName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label 
                        className="block text-gray-700 font-bold mb-2" 
                        htmlFor="dateOfCamp"
                      >
                        Date of Camp
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-green-600">
                          <FaCalendarAlt />
                        </div>
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                          id="dateOfCamp"
                          value={formData.dateOfCamp}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label 
                        className="block text-gray-700 font-bold mb-2" 
                        htmlFor="timeOfCamp"
                      >
                        Time of Camp
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-green-600">
                          <FaClock />
                        </div>
                        <input
                          type="time"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                          id="timeOfCamp"
                          value={formData.timeOfCamp}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label 
                      className="block text-gray-700 font-bold mb-2" 
                      htmlFor="numberOfVolunteers"
                    >
                      Number of Volunteers Needed
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-green-600">
                        <FaUsers />
                      </div>
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                        id="numberOfVolunteers"
                        min="1"
                        max="100"
                        value={formData.numberOfVolunteers}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label 
                      className="block text-gray-700 font-bold mb-2" 
                      htmlFor="description"
                    >
                      Camp Description
                    </label>
                    <textarea
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="description"
                      rows="4"
                      placeholder="Describe the cleanup camp activities and requirements"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => navigate("/volunteer")}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Create Camp"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-red-600 font-medium">Failed to load request details. Please try again.</p>
              <button
                onClick={() => navigate("/volunteer")}
                className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampRegister;