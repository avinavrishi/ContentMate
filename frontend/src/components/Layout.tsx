import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../store/slices/uiSlice';
import { RootState } from '../store';
import {
  HomeIcon,
  FolderIcon,
  SunIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  BellIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Files", href: "/files", icon: FolderIcon },
  { name: "AI Model Testing", href: "/ai-model-testing", icon: FolderIcon },
];

const whatsNewContent = [
  {
    title: "Content Generation",
    description:
      "AI-powered content generation for videos, blogs, and social media",
    date: "March 2024",
  },
  {
    title: "Smart File Management",
    description: "Organize and manage your content files efficiently",
    date: "March 2024",
  },
  {
    title: "Multi-format Export",
    description:
      "Export your content in various formats suitable for different platforms",
    date: "Coming Soon",
  },
];

export default function Layout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const isSidebarExpanded = useSelector((state: RootState) => state.ui.isSidebarExpanded);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Handle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleSettingsClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      setShowProfile(false);
    } else {
      // Navigate to settings page
      window.location.href = "/settings";
      closeAllModals();
    }
  };

  // Add cleanup function for modals
  const closeAllModals = () => {
    setShowNotifications(false);
    setShowWhatsNew(false);
    setShowHelpCenter(false);
    setShowProfile(false);
    setShowLoginModal(false);
  };

  // Update modal state handlers
  const handleProfileClick = () => {
    closeAllModals();
    setShowProfile(true);
  };

  const handleHelpCenterClick = () => {
    closeAllModals();
    setShowHelpCenter(true);
  };

  return (
    <div
      className={classNames(
        "min-h-screen transition-colors duration-200",
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <nav
        className={classNames(
          "shadow-sm fixed w-full z-10",
          isDarkMode ? "bg-gray-800" : "bg-white"
        )}
      >
        <div className="px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.svg" alt="ContentMate" className="h-8 w-8" />
                <span className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                  ContentMate
                </span>
              </Link>
            </div>

            {/* Right side navigation items */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={classNames(
                  "p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-100",
                  isDarkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>

              {/* Other buttons with updated dark mode classes */}
              <button
                onClick={handleHelpCenterClick}
                className={classNames(
                  "p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-100",
                  isDarkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Help Center"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowWhatsNew(true)}
                className={classNames(
                  "p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-100",
                  isDarkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="What's New"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowNotifications(true)}
                className={classNames(
                  "p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-100 relative",
                  isDarkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Notifications"
              >
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button
                onClick={handleProfileClick}
                className={classNames(
                  "p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-100",
                  isDarkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Profile"
              >
                <UserCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar with collapse button */}
        <div
          className={classNames(
            "transition-all duration-300 ease-in-out shadow-sm fixed h-[calc(100vh-4rem)]",
            isDarkMode ? "bg-gray-800" : "bg-white",
            isSidebarExpanded ? "w-64" : "w-16"
          )}
        >
          {/* Collapse button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={classNames(
              "absolute -right-3 top-6 p-1 rounded-full shadow-md z-10 transition-colors",
              isDarkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600",
              "hover:bg-gray-100 dark:hover:bg-gray-600"
            )}
          >
            {!isSidebarExpanded ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </button>

          <nav className="mt-6 px-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = 
                  item.href === '/' 
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      isActive
                        ? isDarkMode
                          ? "bg-gray-700 text-white"
                          : "bg-indigo-50 text-indigo-600"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150",
                      !isSidebarExpanded && "justify-center"
                    )}
                    title={!isSidebarExpanded ? item.name : undefined}
                  >
                    <item.icon
                      className={classNames(
                        isActive
                          ? isDarkMode
                            ? "text-white"
                            : "text-indigo-500"
                          : isDarkMode
                          ? "text-gray-400 group-hover:text-white"
                          : "text-gray-400 group-hover:text-gray-500",
                        "flex-shrink-0 h-5 w-5 transition-colors duration-150",
                        isSidebarExpanded && "mr-3"
                      )}
                      aria-hidden="true"
                    />
                    {isSidebarExpanded && item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className={classNames(
          "flex-1 transition-all duration-300",
          isSidebarExpanded ? "ml-64" : "ml-16"
        )}>
          <div className={classNames(
            "p-6",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Help Center Modal */}
      {showHelpCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={classNames(
              "rounded-lg p-6 w-[480px]",
              isDarkMode ? "bg-gray-800 text-white" : "bg-white"
            )}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Help Center</h2>
              <button
                onClick={() => setShowHelpCenter(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/help/getting-started"
                    className={
                      isDarkMode
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-600 hover:text-indigo-500"
                    }
                    onClick={() => setShowHelpCenter(false)}
                  >
                    Getting Started Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help/faqs"
                    className={
                      isDarkMode
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-600 hover:text-indigo-500"
                    }
                    onClick={() => setShowHelpCenter(false)}
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help/contact"
                    className={
                      isDarkMode
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-600 hover:text-indigo-500"
                    }
                    onClick={() => setShowHelpCenter(false)}
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* What's New Modal */}
      {showWhatsNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={classNames(
              "rounded-lg p-6 w-[480px]",
              isDarkMode ? "bg-gray-800 text-white" : "bg-white"
            )}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">What's New</h2>
              <button
                onClick={() => setShowWhatsNew(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              {whatsNewContent.map((item, index) => (
                <div
                  key={index}
                  className={classNames(
                    "border-l-2 border-indigo-500 pl-4",
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  )}
                >
                  <h3 className="font-medium text-lg">{item.title}</h3>
                  <p className="text-sm mt-1">{item.description}</p>
                  <p
                    className={classNames(
                      "text-xs mt-2",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    {item.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className={classNames(
              "absolute right-4 top-16 w-80 rounded-lg shadow-lg border",
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={classNames(
                "p-4 border-b",
                isDarkMode ? "border-gray-700" : "border-gray-200"
              )}
            >
              <h2 className="font-semibold">Notifications</h2>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <div
                className={classNames(
                  "p-4 cursor-pointer border-b",
                  isDarkMode
                    ? "hover:bg-gray-700 border-gray-700"
                    : "hover:bg-gray-50 border-gray-100"
                )}
              >
                <p className="text-sm font-medium">Welcome to ContentMate!</p>
                <p
                  className={classNames(
                    "text-xs mt-1",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}
                >
                  Get started by exploring our features
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Panel */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowProfile(false)}
        >
          <div
            className={classNames(
              "absolute right-4 top-16 w-64 rounded-lg shadow-lg border",
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={classNames(
                "p-4 border-b",
                isDarkMode ? "border-gray-700" : "border-gray-200"
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={classNames(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isDarkMode ? "bg-gray-700" : "bg-indigo-100"
                  )}
                >
                  <UserCircleIcon
                    className={classNames(
                      "w-6 h-6",
                      isDarkMode ? "text-gray-300" : "text-indigo-600"
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium">Guest User</p>
                  <button
                    className={
                      isDarkMode
                        ? "text-sm text-indigo-400 hover:text-indigo-300"
                        : "text-sm text-indigo-600 hover:text-indigo-500"
                    }
                    onClick={() => setShowLoginModal(true)}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={handleSettingsClick}
                className={classNames(
                  "w-full text-left px-3 py-2 text-sm rounded-md",
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                Settings
              </button>
              <button
                onClick={handleHelpCenterClick}
                className={classNames(
                  "w-full text-left px-3 py-2 text-sm rounded-md",
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                Help & Support
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={classNames(
              "rounded-lg p-6 w-[400px]",
              isDarkMode ? "bg-gray-800 text-white" : "bg-white"
            )}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Sign In</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <p
                className={classNames(
                  "text-sm",
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                )}
              >
                Please sign in or create an account to access settings
              </p>
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  onClick={() => {
                    setIsLoggedIn(true);
                    closeAllModals();
                  }}
                >
                  Sign In
                </button>
                <button
                  className={classNames(
                    "flex-1 px-4 py-2 rounded-lg",
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
