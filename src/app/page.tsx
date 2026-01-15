import Link from "next/link";
import { Truck, Package, Shield, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900">
      {/* Navigation */}
      <nav className="px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NTS Logistics</h1>
              <p className="text-sm text-blue-200 font-medium">Nationwide Freight Solutions</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-white hover:text-blue-200 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold text-white">
            Professional Freight Brokerage
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            From auto transport to heavy equipment - trusted by businesses nationwide
          </p>
          
          <div className="flex justify-center gap-4 pt-8">
            <Link 
              href="/signup" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Request a Quote
            </Link>
            <Link 
              href="/login" 
              className="bg-white text-blue-900 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg"
            >
              Client Portal
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Reliable Delivery</h3>
            <p className="text-blue-200 text-sm">On-time freight delivery nationwide</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Fully Insured</h3>
            <p className="text-blue-200 text-sm">Complete cargo protection</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">All Freight Types</h3>
            <p className="text-blue-200 text-sm">Vehicles, equipment, machinery</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">24/7 Support</h3>
            <p className="text-blue-200 text-sm">Always here when you need us</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">15+</div>
            <div className="text-blue-200">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">150K+</div>
            <div className="text-blue-200">Trucks Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">30K+</div>
            <div className="text-blue-200">Carriers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">$0</div>
            <div className="text-blue-200">Setup Fees</div>
          </div>
        </div>
      </div>
    </div>
  );
}
