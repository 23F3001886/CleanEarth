import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const CampPage = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [participating, setParticipating] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) {
      setCamps([]);
      setLoading(false);
      setError("Not authenticated");
      return;
    }
    let url = "http://localhost:5000/api/user_camps";
    if (user.role === "volunteer") {
      url = "http://localhost:5000/api/volunteer_camps";
    }
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(async res => {
        if (!res.ok) {
          setError("Failed to load camps.");
          setCamps([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCamps(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Network error. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleParticipate = async (campId) => {
    setParticipating(prev => ({ ...prev, [campId]: true }));
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/camp_participate/${campId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok) {
        setCamps(camps => camps.map(c => c.id === campId ? { ...c, num_volunteers: data.num_volunteers } : c));
      } else {
        alert(data.error || "Failed to participate");
      }
    } catch (e) {
      alert("Network error");
    }
    setParticipating(prev => ({ ...prev, [campId]: false }));
  };

  return (
    <div className="flex min-h-screen bg-[#d1f1fa]">
      <Navbar active="Camps" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Active Camps in Your Area</h1>
          {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading camps...</p>
          ) : camps.length > 0 ? (
            <div className="divide-y">
              {camps.map((camp) => (
                <div key={camp.id} className="py-4 flex flex-col md:flex-row md:items-center">
                  <div className="md:w-2/4 mt-3 md:mt-0">
                    <h3 className="font-medium">{camp.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{camp.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Date: {camp.date}</p>
                    <p className="text-sm text-gray-500 mt-1">Volunteers/People: {camp.num_volunteers}</p>
                  </div>
                  <div className="md:w-1/4 mt-3 md:mt-0 md:text-right">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                      disabled={participating[camp.id]}
                      onClick={() => handleParticipate(camp.id)}
                    >
                      {participating[camp.id] ? "Joining..." : "Participate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No active camps found in your area.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampPage;