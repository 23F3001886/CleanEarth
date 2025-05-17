import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import VolunteerNavbar from "../components/VolunteerNavbar";
import {
  FaMapMarkerAlt,
  FaCheck,
  FaTimes,
  FaPlus,
  FaTrash,
  FaCalendarAlt,
  FaMedal,
  FaUsers,
  FaCheckCircle,
} from "react-icons/fa";

const VolunteerDashboard = () => {
  const [requestsData, setRequestsData] = useState([]);
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [completedCamps, setCompletedCamps] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateCampModal, setShowCreateCampModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [completionForm, setCompletionForm] = useState({
    actual_participants: 0,
    waste_collected: "",
    image_link: "",
    completion_notes: ""
  });
  const navigate = useNavigate();

  // Fetch all data from backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Store current user ID for checking camp ownership
    if (user && user.id) {
      setCurrentUserId(user.id);
    }
    
    if (!token) {
      navigate("/login");
      return;
    }

    // Check if the user is a volunteer - if not, redirect to home
    if (user.role !== "volunteer") {
      navigate("/");
      return;
    }

    console.log("Token value:", token);
    console.log("Token type:", typeof token);
    
    // Make sure token is a string
    if (typeof token !== 'string' || !token.trim()) {
      console.error("Invalid token format");
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }
    
    // Set loading state immediately, clear any previous errors
    setLoading(true);
    setError("");
    
    // Verify token is valid by making an auth-check request
    // First check if the backend is running
    fetch("http://localhost:5000", { method: "GET" })
      .then(response => {
        console.log("Backend server is running");
        // If backend is accessible, then check auth
        return fetch("http://localhost:5000/api/auth-check", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
        .then(res => res.json())
        .then(data => {
          if (!data.authenticated) {
            console.error("Token validation failed:", data.error);
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          console.log("Token validated successfully");
          setLoading(true);
        });
      })
      .catch(err => {
        console.error("Backend connection error:", err);
        setError("Cannot connect to the server. Please make sure the backend is running at http://localhost:5000");
        setLoading(false);
      });

    // Attempt to fetch data regardless of backend check result
    // Fetch waste requests (pending)
    fetch("http://localhost:5000/api/volunteer_requests", {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          const errorData = await r.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(errorData.error || `HTTP error ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("Requests data received:", data);
        // Store fetched data in state
        if (Array.isArray(data)) {
          const pendingRequests = data.filter((r) => r.status === "pending");
          console.log("Pending requests:", pendingRequests);
          setRequestsData(pendingRequests);
        } else {
          setRequestsData([]);
        }
      })
      .catch(err => {
        console.error("Error fetching requests:", err);
        if (err.message === "Failed to fetch") {
          setError("Cannot connect to the server. Please make sure the backend is running.");
        } else {
          setError(err.message || "Failed to load requests");
        }
      });

    // Fetch all camps (only if there's no connection error)
    if (!error) {
      fetch("http://localhost:5000/api/volunteer_camps", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      })
        .then(async (r) => {
          if (!r.ok) {
            const errorData = await r.json().catch(() => ({}));
            console.error("Error response:", errorData);
            throw new Error(errorData.error || `HTTP error ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          console.log("Camps data received:", data);
          const arr = Array.isArray(data) ? data : [];
          
          // Process upcoming camps
          const upcoming = arr.filter((c) => c.status === "planned" || c.status === "in-progress");
          console.log("Upcoming camps:", upcoming);
          setUpcomingCamps(upcoming);
          
          // Process completed camps
          const completed = arr.filter((c) => c.status === "completed");
          console.log("Completed camps:", completed);
          setCompletedCamps(completed);
        })
        .catch(err => {
          console.error("Error fetching camps:", err);
          if (err.message === "Failed to fetch") {
            // Don't duplicate the connection error message
            if (!error) {
              setError("Cannot connect to the server. Please make sure the backend is running.");
            }
          } else {
            setError(prev => prev ? `${prev}; ${err.message}` : err.message);
          }
        });
    }

    // Fetch badges
    fetch("http://localhost:5000/api/badges", {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          const errorData = await r.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        // Set badges data
        setBadges(Array.isArray(data) ? data : []);
        // All data is fetched, turn off loading state
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching badges:", err);
        // Make sure loading state is turned off even if there's an error
        setLoading(false);
      })
      .finally(() => {
        // Guarantee loading state is turned off
        setTimeout(() => {
          setLoading(false);
        }, 500); // Small delay to ensure state updates
      });
  }, [navigate]);

  // Handle camp participation response
  const handleCampResponse = (campId, response) => {
    setUpcomingCamps((prev) =>
      prev.map((camp) =>
        camp.id === campId
          ? { ...camp, status: response ? "confirmed" : "declined" }
          : camp
      )
    );
  };

  // Open create camp modal with selected request
  const handleCreateCamp = (request) => {
    setSelectedRequest(request);
    setShowCreateCampModal(true);
  };

  // Handle camp creation form submit
  const handleCampSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const form = e.target;
    const data = {
      requestId: selectedRequest.id,
      campName: form.campName.value,
      dateOfCamp: form.dateOfCamp.value,
      timeOfCamp: form.timeOfCamp.value,
      numberOfVolunteers: form.numberOfVolunteers.value,
      description: form.campDescription.value,
    };
    try {
      const res = await fetch("http://localhost:5000/api/camp_register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create camp");
      }
      alert("Camp created successfully!");
      setShowCreateCampModal(false);
      setSelectedRequest(null);
      
      // Reload camps data
      fetchCampsData();
      
    } catch (err) {
      alert(err.message);
    }
  };

  // Open completion modal for a camp
  const handleOpenCompletionModal = (camp) => {
    setSelectedCamp(camp);
    setCompletionForm({
      actual_participants: camp.volunteer_count || 0,
      waste_collected: "",
      image_link: "",
      completion_notes: ""
    });
    setShowCompletionModal(true);
  };

  // Handle completion form change
  const handleCompletionFormChange = (e) => {
    const { name, value } = e.target;
    setCompletionForm({
      ...completionForm,
      [name]: value
    });
  };

  // Fetch camps data after changes
  const fetchCampsData = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/volunteer_camps", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch updated camps");
      }
      
      const data = await response.json();
      const arr = Array.isArray(data) ? data : [];
      
      // Update upcoming and completed camps
      setUpcomingCamps(arr.filter(c => c.status === "planned" || c.status === "in-progress"));
      setCompletedCamps(arr.filter(c => c.status === "completed"));
      
    } catch (error) {
      console.error("Error fetching camps:", error);
    }
  };

  // Handle completion form submit
  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCamp) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/complete-camp/${selectedCamp.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(completionForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete camp");
      }
      
      const data = await response.json();
      console.log("Camp completed successfully:", data);
      
      // Update local state
      const updatedCamp = data.campaign;
      
      // Remove from upcoming camps
      setUpcomingCamps(prev => prev.filter(camp => camp.id !== updatedCamp.id));
      
      // Add to completed camps
      setCompletedCamps(prev => [updatedCamp, ...prev]);
      
      // Filter out the completed request
      if (updatedCamp.request_id) {
        setRequestsData(prev => prev.filter(req => req.id !== updatedCamp.request_id));
      }
      
      alert("Camp marked as completed successfully!");
      setShowCompletionModal(false);
      setSelectedCamp(null);
      
    } catch (error) {
      console.error("Error completing camp:", error);
      alert(error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#d1f1fa]">
      <VolunteerNavbar active="Home" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-green-700 mb-2">
            Volunteer Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome back! View requests, manage camps, and track your impact.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
              {error.includes("backend is running") && (
                <div className="mt-2">
                  <p className="font-medium">Steps to fix:</p>
                  <ol className="list-decimal ml-5">
                    <li>Make sure your backend server is running</li>
                    <li>Open a terminal and navigate to the Backend folder</li>
                    <li>Run <code className="bg-red-50 px-1">python app.py</code> to start the server</li>
                    <li>Refresh this page after the server is running</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
              <div className="bg-green-50 p-3 rounded-full mb-2">
                <FaTrash className="text-2xl text-green-600" />
              </div>
              <h4 className="font-medium">Requests</h4>
              <p className="text-2xl font-bold">{requestsData.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
              <div className="bg-green-50 p-3 rounded-full mb-2">
                <FaCalendarAlt className="text-2xl text-green-600" />
              </div>
              <h4 className="font-medium">Upcoming Camps</h4>
              <p className="text-2xl font-bold">{upcomingCamps.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
              <div className="bg-green-50 p-3 rounded-full mb-2">
                <FaCheck className="text-2xl text-green-600" />
              </div>
              <h4 className="font-medium">Completed</h4>
              <p className="text-2xl font-bold">{completedCamps.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
              <div className="bg-green-50 p-3 rounded-full mb-2">
                <FaMedal className="text-2xl text-green-600" />
              </div>
              <h4 className="font-medium">Badges Earned</h4>
              <p className="text-2xl font-bold">{badges.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Waste Requests */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-700">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Waste Removal Requests
                </h2>
              </div>
              {loading ? (
                <div className="animate-pulse p-6">
                  <div className="h-20 bg-gray-200 rounded mb-3"></div>
                  <div className="h-20 bg-gray-200 rounded mb-3"></div>
                  <div className="h-20 bg-gray-200 rounded mb-3"></div>
                </div>
              ) : requestsData.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-auto">
                  {requestsData.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{request.description}</h3>
                          <p className="text-sm text-gray-500">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {request.address || request.location}
                          </p>
                          <p className="text-xs text-gray-400">
                            Reported:{" "}
                            {request.created_at
                              ? request.created_at.split("T")[0]
                              : ""}
                          </p>
                        </div>
                        <Link
                          to={`/camp-register?requestId=${request.id}`}
                          className="bg-green-600 text-white text-sm px-3 py-1 rounded-full hover:bg-green-700 transition duration-300"
                        >
                          Create Camp
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No pending requests found.
                </p>
              )}
            </div>
            {/* Upcoming Camps */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-700 mb-4">
                <FaCalendarAlt className="inline mr-2" />
                Upcoming Camps
              </h2>
              {loading ? (
                <p className="text-center py-8 text-gray-500">
                  Loading camps...
                </p>
              ) : upcomingCamps.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-auto">
                  {upcomingCamps.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{camp.name}</h3>
                          <p className="text-sm text-gray-500">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {camp.location}
                          </p>
                          <p className="text-xs text-gray-400">
                            Date: {camp.date}
                          </p>
                          <p className="text-xs text-gray-400">
                            <FaUsers className="inline mr-1" />
                            {camp.num_volunteers} volunteers needed
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {/* Complete button - shown only to creator */}
                          {Number(camp.creator_id) === Number(currentUserId) && (
                            <button
                              onClick={() => handleOpenCompletionModal(camp)}
                              className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center"
                            >
                              <FaCheckCircle className="mr-1" /> Complete
                            </button>
                          )}
                          
                          {camp.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleCampResponse(camp.id, true)}
                                className="bg-green-600 text-white text-sm px-2 py-1 rounded hover:bg-green-700"
                              >
                                <FaCheck className="inline mr-1" /> Join
                              </button>
                              <button
                                onClick={() => handleCampResponse(camp.id, false)}
                                className="bg-red-600 text-white text-sm px-2 py-1 rounded hover:bg-red-700"
                              >
                                <FaTimes className="inline mr-1" /> Decline
                              </button>
                            </>
                          )}
                          {camp.status === "confirmed" && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Joined
                            </span>
                          )}
                          {camp.status === "declined" && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No upcoming camps found.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Badges Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-700 mb-4">
                <FaMedal className="inline mr-2" />
                Your Badges
              </h2>
              {loading ? (
                <p className="text-center py-8 text-gray-500">
                  Loading badges...
                </p>
              ) : badges.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center p-3 border border-gray-100 rounded-lg bg-green-50 w-24"
                    >
                      <div className="text-3xl mb-2">{badge.icon || "🏅"}</div>
                      <h3 className="font-medium text-sm text-center">
                        {badge.name}
                      </h3>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No badges earned yet. Start participating!
                </p>
              )}
            </div>
            {/* Completed Camps */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-700 mb-4">
                <FaCheck className="inline mr-2" />
                Completed Camps
              </h2>
              {loading ? (
                <p className="text-center py-8 text-gray-500">
                  Loading history...
                </p>
              ) : completedCamps.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-auto">
                  {completedCamps.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                    >
                      <h3 className="font-medium">{camp.name}</h3>
                      <div className="flex justify-between text-sm mt-1">
                        <p className="text-gray-500">Date: {camp.date}</p>
                        <p className="text-green-600 font-medium">
                          {camp.waste_collected ? camp.waste_collected : ""}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        <FaUsers className="inline mr-1" />
                        {camp.actual_participants || camp.num_volunteers} volunteers participated
                      </p>
                      {camp.completion_notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          "{camp.completion_notes.substring(0, 100)}
                          {camp.completion_notes.length > 100 ? "..." : ""}"
                        </p>
                      )}
                      {camp.image_link && (
                        <a 
                          href={camp.image_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View cleanup photo
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No completed camps yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Camp Modal */}
      {showCreateCampModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-green-700 mb-4">
              Create Cleanup Camp
            </h2>
            <p className="text-gray-600 mb-4">
              Based on request at{" "}
              <strong>
                {selectedRequest.address || selectedRequest.location}
              </strong>
            </p>
            <form onSubmit={handleCampSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Camp Name
                </label>
                <input
                  type="text"
                  name="campName"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter a name for this camp"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="dateOfCamp"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Time
                </label>
                <input
                  type="time"
                  name="timeOfCamp"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Maximum Volunteers
                </label>
                <input
                  type="number"
                  name="numberOfVolunteers"
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                  max="100"
                  defaultValue="10"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="campDescription"
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  defaultValue={selectedRequest.description}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camp Completion Modal */}
      {showCompletionModal && selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-green-700 flex items-center">
                <FaCheckCircle className="mr-2" />
                Complete Camp
              </h2>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCompletionSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  <FaUsers className="inline mr-2" />
                  Number of Participants
                </label>
                <input
                  type="number"
                  name="actual_participants"
                  value={completionForm.actual_participants}
                  onChange={handleCompletionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many volunteers actually participated in the cleanup?
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  <FaTrash className="inline mr-2" />
                  Waste Collected
                </label>
                <input
                  type="text"
                  name="waste_collected"
                  value={completionForm.waste_collected}
                  onChange={handleCompletionFormChange}
                  placeholder="e.g. 50kg plastic, 30kg general waste"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Image Link
                </label>
                <input
                  type="url"
                  name="image_link"
                  value={completionForm.image_link}
                  onChange={handleCompletionFormChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: URL to an image showing the completed cleanup
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  <FaCheck className="inline mr-2" />
                  Completion Notes
                </label>
                <textarea
                  name="completion_notes"
                  value={completionForm.completion_notes}
                  onChange={handleCompletionFormChange}
                  placeholder="Describe the outcomes, challenges, and achievements of the cleanup camp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 mr-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  Mark as Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;