import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaCheckCircle, FaMedal, FaSearchLocation, FaCalendarAlt, FaUsers, FaCheck } from "react-icons/fa";

const HomePage = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [badges, setBadges] = useState([]);
  const [camps, setCamps] = useState([]);
  const [pincode, setPincode] = useState("");
  const [user, setUser] = useState(null);
  const [joinStatus, setJoinStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user info from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    if (userData && userData.pincode) setPincode(userData.pincode);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch all requests for activity and logs
    fetch("http://localhost:5000/api/managerequest", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setRequests(Array.isArray(data) ? data : []);
        setCompletedLogs((Array.isArray(data) ? data : []).filter(r => r.status === "completed" && r.user_id === userData?.id));
      })
      .catch(() => {
        setRequests([]);
        setCompletedLogs([]);
      });

    // Fetch badges
    fetch("http://localhost:5000/api/badges", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBadges(Array.isArray(data) ? data : []))
      .catch(() => setBadges([]));
      
    // Fetch nearby camps
    fetchNearbyCamps();
  }, [navigate]);

  // Filter requests by pincode
  useEffect(() => {
    if (pincode && requests.length > 0) {
      setFilteredRequests(requests.filter(r => r.pincode === pincode));
    }
  }, [pincode, requests]);
  
  const fetchNearbyCamps = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/user_camps', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch nearby camps');
      }
      
      const data = await response.json();
      console.log('Nearby camps:', data);
      setCamps(data);
      
      // Initialize join status
      const initialStatus = {};
      data.forEach(camp => {
        initialStatus[camp.id] = {
          isJoining: false,
          isParticipating: camp.isParticipating
        };
      });
      setJoinStatus(initialStatus);
      
    } catch (err) {
      console.error('Error fetching nearby camps:', err);
      setError(err.message || 'Failed to load nearby camps. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinCamp = async (campId) => {
    // Prevent joining if already participating
    if (joinStatus[campId]?.isParticipating) {
      return;
    }
    
    // Update local state to show joining in progress
    setJoinStatus(prev => ({
      ...prev,
      [campId]: {
        ...prev[campId],
        isJoining: true
      }
    }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/camp_participate/${campId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join camp');
      }
      
      const data = await response.json();
      console.log('Join response:', data);
      
      // Update camps with new data
      setCamps(prevCamps => 
        prevCamps.map(camp => 
          camp.id === campId 
            ? { 
                ...camp, 
                participationCount: data.participationCount,
                spotsLeft: data.spotsLeft,
                isParticipating: true
              } 
            : camp
        )
      );
      
      // Update join status
      setJoinStatus(prev => ({
        ...prev,
        [campId]: {
          isJoining: false,
          isParticipating: true
        }
      }));
      
      alert('Successfully joined the camp!');
      
    } catch (err) {
      console.error('Error joining camp:', err);
      alert(err.message || 'Failed to join camp. Please try again.');
      
      // Reset joining status
      setJoinStatus(prev => ({
        ...prev,
        [campId]: {
          ...prev[campId],
          isJoining: false
        }
      }));
    }
  };

  return (
    <div className="flex min-h-screen bg-green-50">
      <Navbar active="Home" />
      <main className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Report Location */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <FaMapMarkerAlt className="text-4xl text-green-600 mb-2" />
            <h2 className="text-lg font-bold mb-1">Report Location</h2>
            <button
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg"
              onClick={() => navigate("/report")}
            >
              Report Now
            </button>
          </div>
          {/* Completed Logs */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <FaCheckCircle className="text-4xl text-green-600 mb-2" />
            <h2 className="text-lg font-bold mb-1">Completed Logs</h2>
            <ul className="text-gray-500 text-sm text-center mt-2">
              {completedLogs.slice(0, 3).map(log => (
                <li key={log.id}>{log.description} ({log.address || log.location})</li>
              ))}
              {completedLogs.length === 0 && <li>No completed logs yet.</li>}
            </ul>
          </div>
          {/* Your Badges */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <FaMedal className="text-4xl text-green-600 mb-2" />
            <h2 className="text-lg font-bold mb-1">Your Badges</h2>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {badges.length === 0 && <span className="text-gray-400">No badges yet.</span>}
              {badges.map(badge => (
                <span key={badge.id} className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                  {badge.icon || "🏅"} {badge.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Nearby Camps Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <FaCalendarAlt className="text-green-600 mr-2" />
            <h3 className="font-semibold text-lg">Cleanup Campaigns in Your Area</h3>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 rounded mb-3"></div>
              <div className="h-20 bg-gray-200 rounded mb-3"></div>
              <div className="h-20 bg-gray-200 rounded mb-3"></div>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-red-600 mb-2">{error}</p>
              <button 
                onClick={fetchNearbyCamps}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          ) : camps.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No cleanup campaigns currently active in your area.</p>
              <p className="mt-2">Would you like to organize one?</p>
              <button 
                onClick={() => navigate("/volunteer")}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Go to Volunteer Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {camps.map(camp => (
                <div key={camp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="md:flex-grow">
                      <h3 className="font-bold text-lg text-green-800">{camp.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <FaCalendarAlt className="inline-block mr-1" />
                        {new Date(camp.date).toLocaleDateString()} at {camp.timing || 'TBD'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <FaUsers className="inline-block mr-1" />
                        {camp.participationCount || 0} joined • {camp.spotsLeft} spots left
                      </p>
                      <p className="text-sm line-clamp-2 text-gray-700">
                        {camp.description || 'Join us for this cleanup campaign!'}
                      </p>
                    </div>
                    <div className="mt-3 md:mt-0 md:ml-4 flex-shrink-0">
                      {joinStatus[camp.id]?.isParticipating || camp.isParticipating ? (
                        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                          <FaCheck className="mr-2" />
                          You've Joined
                        </div>
                      ) : camp.spotsLeft <= 0 ? (
                        <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                          Camp is Full
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinCamp(camp.id)}
                          disabled={joinStatus[camp.id]?.isJoining}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                        >
                          {joinStatus[camp.id]?.isJoining ? 'Joining...' : 'Join Campaign'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nearby Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FaSearchLocation className="text-green-600 mr-2" />
              <h3 className="font-semibold text-lg">Nearby Activity</h3>
            </div>
            <ul className="space-y-2">
              {requests.slice(0, 5).map(req => (
                <li key={req.id} className="flex justify-between items-center">
                  <span className="truncate mr-2">{req.description} ({req.address || req.location})</span>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap
                    ${req.status === "pending" ? "bg-yellow-100 text-yellow-700" : 
                      req.status === "completed" ? "bg-green-100 text-green-700" : 
                      "bg-blue-100 text-blue-700"}`}>
                    {req.status}
                  </span>
                </li>
              ))}
              {requests.length === 0 && <li>No activity found.</li>}
            </ul>
          </div>
          {/* Filtered by Pincode */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-green-600 mr-2" />
              <h3 className="font-semibold text-lg">Filtered by Pincode</h3>
            </div>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
              placeholder="Enter Pincode"
              value={pincode}
              onChange={e => setPincode(e.target.value)}
            />
            <ul className="space-y-2">
              {filteredRequests.map(req => (
                <li key={req.id}>
                  {req.description} ({req.address || req.location}) - {req.status}
                </li>
              ))}
              {filteredRequests.length === 0 && <li>No requests for this pincode.</li>}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;