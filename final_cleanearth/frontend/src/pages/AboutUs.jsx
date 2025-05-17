import React from "react";
import VolunteerNavbar from "../components/VolunteerNavbar";
import { FaLeaf, FaSeedling } from "react-icons/fa";

const AboutUs = () => (
  <div className="flex min-h-screen bg-gradient-to-br from-green-100 to-blue-50">
    {/* Navbar */}
    <VolunteerNavbar active="About" />
    
    {/* Main Content */}
    <div className="flex-1 flex flex-col items-center py-10 px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        {/* Mission */}
        <div className="flex items-center mb-2">
          <FaLeaf className="text-green-700 text-3xl mr-2" />
          <h1 className="text-4xl font-bold text-green-700 text-center">Our Mission</h1>
        </div>
        <p className="text-lg text-gray-700 text-center mb-6">
          At <span className="font-semibold text-green-600">CleanEarth</span>, our mission is simple yet powerful:{" "}
          <span className="italic">to protect and preserve our planet by transforming the way we manage waste</span>. 
          We believe waste is not the end of a product's life-it's the beginning of something more responsible and sustainable.
          Every action, big or small, can help build a cleaner, greener future for generations to come.
        </p>

        {/* Vision */}
        <h2 className="text-2xl font-semibold text-green-600 mb-2 mt-6">Our Vision</h2>
        <p className="text-gray-600 text-center mb-6">
          Our vision is to be a leader in sustainability, empowering communities and industries to thrive without compromising the environment. 
          We are committed to innovative solutions that reduce environmental impact, accelerate the transition to a circular economy, and inspire people everywhere to join us on this journey toward a thriving, waste-free world.
        </p>

        {/* Inspirational Message */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-8 w-full">
          <p className="text-green-800 text-lg font-medium text-center">
            "Together, we can turn today's waste into tomorrow's resources. Join us in making every day Earth Day with CleanEarth."
          </p>
        </div>

        {/* Founder Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 mt-8 mb-4 w-full">
          <img
            src="E:\CleanEarth\Frontend\src\assets\WIN_20241125_17_44_28_Pro.jpg"
            alt="Nitesh Sharma"
            className="w-32 h-32 rounded-full border-4 border-green-400 shadow-md object-cover"
          />
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-green-700">Meet Our Founder</h3>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Nitesh Sharma</span> founded CleanEarth with a vision to inspire change and make sustainability accessible to all. 
              With a passion for environmental stewardship and a commitment to innovation, Nitesh has led CleanEarth from a bold idea to a movement that empowers people and businesses to take meaningful action for the planet.
            </p>
          </div>
        </div>

        {/* Team/Illustration Image */}
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
          alt="CleanEarth Team at Work"
          className="rounded-xl shadow-lg mt-8 mb-4 w-full object-cover"
          style={{ maxHeight: "300px" }}
        />

        {/* Closing Statement */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            <span className="font-semibold text-green-600">CleanEarth</span> is more than a company-it's a community. 
            Together, we're reimagining waste, restoring ecosystems, and building a legacy of sustainability.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default AboutUs;