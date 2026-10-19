import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import { Footer, Visuals, SEO } from './components/index'

function RouteSEO() {
  const location = useLocation()
  const path = location.pathname

  let title = 'Aura-7F | BashClan 1 of Byte Bash Blitz'
  let description = 'Aura-7F (Aura 7f / Aura) is BashClan 1 of 4 BashClans in Byte Bash Blitz (ByteBashBlitz). Empowering Bashers with tech events, hackathons, open-source projects, and developer collaboration.'
  let keywords = 'aura7f, aura 7f, aura, aura7f bashclan, aura 7f bashclan 1, bashclan 1, bashclan, byte bash blitz, bytebashblitz, bashers, aura7f.in, tech community, developer community, coding community'

  if (path === '/' || path === '/home' || path === '/newhome' || path === '/home-v3' || path === '/home-design' || path === '/kingdomhome' || path === '/betterhome') {
    title = 'Aura-7F | BashClan 1 of Byte Bash Blitz'
    description = 'Aura-7F (Aura 7f / Aura) is BashClan 1 of the 4 BashClans in Byte Bash Blitz (ByteBashBlitz). Home of the Bashers. Join us for hackathons, open-source projects, and tech workshops.'
  } else if (path === '/about') {
    title = 'About Aura-7F | BashClan 1 Vision & Team'
    description = 'Learn about Aura-7F (Aura 7f), BashClan 1 of 4 BashClans in Byte Bash Blitz (ByteBashBlitz). Discover our mission, clan principles, and leadership.'
    keywords = 'about aura7f, aura 7f about, aura7f bashclan, bashclan 1, byte bash blitz, bytebashblitz, bashers, aura7f.in'
  } else if (path === '/events' || path === '/newevents' || path === '/events-design') {
    title = 'Events, Quizzes & Hackathons | Aura-7F BashClan 1'
    description = 'Explore upcoming tech events, hackathons, live coding challenges, and quizzes hosted by Aura-7F (BashClan 1 of Byte Bash Blitz).'
    keywords = 'aura7f events, aura 7f hackathons, byte bash blitz events, bytebashblitz, bashers events, aura quizzes, bashclan 1'
  } else if (path === '/privacy-policy') {
    title = 'Privacy Policy | Aura-7F BashClan 1'
    description = 'How Aura-7F (BashClan 1 of Byte Bash Blitz) collects, uses and shares event registration data, photos, streams and name lists.'
    keywords = 'aura7f privacy policy, aura 7f privacy, bashclan 1 privacy, byte bash blitz privacy'
  } else if (path === '/login-design' || path === '/login') {
    title = 'Login | Aura-7F BashClan 1'
    description = 'Sign in to Aura-7F (BashClan 1 of Byte Bash Blitz) with Discord or your clan credentials.'
    keywords = 'aura7f login, aura 7f sign in, discord login, bashclan 1, byte bash blitz login'
  } else if (path === '/projects' || path === '/newprojects') {
    title = 'Projects & Code Relics | Aura-7F BashClan 1'
    description = 'Browse innovative software projects, tools, and open-source relics forged by Bashers in Aura-7F (BashClan 1 of Byte Bash Blitz).'
    keywords = 'aura7f projects, aura 7f code, byte bash blitz projects, bytebashblitz, bashers projects, open source, bashclan 1'
  } else if (path === '/members' || path === '/newmembers' || path === '/members-design') {
    title = 'Clan Roster & Members | Aura-7F BashClan 1'
    description = 'Meet the Bashers, software architects, designers, and developers powering Aura-7F (BashClan 1 of Byte Bash Blitz).'
    keywords = 'aura7f members, aura 7f team, bashclan 1 roster, byte bash blitz members, bytebashblitz, bashers'
  } else if (path === '/milestones') {
    title = 'Milestones & Achievements | Aura-7F BashClan 1'
    description = 'Track key milestones, awards, project launches, and achievements of Aura-7F (BashClan 1 of Byte Bash Blitz).'
    keywords = 'aura7f milestones, aura 7f achievements, byte bash blitz milestones, bytebashblitz, bashers'
  } else if (path === '/gallery' || path === '/newgallery') {
    title = 'Gallery & Highlights | Aura-7F BashClan 1'
    description = 'Visual highlights, event photos, and memory gallery from Aura-7F (BashClan 1 of Byte Bash Blitz).'
    keywords = 'aura7f gallery, aura 7f photos, byte bash blitz gallery, bytebashblitz, bashers photos'
  } else if (path.startsWith('/quiz/leaderboard')) {
    title = 'Quiz Leaderboard | Aura-7F BashClan 1'
    description = 'Check live rankings and scoreboards for coding quizzes and technical challenges in Aura-7F (Byte Bash Blitz).'
    keywords = 'aura7f leaderboard, aura 7f rankings, byte bash blitz quiz, bytebashblitz, bashers leaderboard'
  }

  return <SEO title={title} description={description} keywords={keywords} />
}
import { BackgroundBeams } from './components/ui/beams'
import { StarfieldBackground } from './components/ui/starfield'
import { OrbitsBackground } from './components/ui/orbits'
import { ShockwavesBackground } from './components/ui/shockwaves'
import { HexagonsBackground } from './components/ui/hexagons'
import { HackerBackground } from './components/ui/hacker-background'
import SplashCursor from './components/SplashCursor'
import ScrollToTop from './components/ScrollToTop'
import { Home, About, Members, Events, Login, Admin, AddMember, Projects, Profile, Milestones, BetterHome, KingdomHome } from './pages/index'
import NewHome from './pages/NewHome'
import BaseUI from './pages/base'
import NewBase from './pages/NewBase'
import QuizAuth from './pages/QuizAuth'
import QuizDashboard from './pages/QuizDashboard'
import QuizTake from './pages/QuizTake'
import QuizResults from './pages/QuizResults'
import QuizLeaderboard from './pages/QuizLeaderboard'
import LiveQuizHost from './pages/LiveQuizHost'
import LiveQuizParticipate from './pages/LiveQuizParticipate'
const Gallery = React.lazy(() => import('./pages/Gallery'))
const NewGallery = React.lazy(() => import('./pages/NewGallery'))
const NewEvents = React.lazy(() => import('./pages/NewEvents'))
const NewProjects = React.lazy(() => import('./pages/NewProjects'))
const NewMembers = React.lazy(() => import('./pages/NewMembers'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const GuestDashboard = React.lazy(() => import('./pages/GuestDashboard'))
const Registration = React.lazy(() => import('./pages/Registration'))
const HomeV3 = React.lazy(() => import('./pages/home-v3'))
const HomeDesign = React.lazy(() => import('./pages/home-design'))
const EventsDesign = React.lazy(() => import('./pages/events-design'))
const MembersDesign = React.lazy(() => import('./pages/members-design'))
const LoginDesign = React.lazy(() => import('./pages/login-design'))
const RegistrationDesign = React.lazy(() => import('./pages/registration-design'))
const PrivacyPolicy = React.lazy(() => import('./pages/privacy-policy'))
import { Analytics } from "@vercel/analytics/react"
import { AuthProvider } from './contexts/AuthContext'
import { QuizAuthProvider } from './contexts/QuizAuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

function AppContent() {
  const location = useLocation()

  const hideNavAndFooter = location.pathname.startsWith('/quiz/take') ||
    location.pathname.startsWith('/quiz/live') ||
    location.pathname.startsWith('/admin/quiz/host') ||
    location.pathname.startsWith('/base') ||
    location.pathname.startsWith('/newbase') ||
    location.pathname.startsWith('/newhome') ||
    location.pathname.startsWith('/home-v3') ||
    location.pathname.startsWith('/home-design') ||
    location.pathname.startsWith('/events-design') ||
    location.pathname.startsWith('/members-design') ||
    location.pathname.startsWith('/login-design') ||
    location.pathname.startsWith('/registration-design') ||
    location.pathname.startsWith('/privacy-policy') ||
    location.pathname.startsWith('/betterhome') ||
    location.pathname.startsWith('/kingdomhome') ||
    location.pathname.startsWith('/newgallery') ||
    location.pathname.startsWith('/newevents') ||
    location.pathname.startsWith('/newprojects') ||
    location.pathname.startsWith('/newmembers') ||
    location.pathname.startsWith('/registration') ||
    location.pathname.startsWith('/admindashboard') ||
    location.pathname.startsWith('/guestdashboard');

  // Page entrance animations are handled per-component (see AnimateOnView).

  const showUnderConstruction = import.meta.env.VITE_UNDER_CONSTRUCTION === 'true'

  if (showUnderConstruction) {
    return <UnderConstructionModal />
  }

  return (
    <AuthProvider>
      <QuizAuthProvider>
        <RouteSEO />
        <ScrollToTop />
        <div className="min-h-screen text-aura relative z-10" style={{ background: 'var(--aura-dark)', color: 'var(--aura-text)' }}>
          {/* Global Splash Cursor Effect */}
          {/* <SplashCursor
            TRANSPARENT={true}
            BACK_COLOR={{ r: 0.02, g: 0.01, b: 0.04 }}
            SPLAT_RADIUS={0.25}
            CURL={5}
            COLOR_UPDATE_SPEED={8}
          /> */}
          {/* Fixed full-viewport background (Hyperspeed on home, Visuals elsewhere) */}
          {location.pathname === '/home' || location.pathname === '/about' || location.pathname === '/milestones' || location.pathname.startsWith('/profile/') ? (
            <div className="fixed inset-0 -z-10 pointer-events-none">
              <StarfieldBackground />
            </div>
          ) : location.pathname === '/events' ? (
            <div className="fixed inset-0 -z-10 pointer-events-none">
              <HexagonsBackground />
            </div>
          ) : (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) || location.pathname === '/moderator' ? (
            <div className="fixed inset-0 -z-10 pointer-events-none">
              <BackgroundBeams />
            </div>
          ) : location.pathname === '/members' ? (
            <div className="fixed inset-0 -z-10 pointer-events-none">
              <HackerBackground color="#776c07" fontSize={16} speed={0.8} />
            </div>
          ) : location.pathname === '/gallery' || location.pathname === '/newgallery' || location.pathname === '/newevents' || location.pathname === '/newprojects' || location.pathname === '/newmembers' || location.pathname.startsWith('/registration') || location.pathname.startsWith('/admindashboard') || location.pathname.startsWith('/guestdashboard') || location.pathname.startsWith('/newhome') || location.pathname.startsWith('/home-v3') || location.pathname.startsWith('/home-design') || location.pathname.startsWith('/events-design') || location.pathname.startsWith('/members-design') || location.pathname.startsWith('/login-design') || location.pathname.startsWith('/registration-design') || location.pathname.startsWith('/privacy-policy') || location.pathname.startsWith('/betterhome') || location.pathname.startsWith('/kingdomhome') || location.pathname.startsWith('/base') || location.pathname.startsWith('/newbase') ? (
            null
          ) : (
            <div className="fixed inset-0 -z-10 pointer-events-none">
              <Visuals />
            </div>
          )}
          {!hideNavAndFooter && <Header />}
          <main className={`${location.pathname === '/gallery' || location.pathname === '/newgallery' || location.pathname === '/newevents' || location.pathname === '/newprojects' || location.pathname === '/newmembers' || location.pathname.startsWith('/registration') || location.pathname.startsWith('/admindashboard') || location.pathname.startsWith('/guestdashboard') || location.pathname.startsWith('/newhome') || location.pathname.startsWith('/home-v3') || location.pathname.startsWith('/home-design') || location.pathname.startsWith('/events-design') || location.pathname.startsWith('/members-design') || location.pathname.startsWith('/login-design') || location.pathname.startsWith('/registration-design') || location.pathname.startsWith('/privacy-policy') || location.pathname.startsWith('/betterhome') || location.pathname.startsWith('/kingdomhome') || location.pathname.startsWith('/base') || location.pathname.startsWith('/newbase') ? 'w-full' : 'container mx-auto px-3 sm:px-6'} ${hideNavAndFooter ? 'pt-0 pb-0' : 'pt-20 pb-1 md:pb-2 lg:pb-2'} min-h-screen overflow-hidden`}>
            <div className={`${location.pathname === '/gallery' || location.pathname === '/newgallery' || location.pathname === '/newevents' || location.pathname === '/newprojects' || location.pathname === '/newmembers' || location.pathname.startsWith('/registration') || location.pathname.startsWith('/admindashboard') || location.pathname.startsWith('/guestdashboard') ? 'max-w-[95rem]' : (location.pathname.startsWith('/newhome') || location.pathname.startsWith('/home-v3') || location.pathname.startsWith('/home-design') || location.pathname.startsWith('/events-design') || location.pathname.startsWith('/members-design') || location.pathname.startsWith('/login-design') || location.pathname.startsWith('/registration-design') || location.pathname.startsWith('/privacy-policy') || location.pathname.startsWith('/betterhome') || location.pathname.startsWith('/kingdomhome') || location.pathname.startsWith('/base') || location.pathname.startsWith('/newbase')) ? 'w-full max-w-none' : 'max-w-6xl'} mx-auto p-0 relative z-20`}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/betterhome" element={<BetterHome />} />
                <Route path="/kingdomhome" element={<KingdomHome />} />
                <Route path="/newhome" element={<NewHome />} />
                <Route path="/home-v3" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#c8b598] flex items-center justify-center text-[#3a271d] font-black uppercase">Loading Frontiers...</div>}>
                    <HomeV3 />
                  </React.Suspense>
                } />
                <Route path="/home-design" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1a120b] flex items-center justify-center text-[#f4d03f] font-black uppercase">Loading Village...</div>}>
                    <HomeDesign />
                  </React.Suspense>
                } />
                <Route path="/events-design" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1a120b] flex items-center justify-center text-[#f4d03f] font-black uppercase">Loading Quest Board...</div>}>
                    <EventsDesign />
                  </React.Suspense>
                } />
                <Route path="/members-design" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1a120b] flex items-center justify-center text-[#f4d03f] font-black uppercase">Loading Clan...</div>}>
                    <MembersDesign />
                  </React.Suspense>
                } />
                <Route path="/registration-design/:eventId" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1a120b] flex items-center justify-center text-[#f4d03f] font-black uppercase">Loading Quest Scroll...</div>}>
                    <RegistrationDesign />
                  </React.Suspense>
                } />
                <Route path="/privacy-policy" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1a120b] flex items-center justify-center text-[#f4d03f] font-black uppercase">Unrolling the scroll...</div>}>
                    <PrivacyPolicy />
                  </React.Suspense>
                } />
                <Route path="/login-design" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1a120b] flex items-center justify-center text-[#f4d03f] font-black uppercase">Opening the gates...</div>}>
                    <LoginDesign />
                  </React.Suspense>
                } />
                <Route path="/base" element={<BaseUI />} />
                <Route path="/newbase" element={<NewBase />} />
                <Route path="/about" element={<About />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/milestones" element={<Milestones />} />
                <Route path="/members" element={<Members />} />
                <Route path="/gallery" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-black flex items-center justify-center text-amber-500 font-cinzel">Loading Resonance...</div>}>
                    <Gallery />
                  </React.Suspense>
                } />
                <Route path="/newgallery" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1e231b] flex items-center justify-center text-[#a4f542] font-black font-sans uppercase">Loading Vault...</div>}>
                    <NewGallery />
                  </React.Suspense>
                } />
                <Route path="/newevents" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1e231b] flex items-center justify-center text-[#a4f542] font-black font-sans uppercase">Loading Board...</div>}>
                    <NewEvents />
                  </React.Suspense>
                } />
                <Route path="/registration/:eventId" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#0d1117] flex items-center justify-center text-amber-500 font-cinzel">Loading Quest Form...</div>}>
                    <Registration />
                  </React.Suspense>
                } />
                <Route path="/newprojects" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1e231b] flex items-center justify-center text-[#a4f542] font-black font-sans uppercase">Loading Vault...</div>}>
                    <NewProjects />
                  </React.Suspense>
                } />
                <Route path="/newmembers" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#1e231b] flex items-center justify-center text-[#a4f542] font-black font-sans uppercase">Loading Roster...</div>}>
                    <NewMembers />
                  </React.Suspense>
                } />
                <Route path="/admindashboard" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#0d1117] flex items-center justify-center text-red-500 font-cinzel font-bold text-xl uppercase">Loading Command Center...</div>}>
                    <AdminDashboard />
                  </React.Suspense>
                } />
                <Route path="/guestdashboard" element={
                  <React.Suspense fallback={<div className="h-screen w-full bg-[#0d1117] flex items-center justify-center text-slate-500 font-cinzel font-bold text-xl uppercase">Loading Welcome Room...</div>}>
                    <GuestDashboard />
                  </React.Suspense>
                } />
                <Route path="/profile/:name" element={<Profile />} />
                <Route path="/events" element={<Events />} />
                <Route path="/login" element={<Login />} />
                <Route path="/add-member" element={<AddMember />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/quiz/auth" element={<QuizAuth />} />
                <Route path="/quiz/dashboard" element={<QuizDashboard />} />
                <Route path="/quiz/take/:id" element={<QuizTake />} />
                <Route path="/quiz/live/:id" element={<LiveQuizParticipate />} />
                <Route path="/quiz/results/:attemptId" element={<QuizResults />} />
                <Route path="/quiz/leaderboard" element={<QuizLeaderboard />} />
                <Route path="/admin/quiz/host/:id" element={<LiveQuizHost />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </div>
          </main>
          {!hideNavAndFooter && <Footer />}
          <Analytics />
        </div>
      </QuizAuthProvider>
    </AuthProvider>
  )
}

function UnderConstructionModal() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05020a]">
      <div className="bg-slate-900/95 border border-cyan-400/30 rounded-lg max-w-md w-full p-8 mx-4 text-center">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <path d="M9 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-3xl font-cinzel font-bold gradient-text mb-3">
          Under Construction
        </h2>
        <p className="text-aura text-lg">
          This site is currently being built. Check back soon!
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App