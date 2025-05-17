import React, { useState, useEffect } from 'react';
import VolunteerNavbar from '../components/VolunteerNavbar';
import { FaCrown, FaMedal, FaUser, FaStar, FaTrophy } from 'react-icons/fa';

const VolunteerLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulated API call
        const mockData = [
          { id: 1, name: 'Sarah Johnson', campsAttended: 12, badges: 5, points: 450 },
          { id: 2, name: 'Mike Chen', campsAttended: 10, badges: 4, points: 380 },
          { id: 3, name: 'Emma Wilson', campsAttended: 9, badges: 3, points: 320 },
          { id: 4, name: 'Alex Turner', campsAttended: 8, badges: 3, points: 295 },
          { id: 5, name: 'Priya Patel', campsAttended: 7, badges: 2, points: 260 },
        ];

        // Sort by camps attended
        const sortedData = mockData.sort((a, b) => b.campsAttended - a.campsAttended);
        setLeaderboard(sortedData);

        // Find current user (mock example)
        const currentUser = sortedData.find(volunteer => volunteer.id === 4);
        if (currentUser) {
          setCurrentUserRank(sortedData.indexOf(currentUser) + 1);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaCrown className="text-yellow-400 text-2xl" />;
    if (rank === 2) return <FaMedal className="text-gray-400 text-2xl" />;
    if (rank === 3) return <FaMedal className="text-yellow-600 text-2xl" />;
    return <span className="text-gray-500 font-bold">{rank}</span>;
  };

  return (
    <div className="flex min-h-screen bg-[#d1f1fa]">
      <VolunteerNavbar active="Leaderboard" />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <FaTrophy className="text-3xl text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-green-700">Volunteer Leaderboard</h1>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500">Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {/* Top 3 Volunteers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {leaderboard.slice(0, 3).map((volunteer, index) => (
                  <div key={volunteer.id} className={`p-6 rounded-xl shadow-lg ${index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : 'bg-yellow-100'}`}>
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-2xl text-green-600" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-1">{volunteer.name}</h3>
                      <div className="flex items-center justify-center mb-2">
                        {getRankIcon(index + 1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{volunteer.campsAttended} Camps</p>
                        <p>{volunteer.points} Points</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full Leaderboard Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-4 text-left">Rank</th>
                      <th className="px-6 py-4 text-left">Volunteer</th>
                      <th className="px-6 py-4 text-center">Camps</th>
                      <th className="px-6 py-4 text-center">Points</th>
                      <th className="px-6 py-4 text-center">Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((volunteer, index) => (
                      <tr 
                        key={volunteer.id}
                        className={`border-t ${currentUserRank === index + 1 ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center">
                            {getRankIcon(index + 1)}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="text-green-600" />
                            </div>
                            <span>{volunteer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">{volunteer.campsAttended}</td>
                        <td className="px-6 py-3 text-center">{volunteer.points}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex justify-center space-x-1">
                            {[...Array(volunteer.badges)].map((_, i) => (
                              <FaStar key={i} className="text-yellow-400" />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Current User Ranking */}
              {currentUserRank && (
                <div className="mt-6 bg-green-100 rounded-xl p-4">
                  <div className="flex items-center">
                    <FaUser className="text-green-600 mr-2" />
                    <span className="font-medium">Your Current Rank: #{currentUserRank}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerLeaderboard;