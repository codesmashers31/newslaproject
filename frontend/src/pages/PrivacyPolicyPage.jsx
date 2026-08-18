import React from 'react';
import { Shield, ArrowLeft, Mail, Lock, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  const effectiveDate = 'August 18, 2026';
  const supportEmail = 'support@softlogicsla.in';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">SLA BuildX</h1>
              <p className="text-xs text-gray-400 font-medium">Privacy Policy & Data Governance</p>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-all border border-gray-700/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Application</span>
          </Link>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12 border-b border-gray-800 pb-8">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
            Official Compliance Document
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3 tracking-tight">
            Privacy Policy for SLA BuildX
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Effective Date: <span className="text-gray-200 font-semibold">{effectiveDate}</span> • Last Updated: <span className="text-gray-200 font-semibold">{effectiveDate}</span>
          </p>
        </div>

        {/* Section Cards */}
        <div className="space-y-10 text-sm text-gray-300 leading-relaxed">
          
          {/* Section 1 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">1</span>
              Introduction
            </h2>
            <p>
              Welcome to <strong>SLA BuildX</strong> ("we", "our", or "us"), an internal learning, training, attendance, and career placement management platform operated for Softlogic Systems students, trainers, and administrators. 
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your personal information when you use the SLA BuildX web application and mobile application. By accessing or using SLA BuildX, you consent to the data practices described in this document.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">2</span>
              Information We Collect
            </h2>
            <p>
              SLA BuildX processes information strictly required to facilitate academic course delivery, attendance tracking, skill development, and career placement services.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li><strong>Student & Account Credentials:</strong> Full Name, Student Identification Number (EID/SLAEID), Email Address, Mobile Number, Profile Password (encrypted), and Role.</li>
              <li><strong>Academic & Profile Details:</strong> College Name, Degree Program, Department, Year of Passing, Date of Birth, Gender, Address, Skills list, LinkedIn URL, GitHub profile link, and Bio.</li>
              <li><strong>Documents & Attachments:</strong> Profile photograph and Resume files uploaded voluntarily by the user for placement readiness.</li>
              <li><strong>Training & Attendance Records:</strong> Batch enrollments (Technical, Communication, Aptitude), daily attendance check-in records, QR scan logs (timestamp, room number, floor number), assessment scores, and trainer feedback.</li>
              <li><strong>Device & Network Identifiers:</strong> IP address, device model, operating system version, and unique device tokens used for secure single-device authentication enforcement and QR attendance verification.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">3</span>
              How We Use Information
            </h2>
            <p>We use the collected information exclusively for legitimate training and career operations, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
              <li>Authenticating student and trainer logins securely.</li>
              <li>Verifying daily classroom attendance via projected QR session tokens.</li>
              <li>Calculating curriculum progress, attendance percentages, and test scorecards.</li>
              <li>Matching student profiles with hiring partners for recruitment and placement drives.</li>
              <li>Preventing unauthorized multi-device account sharing or proxy attendance.</li>
              <li>Sending important push notifications and academic announcements.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">4</span>
              QR Code Attendance & Camera Access
            </h2>
            <p>
              The SLA BuildX mobile application requests access to your device's camera for the explicit purpose of scanning dynamic QR codes generated during live class sessions. 
            </p>
            <p>
              Camera access is strictly limited to scanning class session tokens. We do NOT record, capture, or transmit video or photographs from your camera during QR scanning routines.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">5</span>
              Data Security & Storage
            </h2>
            <p>
              We implement industry-standard administrative, physical, and technical safeguards to protect your personal information against unauthorized access, loss, or alteration.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
              <li>All API communication between web/mobile clients and servers is encrypted using standard HTTPS/TLS protocols.</li>
              <li>Passwords are hashed using secure bcrypt encryption before storage.</li>
              <li>JWT authentication tokens are securely managed with expiration safeguards.</li>
              <li>Data is stored in protected cloud infrastructure with strict access controls.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">6</span>
              Third-Party Sharing
            </h2>
            <p>
              SLA BuildX does <strong>NOT</strong> sell, rent, trade, or monetize student personal data to third-party advertisers. 
            </p>
            <p>
              Information is shared only with authorized Softlogic Systems academic staff, assigned trainers, and verified prospective employers for recruitment and interview scheduling.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-gray-800/40 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-black">7</span>
              Student Rights & Account Deletion
            </h2>
            <p>
              Students have the right to review, update, or request corrections to their profile information at any time within the application.
            </p>
            <p>
              To request account deactivation, data export, or deletion of personal information, students may submit a request to our operations team at <a href={`mailto:${supportEmail}`} className="text-purple-400 underline">{supportEmail}</a> or coordinate directly with their assigned institute program coordinator.
            </p>
          </section>

          {/* Section 8 - Contact */}
          <section className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Contact Information
            </h2>
            <p className="text-gray-300">
              If you have any questions, concerns, or requests regarding this Privacy Policy or data handling practices, please contact us at:
            </p>
            <div className="pt-2 text-sm text-gray-200 space-y-1">
              <p><strong>Organization:</strong> Softlogic Systems Learning Application (SLA BuildX)</p>
              <p><strong>Official Support Email:</strong> <a href={`mailto:${supportEmail}`} className="text-purple-400 hover:underline">{supportEmail}</a></p>
              <p><strong>Platform Web URL:</strong> <a href="https://newslaproject.vercel.app" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">https://newslaproject.vercel.app</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-800 text-center py-6 text-xs text-gray-500">
        © 2026 Softlogic Systems (SLA BuildX). All rights reserved.
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
