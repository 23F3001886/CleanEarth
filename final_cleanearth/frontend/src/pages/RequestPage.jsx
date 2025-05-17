import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaClipboardList, FaUpload, FaPlus } from "react-icons/fa";
import { MdDescription } from "react-icons/md";
import Navbar from "../components/Navbar";

const RequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    pincode: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch user's previous requests on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
    if (!token) {
      setRequests([]);
      setLoading(false);
      setError("Not authenticated");
      return;
    }
    let url = "http://localhost:5000/api/user_requests";
    if (user.role === "volunteer") {
      url = "http://localhost:5000/api/volunteer_requests";
    }
    
    console.log("Making request with token:", token);
    console.log("User role:", user.role);
    
    fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    })
      .then(async res => {
        if (!res.ok) {
          let msg = "Failed to load requests.";
          if (res.status === 401) msg = "Session expired. Please log in again.";
          if (res.status === 422) msg = "Could not load requests. Please contact support.";
          setError(msg);
          setRequests([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Network error. Please try again later.");
        setLoading(false);
      });
  }, []);

  // Get location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          setError("Unable to fetch location. Please enter coordinates manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // We've removed the handleImageChange function since we're now using direct URL input
  // The regular handleChange function will handle changes to the imageUrl field

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const token = localStorage.getItem("token");
    
    try {
      // Create a cleaned version of formData that matches the backend schema
      // Validate latitude and longitude as numbers
      const validateNumberField = (value) => {
        // Convert string to number (float)
        const numValue = parseFloat(value);
        // Check if it's a valid number and not NaN
        return isNaN(numValue) ? 0.0 : numValue;
      };
      
      const requestData = {
        email: formData.email,
        pincode: formData.pincode,
        description: formData.description,
        address: formData.address,
        latitude: validateNumberField(formData.latitude),
        longitude: validateNumberField(formData.longitude),
        link: formData.imageUrl || "" // Use the imageUrl as link, or empty string if not provided
      };
      
      console.log("Submitting request form...", requestData);
      
      const response = await fetch("http://localhost:5000/api/request_register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      alert("Request submitted successfully!");
      setShowForm(false);

      // Add the new request to the list (or refetch)
      setRequests([
        {
          id: data.id,
          date: new Date().toISOString().split('T')[0],
          location: formData.address,
          description: formData.description,
          status: "pending",
          link: formData.imageUrl // Store as link to match backend model
        },
        ...requests
      ]);

      // Reset form
      setFormData({
        email: formData.email,
        pincode: "",
        description: "",
        address: "",
        latitude: "",
        longitude: "",
        imageUrl: ""
      });
      setImagePreview(null);

    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#d1f1fa]">
      <Navbar active="Report" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Waste Removal Requests</h1>
          <p className="text-gray-600 mb-6">
            Report illegal dumping or waste that needs to be removed from your community.
          </p>

          {/* New Request Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition duration-300"
            >
              <FaPlus className="mr-2" />
              {showForm ? "Cancel Request" : "New Request"}
            </button>
          </div>

          {/* New Request Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-green-700 mb-4">Submit New Request</h2>
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      readOnly
                      required
                    />
                    <p className="text-xs text-black mt-1">Auto-fetched from your account</p>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pincode">
                      Pincode
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="pincode"
                      name="pincode"
                      type="text"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description of Waste
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <MdDescription />
                    </div>
                    <textarea
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="description"
                      name="description"
                      rows="3"
                      placeholder="Describe the type and amount of waste"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <FaMapMarkerAlt />
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                        Latitude
                      </label>
                      <button
                        type="button"
                        onClick={getLocation}
                        className="text-green-600 text-xs underline"
                      >
                        Auto Fetch Location
                      </button>
                    </div>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="0.0000001"
                      value={formData.latitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                      Longitude
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="0.0000001"
                      value={formData.longitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="imageUrl">
                    Image Link
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-green-600">
                      <FaUpload />
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      placeholder="Enter direct link to image (optional)"
                      value={formData.imageUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-xs text-black mt-1">Paste a direct URL to an image, e.g., https://example.com/image.jpg</p>
                  {formData.imageUrl && (
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Link provided:</span>
                      <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline text-sm">
                        View Image
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Previous Requests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FaClipboardList className="text-green-600 mr-2 text-xl" />
              <h2 className="text-xl font-bold text-green-700">Your Previous Requests</h2>
            </div>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading your requests...</p>
            ) : requests.length > 0 ? (
              <div className="divide-y">
                {requests.map((request) => (
                  <div key={request.id} className="py-4 flex flex-col md:flex-row md:items-center">
                    <div className="md:w-1/4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-200">
                        {request.link ? (
                          <img src={request.link} alt="Waste" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            Image
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-2/4 mt-3 md:mt-0">
                      <h3 className="font-medium">{request.description}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        <FaMapMarkerAlt className="inline mr-1" />
                        {request.address}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Reported on: {request.date || request.created_at?.split("T")[0]}</p>
                    </div>
                    <div className="md:w-1/4 mt-3 md:mt-0 md:text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                          ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No requests found. Create your first request above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPage;
