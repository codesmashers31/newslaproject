import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-[#0b0c10]">
      <div className="rounded-full bg-violet-50 p-6 text-violet-800 dark:bg-violet-950/30 dark:text-violet-400">
        <HelpCircle size={64} className="animate-bounce" />
      </div>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
        404 - Page Not Found
      </h1>
      <p className="mt-4 text-base text-gray-500 dark:text-gray-400 max-w-md">
        The link you followed may be broken, or the page may have been removed. Let's get you back to safety.
      </p>
      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-violet-800 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-all duration-300"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
