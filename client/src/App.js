import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { checkSession } from './store/slices/authSlice'
import Navbar from './components/nav/Navbar'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import HomePage from './pages/user/HomePage'
import DiscoverPage from './pages/discover/DiscoverPage'
import ContentDetailPage from './pages/content/ContentDetailPage'
import FeedPage from './pages/feed/FeedPage'
import CommunitiesPage from './pages/community/CommunitiesPage'
import CommunityDetailPage from './pages/community/CommunityDetailPage'
import ProfilePage from './pages/profile/ProfilePage'
import FollowersPage from './pages/profile/FollowersPage'
import FollowingPage from './pages/profile/FollowingPage'
import ListsPage from './pages/lists/ListsPage'
import ListDetailPage from './pages/lists/ListDetailPage'
import WatchPartyPage from './pages/watchparty/WatchPartyPage'
import WatchPartiesPage from './pages/watchparty/WatchPartiesPage'
import ImportPage from './pages/import/ImportPage'
import LandingPage from './pages/landing/LandingPage'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(checkSession())
  }, [dispatch])

  return (
    <Router>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/content/:id" element={<ContentDetailPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/community/:slug" element={<CommunityDetailPage />} />
          <Route path="/user/:username" element={<ProfilePage />} />
          <Route path="/user/:username/followers" element={<FollowersPage />} />
          <Route path="/user/:username/following" element={<FollowingPage />} />
          <Route path="/lists" element={<ProtectedRoute><ListsPage /></ProtectedRoute>} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/watch-parties" element={<WatchPartiesPage />} />
          <Route path="/watch-party/:id" element={<WatchPartyPage />} />
          <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
