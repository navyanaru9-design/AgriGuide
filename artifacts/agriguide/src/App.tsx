import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  useCreateAnalysis, useCreateFarm, useDeleteAnalysis, useDeleteFarm, useGetAiAdvice,
  useGetAnalysis, useGetCurrentUser, useGetDashboard, useGetFarm, useGetProfile,
  useGetWeather, useListAnalyses, useListCrops, useListFarms, useLoginUser,
  useRegisterUser, useUpdateFarm, useUpdateProfile, useLogoutUser, setAuthTokenGetter,
  getGetCurrentUserQueryKey, getGetDashboardQueryKey, getListFarmsQueryKey,
  getListAnalysesQueryKey, getGetProfileQueryKey, getGetFarmQueryKey,
  getGetAnalysisQueryKey, getGetWeatherQueryKey,
} from '@workspace/api-client-react';
import type { Analysis, Farm, FarmInput, FarmUpdate, Weather } from '@workspace/api-client-react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, BookOpen,
  Check, CheckCircle2, CloudSun, Droplets, Eye, EyeOff, FileText, Filter,
  Leaf, LoaderCircle, LogOut, MapPin, Menu, Plus, Search, ShieldAlert, Sprout,
  Trash2, Wind, X, Sparkles, Layers, Cpu, ShieldCheck, Compass, Info,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();
const TOKEN_KEY = 'agriguide_access_token';
setAuthTokenGetter(() => typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY));

const initialFarm: FarmInput = {
  farmName: '', country: 'India', state: '', district: '', village: '',
  latitude: null, longitude: null, soilType: 'Red Soil',
  waterAvailability: 'Moderate', irrigationSource: 'Rain-fed',
  previousCrop: '', season: 'Kharif',
};

const demoFarm: FarmInput = {
  farmName: 'Kadapa demo farm', country: 'India', state: 'Andhra Pradesh',
  district: 'Kadapa', village: 'Kadapa', latitude: 14.4673, longitude: 78.8242,
  soilType: 'Red Soil', waterAvailability: 'Moderate', irrigationSource: 'Borewell',
  previousCrop: 'Maize', season: 'Kharif',
};

const translations = {
  en: {
    home: 'Home', dashboard: 'Overview', analysis: 'Crop analysis', farms: 'My farms', history: 'History', profile: 'Profile', signIn: 'Sign in', getStarted: 'Get started', logout: 'Sign out',
    howItWorks: 'How it works', whatYouGet: 'What you get', heroBadge: 'Field-tested thinking for your next season', heroStart: 'Grow with a', heroEnd: 'clearer call.', heroDescription: 'Your soil, water, weather and last harvest all matter. Bring them together before you choose what goes in the ground.', heroPrimary: 'Start a crop analysis', heroSecondary: 'See how it works',
    farmName: 'Farm name', country: 'Country', state: 'State', district: 'District', village: 'Village', soilType: 'Soil type', waterAvailability: 'Water availability', irrigationSource: 'Irrigation source', previousCrop: 'Previous crop', season: 'Season', latitude: 'Latitude (optional)', longitude: 'Longitude (optional)', none: 'None',
    fullName: 'Full name', email: 'Email address', password: 'Password', confirmPassword: 'Confirm password', loginTitle: 'Sign in', registerTitle: 'Create your account', loginSubmit: 'Sign in to AgriGuide', registerSubmit: 'Create account',
    dashboardTitle: 'Good day', dashboardSubtitle: 'A clear view of your crop decisions and the fields behind them.', newAnalysis: 'New analysis', tryDemo: 'Try Demo Farm',
    analysisTitle: 'Let’s read your field.', analysisSubtitle: 'A few practical details help us compare crop fit. Your information is used for this analysis.', stepLand: 'Your land', stepWater: 'Water & season', stepLocation: 'Location', stepReview: 'Review', continue: 'Continue', back: 'Back', calculate: 'Calculate recommendation',
    addFarm: 'Add a farm', farmsTitle: 'Farm profiles.', historyTitle: 'History, season by season.', historySubtitle: 'Search, sort and revisit the crop comparisons you have saved.', searchHistory: 'Search crop or location',
    allCrops: 'All crops', allSoils: 'All soil types', allWater: 'All water levels', allSeasons: 'All seasons', newest: 'Newest first', oldest: 'Oldest first', highest: 'Highest fit', lowest: 'Lowest fit', profileTitle: 'Profile & access.',
  },
  te: {
    home: 'హోమ్', dashboard: 'సారాంశం', analysis: 'పంట విశ్లేషణ', farms: 'నా పొలాలు', history: 'చరిత్ర', profile: 'ప్రొఫైల్', signIn: 'ప్రవేశించండి', getStarted: 'ప్రారంభించండి', logout: 'సైన్ అవుట్',
    howItWorks: 'ఇది ఎలా పనిచేస్తుంది', whatYouGet: 'మీకు లభించేది', heroBadge: 'మీ తదుపరి సీజన్ కోసం పొలంలో పరీక్షించిన ఆలోచనలు', heroStart: 'మరింత స్పష్టంగా', heroEnd: 'పంటను ఎంచుకోండి.', heroDescription: 'మీ నేల, నీరు, వాతావరణం, గత పంట—అన్నీ ముఖ్యం. సాగు నిర్ణయం తీసుకునే ముందు వీటిని కలిసి చూడండి.', heroPrimary: 'పంట విశ్లేషణ ప్రారంభించండి', heroSecondary: 'ఇది ఎలా పనిచేస్తుందో చూడండి',
    farmName: 'పొలం పేరు', country: 'దేశం', state: 'రాష్ట్రం', district: 'జిల్లా', village: 'గ్రామం', soilType: 'నేల రకం', waterAvailability: 'నీటి లభ్యత', irrigationSource: 'నీటిపారుదల వనరు', previousCrop: 'గత పంట', season: 'సీజన్', latitude: 'అక్షాంశం (ఐచ్ఛికం)', longitude: 'రేఖాంశం (ఐచ్ఛికం)', none: 'ఏదీ లేదు',
    fullName: 'పూర్తి పేరు', email: 'ఈమెయిల్ చిరునామా', password: 'పాస్‌వర్డ్', confirmPassword: 'పాస్‌వర్డ్ నిర్ధారించండి', loginTitle: 'ప్రవేశించండి', registerTitle: 'మీ ఖాతా సృష్టించండి', loginSubmit: 'AgriGuideలో ప్రవేశించండి', registerSubmit: 'ఖాతా సృష్టించండి',
    dashboardTitle: 'నమస్కారం', dashboardSubtitle: 'మీ పంట నిర్ణయాలు మరియు పొలాల సంక్షిప్త సమాచారం.', newAnalysis: 'కొత్త విశ్లేషణ', tryDemo: 'డెమో పొలం ప్రయత్నించండి',
    analysisTitle: 'మీ పొలాన్ని పరిశీలిద్దాం.', analysisSubtitle: 'పంట అనుకూలతను పోల్చడానికి కొన్ని వివరాలు అవసరం. ఈ విశ్లేషణ కోసం మాత్రమే మీ సమాచారం ఉపయోగించబడుతుంది.', stepLand: 'మీ పొలం', stepWater: 'నీరు & సీజన్', stepLocation: 'ప్రాంతం', stepReview: 'సమీక్ష', continue: 'కొనసాగించండి', back: 'వెనక్కి', calculate: 'సిఫార్సు లెక్కించండి',
    addFarm: 'పొలం జోడించండి', farmsTitle: 'పొలం వివరాలు.', historyTitle: 'సీజన్ వారీ చరిత్ర.', historySubtitle: 'మీరు సేవ్ చేసిన పంట పోలికలను వెతికి, క్రమబద్ధీకరించి, మళ్లీ చూడండి.', searchHistory: 'పంట లేదా ప్రాంతం వెతకండి',
    allCrops: 'అన్ని పంటలు', allSoils: 'అన్ని నేల రకాలు', allWater: 'అన్ని నీటి స్థాయిలు', allSeasons: 'అన్ని సీజన్లు', newest: 'కొత్తవి ముందుగా', oldest: 'పాతవి ముందుగా', highest: 'అత్యధిక సరిపోలిక', lowest: 'అత్యల్ప సరిపోలిక', profileTitle: 'ప్రొఫైల్ & యాక్సెస్.',
  },
  hi: {
    home: 'होम', dashboard: 'अवलोकन', analysis: 'फसल विश्लेषण', farms: 'मेरे खेत', history: 'इतिहास', profile: 'प्रोफ़ाइल', signIn: 'साइन इन', getStarted: 'शुरू करें', logout: 'साइन आउट',
    howItWorks: 'यह कैसे काम करता है', whatYouGet: 'आपको क्या मिलेगा', heroBadge: 'अगले मौसम के लिए खेत परखी सलाह', heroStart: 'बेहतर सोचें,', heroEnd: 'बेहतर उगाएँ।', heroDescription: 'मिट्टी, पानी, मौसम और पिछली फसल—सभी मायने रखते हैं। अगली बुवाई का निर्णय लेने से पहले इन्हें साथ देखें।', heroPrimary: 'फसल विश्लेषण शुरू करें', heroSecondary: 'जानें यह कैसे काम करता है',
    farmName: 'खेत का नाम', country: 'देश', state: 'राज्य', district: 'ज़िला', village: 'गाँव', soilType: 'मिट्टी का प्रकार', waterAvailability: 'पानी की उपलब्धता', irrigationSource: 'सिंचाई का स्रोत', previousCrop: 'पिछली फसल', season: 'मौसम', latitude: 'अक्षांश (वैकल्पिक)', longitude: 'देशांतर (वैकल्पिक)', none: 'कोई नहीं',
    fullName: 'पूरा नाम', email: 'ईमेल पता', password: 'पासवर्ड', confirmPassword: 'पासवर्ड की पुष्टि करें', loginTitle: 'साइन इन', registerTitle: 'अपना खाता बनाएँ', loginSubmit: 'AgriGuide में साइन इन करें', registerSubmit: 'खाता बनाएँ',
    dashboardTitle: 'नमस्कार', dashboardSubtitle: 'आपके फसल निर्णयों और खेतों की एक साफ़ झलक।', newAnalysis: 'नया विश्लेषण', tryDemo: 'डेमो खेत आज़माएँ',
    analysisTitle: 'आपके खेत को समझें।', analysisSubtitle: 'फसल की उपयुक्तता की तुलना के लिए कुछ उपयोगी विवरण दें। आपकी जानकारी इसी विश्लेषण के लिए इस्तेमाल होगी।', stepLand: 'आपका खेत', stepWater: 'पानी और मौसम', stepLocation: 'स्थान', stepReview: 'समीक्षा', continue: 'आगे बढ़ें', back: 'वापस', calculate: 'सिफ़ारिश की गणना करें',
    addFarm: 'खेत जोड़ें', farmsTitle: 'खेत प्रोफ़ाइल.', historyTitle: 'मौसम के अनुसार इतिहास.', historySubtitle: 'सहेजी गई फसल तुलनाएँ खोजें, क्रमबद्ध करें और फिर देखें।', searchHistory: 'फसल या स्थान खोजें',
    allCrops: 'सभी फसलें', allSoils: 'सभी मिट्टी प्रकार', allWater: 'सभी जल स्तर', allSeasons: 'सभी मौसम', newest: 'नए पहले', oldest: 'पुराने पहले', highest: 'सबसे अच्छी उपयुक्तता', lowest: 'सबसे कम उपयुक्तता', profileTitle: 'प्रोफ़ाइल और पहुँच.',
  },
} as const;

type Lang = keyof typeof translations;
const LanguageContext = createContext<Lang>('en');

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}


function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  queryClient.clear();
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Router() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('agriguide_language') as Lang) || 'en');
  const labels = translations[lang];
  const chooseLanguage = (value: Lang) => { setLang(value); localStorage.setItem('agriguide_language', value); };
  const [location, setLocation] = useLocation();
  const current = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), retry: false, enabled: !!localStorage.getItem(TOKEN_KEY) } });
  const logout = useLogoutUser();
  const [mobileMenu, setMobileMenu] = useState(false);
  const protectedPath = ['/dashboard', '/analysis', '/farms', '/history', '/profile'].some((path) => location.startsWith(path));
  const signedIn = !!current.data;

  // Supabase Auth listener to keep authentication state synchronized
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        signOut();
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        if (!localStorage.getItem(TOKEN_KEY)) {
          try {
            const res = await fetch('/api/auth/supabase-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
              }),
            });
            if (res.ok) {
              const syncData = await res.json();
              localStorage.setItem(TOKEN_KEY, syncData.token);
              queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
            }
          } catch {
            // Silently handled
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (protectedPath && (!localStorage.getItem(TOKEN_KEY) || current.isError)) {
      setLocation('/login');
    }
  }, [protectedPath, signedIn, current.isError, setLocation]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    logout.mutate(undefined, {
      onSettled: () => {
        signOut();
        setMobileMenu(false);
        setLocation('/login');
      },
    });
  };

  return (
    <LanguageContext.Provider value={lang}>
    <div className="grain min-h-[100dvh] bg-background text-foreground flex flex-col justify-between">
      {protectedPath && !signedIn ? <div className="min-h-[100dvh] grid place-items-center"><div className="h-10 w-10 animate-pulse rounded-full bg-accent" /></div> :
        <>
          <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
            <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 md:px-8">
              <Link href={signedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5" data-testid="link-brand">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sprout size={21} /></span>
                <span className="font-display text-[21px] font-extrabold tracking-[-.06em]">agri<span className="text-primary">guide</span></span>
              </Link>
              {signedIn ? <nav className="hidden items-center gap-1 md:flex">
                <NavLink href="/dashboard" label={labels.dashboard} active={location === '/dashboard'} testId="nav-dashboard" />
                <NavLink href="/analysis" label={labels.analysis} active={location.startsWith('/analysis')} testId="nav-analysis" />
                <NavLink href="/farms" label={labels.farms} active={location.startsWith('/farms')} testId="nav-farms" />
                <NavLink href="/history" label={labels.history} active={location.startsWith('/history')} testId="nav-history" />
              </nav> : <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
                <Link href="/how-it-works" className={`hover:text-foreground transition ${location === '/how-it-works' ? 'text-primary font-bold' : ''}`} data-testid="link-how-it-works">{labels.howItWorks}</Link>
                <a href="#what-you-get" className="hover:text-foreground" data-testid="link-advisory">{labels.whatYouGet}</a>
              </nav>}
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="language-select">Language</label>
                <select id="language-select" value={lang} onChange={(event) => chooseLanguage(event.target.value as Lang)} className="h-9 cursor-pointer rounded-full border border-border bg-card px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring" data-testid="select-language">
                  <option value="en">EN</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option>
                </select>
                {signedIn ? <>
                  <Link href="/profile" className="hidden h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground sm:flex" data-testid="link-profile-avatar">{current.data?.fullName?.slice(0, 1).toUpperCase()}</Link>
                  <button className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary md:flex" onClick={handleSignOut} disabled={logout.isPending} data-testid="button-sign-out"><LogOut size={15} />{labels.logout}</button>
                </> : <><Link href="/login" className="hidden px-4 py-2 text-sm font-bold text-foreground md:inline-flex" data-testid="link-sign-in">{labels.signIn}</Link><Link href="/register" className="hidden rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 md:inline-flex" data-testid="link-get-started">{labels.getStarted}<ArrowRight size={15} className="ml-2" /></Link></>}
                <button className="rounded-lg p-2 md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation" data-testid="button-mobile-menu">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
              </div>
            </div>
            {mobileMenu && <div className="border-t border-border bg-card px-5 py-3 md:hidden">
              {signedIn ? <div className="grid gap-1">
                <MobileNav href="/dashboard" label={labels.dashboard} testId="mobile-dashboard" close={() => setMobileMenu(false)} />
                <MobileNav href="/analysis" label={labels.analysis} testId="mobile-analysis" close={() => setMobileMenu(false)} />
                <MobileNav href="/farms" label={labels.farms} testId="mobile-farms" close={() => setMobileMenu(false)} />
                <MobileNav href="/history" label={labels.history} testId="mobile-history" close={() => setMobileMenu(false)} />
                <MobileNav href="/profile" label={labels.profile} testId="mobile-profile" close={() => setMobileMenu(false)} />
                <button onClick={handleSignOut} disabled={logout.isPending} className="rounded-lg px-3 py-3 text-left font-semibold text-destructive hover:bg-secondary" data-testid="mobile-sign-out">{labels.logout}</button>
              </div> : <div className="flex flex-col gap-2 py-2">
                <Link href="/how-it-works" onClick={() => setMobileMenu(false)} className="px-3 py-2 font-semibold text-foreground hover:bg-secondary rounded-lg" data-testid="mobile-how-it-works">{labels.howItWorks}</Link>
                <div className="flex gap-4 px-3 pt-2">
                  <Link href="/login" onClick={() => setMobileMenu(false)} data-testid="mobile-login" className="font-semibold text-foreground">{labels.signIn}</Link>
                  <Link href="/register" onClick={() => setMobileMenu(false)} data-testid="mobile-register" className="font-bold text-primary">{labels.getStarted}</Link>
                </div>
              </div>}
            </div>}
          </header>
          <main className="flex-1">
            <ErrorBoundary resetKey={location}>
              <Switch>
                <Route path="/">
                  <Landing signedIn={signedIn} />
                </Route>
                <Route path="/how-it-works">
                  <HowItWorksPage signedIn={signedIn} />
                </Route>
                <Route path="/auth/callback" component={AuthCallbackPage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/demo" component={DemoPage} />
                <Route path="/dashboard" component={DashboardPage} />
                <Route path="/analysis">
                  <AnalysisPage lang={lang} />
                </Route>
                <Route path="/analysis/:id">
                  <AnalysisDetail />
                </Route>
                <Route path="/farms" component={FarmsPage} />
                <Route path="/history" component={HistoryPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/status" component={SystemStatusPage} />
                <Route component={NotFound} />
              </Switch>
            </ErrorBoundary>
          </main>
          {!signedIn && <footer className="border-t border-border bg-[#eae9dc]">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
              <div className="flex items-center gap-2 font-bold text-foreground"><Sprout size={16} /> agriguide <span className="font-normal text-muted-foreground">— clearer choices, season by season.</span></div>
              <div className="flex items-center gap-4">
                <p data-testid="text-responsible-ai">AI guidance supports your judgement; it does not replace local agronomists, soil tests, or official advisories.</p>
                <Link href="/status" className="hover:text-foreground shrink-0 text-[11px] underline opacity-70" data-testid="link-system-status">System status</Link>
              </div>
            </div>
          </footer>}
        </>}
    </div>
    </LanguageContext.Provider>
  );
}

function NavLink({ href, label, active, testId }: { href: string; label: string; active: boolean; testId: string }) {
  return <Link href={href} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`} data-testid={testId}>{label}</Link>;
}

function MobileNav({ href, label, close, testId }: { href: string; label: string; close: () => void; testId: string }) {
  return <Link href={href} onClick={close} className="rounded-lg px-3 py-3 font-semibold hover:bg-secondary" data-testid={testId}>{label}</Link>;
}

function PageWrap({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1160px] px-5 py-8 md:px-8 md:py-12 ${className}`}>{children}</div>;
}

function PageTitle({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-primary">{eyebrow}</div>}<h1 className="font-display text-3xl font-extrabold tracking-[-.05em] md:text-[40px]" data-testid="text-page-title">{title}</h1>{sub && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{sub}</p>}</div>{action}</div>;
}

function Button({ children, onClick, href, variant = 'primary', disabled, testId, type = 'button' }: { children: ReactNode; onClick?: () => void; href?: string; variant?: 'primary' | 'outline' | 'quiet' | 'danger'; disabled?: boolean; testId: string; type?: 'button' | 'submit' }) {
  const cls = `inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition duration-200 ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg' : variant === 'outline' ? 'border border-border bg-card text-foreground hover:bg-secondary' : variant === 'danger' ? 'bg-destructive text-destructive-foreground hover:opacity-90' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} data-testid={testId}>{children}</button>;
}

function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="my-4 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive" role="alert" data-testid="status-error"><ShieldAlert size={18} className="mt-0.5 shrink-0" /><div className="flex-1"><p className="font-bold">We couldn’t complete that request</p><p className="mt-1 break-words opacity-90">{message}</p>{retry && <button onClick={retry} className="mt-2 underline underline-offset-2" data-testid="button-retry">Try again</button>}</div></div>;
}

function LoadingRows({ label = 'Loading your farm information…' }: { label?: string }) {
  return <div className="space-y-3 py-2" aria-label={label} data-testid="status-loading"><div className="h-24 animate-pulse rounded-2xl bg-secondary/75" /><div className="h-16 animate-pulse rounded-2xl bg-secondary/55" /></div>;
}

function EmptyState({ icon: Icon = Sprout, title, detail, action }: { icon?: typeof Sprout; title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-5 text-center" data-testid="state-empty"><span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/45 text-primary"><Icon size={25} /></span><h3 className="font-display text-xl font-extrabold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

const fieldTranslationKeys = {
  'Farm name': 'farmName', Country: 'country', State: 'state', District: 'district', Village: 'village',
  'Soil type': 'soilType', 'Water availability': 'waterAvailability', 'Irrigation source': 'irrigationSource',
  'Previous crop': 'previousCrop', Season: 'season', 'Latitude (optional)': 'latitude',
  'Longitude (optional)': 'longitude', 'Full name': 'fullName', Email: 'email', 'Email address': 'email',
  Password: 'password', 'Confirm password': 'confirmPassword',
} as const;

function Field({ label, name, value, onChange, type = 'text', placeholder, required = false, testId, options, min, max, step }: {
  label: string; name: string; value: string | number | null | undefined; onChange: (value: string) => void;
  type?: string; placeholder?: string; required?: boolean; testId?: string; options?: string[]; min?: string; max?: string; step?: string;
}) {
  const labels = translations[useContext(LanguageContext)];
  const translationKey = fieldTranslationKeys[label as keyof typeof fieldTranslationKeys];
  const localizedLabel = translationKey ? labels[translationKey] : label;
  const cls = 'mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';
  return <label className="block text-sm font-semibold text-foreground">{localizedLabel}{required && <span className="ml-1 text-destructive">*</span>}
    {options ? <select name={name} value={value ?? ''} required={required} onChange={(e) => onChange(e.target.value)} className={cls} data-testid={testId || `input-${name}`}><option value="" disabled>Select {localizedLabel.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> :
      <input name={name} type={type} value={value ?? ''} required={required} placeholder={placeholder} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value)} className={cls} data-testid={testId || `input-${name}`} />}
  </label>;
}

function FieldGrid({ value, onChange, previousCropOptions = [] }: { value: FarmInput; onChange: (name: keyof FarmInput, next: string) => void; previousCropOptions?: string[] }) {
  const labels = translations[useContext(LanguageContext)];
  const cropOptions = Array.from(new Set([labels.none, ...previousCropOptions, ...(value.previousCrop ? [value.previousCrop] : [])]));
  return <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
    <Field label="Farm name" name="farmName" value={value.farmName} onChange={(v) => onChange('farmName', v)} placeholder="e.g. East field" testId="input-farm-name" />
    <Field label="Country" name="country" value={value.country} onChange={(v) => onChange('country', v)} required testId="input-country" />
    <Field label="State" name="state" value={value.state} onChange={(v) => onChange('state', v)} placeholder="Andhra Pradesh" testId="input-state" />
    <Field label="District" name="district" value={value.district} onChange={(v) => onChange('district', v)} placeholder="District" testId="input-district" />
    <Field label="Village" name="village" value={value.village} onChange={(v) => onChange('village', v)} placeholder="Village or mandal" testId="input-village" />
    <Field label="Soil type" name="soilType" value={value.soilType} onChange={(v) => onChange('soilType', v)} options={['Black Soil','Red Soil','Alluvial Soil','Sandy Soil','Loamy Soil','Clay Soil','Laterite Soil']} required testId="input-soil-type" />
    <Field label="Water availability" name="waterAvailability" value={value.waterAvailability} onChange={(v) => onChange('waterAvailability', v)} options={['Very Low','Low','Moderate','High','Very High']} required testId="input-water" />
    <Field label="Irrigation source" name="irrigationSource" value={value.irrigationSource} onChange={(v) => onChange('irrigationSource', v)} options={['Rain-fed','Borewell','Canal','Well','River','Drip','Sprinkler']} required testId="input-irrigation" />
    <Field label="Previous crop" name="previousCrop" value={value.previousCrop} onChange={(v) => onChange('previousCrop', v)} options={cropOptions} required testId="input-previous-crop" />
    <Field label="Season" name="season" value={value.season} onChange={(v) => onChange('season', v)} options={['Kharif','Rabi','Summer']} required testId="input-season" />
    <Field label="Latitude (optional)" name="latitude" value={value.latitude} onChange={(v) => onChange('latitude', v)} type="number" min="-90" max="90" step="any" placeholder="17.3850" testId="input-latitude" />
    <Field label="Longitude (optional)" name="longitude" value={value.longitude} onChange={(v) => onChange('longitude', v)} type="number" min="-180" max="180" step="any" placeholder="78.4867" testId="input-longitude" />
  </div>;
}

function adaptFarm(farm: Farm): FarmInput {
  return { farmName: farm.farmName, country: farm.country, state: farm.state, district: farm.district, village: farm.village, latitude: farm.latitude, longitude: farm.longitude, soilType: farm.soilType, waterAvailability: farm.waterAvailability, irrigationSource: farm.irrigationSource, previousCrop: farm.previousCrop, season: farm.season };
}

function farmPayload(value: FarmInput): FarmInput {
  return { ...value, farmName: value.farmName?.trim() || undefined, latitude: value.latitude === null || value.latitude === undefined ? null : Number(value.latitude), longitude: value.longitude === null || value.longitude === undefined ? null : Number(value.longitude) };
}

function Landing({ signedIn }: { signedIn: boolean }) {
  const labels = translations[useContext(LanguageContext)];
  return <div className="overflow-hidden">
    <section className="relative mx-auto grid max-w-[1320px] gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.02fr_.98fr] md:items-center md:px-8 md:pb-24 md:pt-20">
      <div className="enter relative z-10"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary"><span className="h-2 w-2 rounded-full bg-[#bd8b3d]" /> {labels.heroBadge}</div>
        <h1 className="max-w-[680px] font-display text-[clamp(3.2rem,7.5vw,6.3rem)] font-extrabold leading-[.96] tracking-[-.075em]">{labels.heroStart}<br /><span className="relative inline-block text-primary">{labels.heroEnd}<span className="absolute -bottom-1 left-0 h-[7px] w-[86%] -rotate-2 rounded-full bg-accent/80" /></span></h1>
        <p className="mt-7 max-w-[480px] text-base leading-7 text-muted-foreground md:text-lg">{labels.heroDescription}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button href={signedIn ? '/analysis' : '/register'} testId="button-start-analysis">{labels.heroPrimary} <ArrowRight className="ml-2" size={17} /></Button><Button href="/how-it-works" variant="outline" testId="button-see-how">{labels.heroSecondary} <ArrowRight className="ml-2" size={16} /></Button></div>
        <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex -space-x-2">{['R','S','M'].map((letter, i) => <span key={letter} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-background text-[10px] font-extrabold ${i === 0 ? 'bg-[#d6c59c]' : i === 1 ? 'bg-[#b4c4a3]' : 'bg-[#d5ab83]'}`}>{letter}</span>)}</span><span>Made for decisions on real farms,<br className="sm:hidden" /> not in a spreadsheet.</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-[620px] enter [animation-delay:120ms]">
        <div className="absolute -right-9 -top-8 h-52 w-52 rounded-full border border-primary/15" /><div className="absolute -bottom-8 -left-5 h-32 w-32 rounded-full bg-accent/35 blur-2xl" />
        <div className="relative overflow-hidden rounded-[34px] bg-[#1e4539] p-5 shadow-[0_28px_65px_-28px_rgba(20,55,43,.45)] md:p-7">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse at 78% 25%, #b6c487 0, transparent 40%), repeating-linear-gradient(145deg, transparent 0 30px, rgba(224,211,157,.27) 31px 33px)' }} />
          <div className="relative flex items-start justify-between text-[#f1ecd9]"><div><span className="text-[10px] font-bold uppercase tracking-[.17em] opacity-65">Your land, in context</span><h2 className="mt-1 font-display text-2xl font-extrabold">One thoughtful next step.</h2></div><span className="grid h-10 w-10 place-items-center rounded-full border border-white/20"><MapPin size={18} /></span></div>
          <div className="relative mt-8 rounded-2xl border border-white/15 bg-[#f3efdf] p-5 text-[#203b31] shadow-xl md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#687568]">Example recommendation</p><p className="mt-1 font-display text-3xl font-extrabold tracking-[-.05em]">Groundnut</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dce3c7] text-primary"><Leaf size={24} /></span></div>
            <div className="mt-5 flex items-center gap-4 border-t border-[#d8d8c9] pt-4"><div className="flex-1"><div className="flex justify-between text-xs font-bold"><span>Fit for this field</span><span>82 / 100</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#d9dece]"><div className="h-full w-[82%] rounded-full bg-[#537861]" /></div></div><span className="rounded-full bg-[#e8dba9] px-3 py-1.5 text-[10px] font-bold">Moderate risk</span></div>
            <p className="mt-4 text-xs leading-5 text-[#687568]">Example only. Your recommendation is calculated from the farm details you provide.</p>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2 text-[#f1ecd9]">{[['01','Soil'],['02','Weather'],['03','Rotation']].map(([n, text]) => <div key={n} className="rounded-xl border border-white/15 bg-white/[.07] p-3"><span className="text-[9px] font-bold tracking-[.12em] opacity-55">{n}</span><p className="mt-1 text-xs font-bold">{text}</p></div>)}</div>
        </div>
      </div>
    </section>
    <section id="how-it-works" className="border-y border-border bg-[#ebe9db]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-16 md:grid-cols-[.72fr_1.28fr] md:px-8 md:py-20"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-primary">From field facts to field plan</p><h2 className="mt-4 max-w-sm font-display text-4xl font-extrabold leading-[1.05] tracking-[-.06em] md:text-5xl">The details shape the decision.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">No one-size-fits-all answer. AgriGuide weighs several parts of your farm profile, then shows its reasoning.</p><div className="mt-6"><Button href="/how-it-works" variant="outline" testId="button-explore-full-workflow">Explore complete 7-step guide <ArrowRight size={15} className="ml-2"/></Button></div></div>
        <div className="grid gap-3 sm:grid-cols-3">{[['01','Start with your farm','Tell us about soil, water, location, season and the crop you grew last.'],['02','Compare suitable crops','Recommendations balance field conditions, weather and crop rotation.'],['03','Know what to do next','Read practical considerations, risks and water guidance before deciding.']].map(([n,title,body])=><article key={n} className="rounded-2xl border border-border bg-card p-5"><span className="font-mono text-xs font-bold text-[#a1783b]">{n} / 03</span><h3 className="mt-5 font-display text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div>
      </div>
    </section>
    <section id="what-you-get" className="mx-auto max-w-[1320px] px-5 py-16 md:px-8 md:py-24">
      <div className="grid gap-12 md:grid-cols-[1fr_.8fr] md:items-center"><div><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-primary">Useful, not overwhelming</p><h2 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-.06em] md:text-5xl">A recommendation should come with a reason.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Each crop match includes the factors behind its score, expected water needs, growth duration and known risks. If weather can’t be retrieved, we say so—rather than guessing.</p><div className="mt-7 flex flex-wrap gap-2">{['Soil fit','Season fit','Water needs','Weather context','Rotation impact'].map((tag)=><span key={tag} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-bold">{tag}</span>)}</div></div>
        <div className="relative rounded-[28px] bg-[#dfe4d2] p-7 md:p-9"><div className="absolute right-7 top-7 h-24 w-24 rounded-full border border-primary/15" /><div className="relative grid gap-4"><div className="flex items-start gap-3 rounded-2xl bg-card p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dce6d5] text-primary"><BadgeCheck size={18}/></span><div><p className="text-sm font-extrabold">See the factors</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Understand which inputs supported each crop.</p></div></div><div className="flex items-start gap-3 rounded-2xl bg-card p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f1e4c3] text-[#8a6632]"><CloudSun size={18}/></span><div><p className="text-sm font-extrabold">Weather, with a source</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Location-aware data or a clearly marked fallback.</p></div></div><div className="flex items-start gap-3 rounded-2xl bg-card p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e5d6c7] text-[#895d3d]"><BookOpen size={18}/></span><div><p className="text-sm font-extrabold">Your choices stay yours</p><p className="mt-1 text-xs leading-5 text-muted-foreground">AI advice is a starting point, not a guarantee.</p></div></div></div></div>
      </div>
    </section>
    <section className="mx-auto max-w-[1320px] px-5 pb-16 md:px-8 md:pb-24"><div className="overflow-hidden rounded-[30px] bg-[#274c3f] px-6 py-10 text-[#f4f0dc] md:flex md:items-center md:justify-between md:px-12 md:py-12"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#d8c68f]">Ready when you are</p><h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">Make the next season a more informed one.</h2></div><Button href={signedIn ? '/analysis' : '/register'} variant="outline" testId="button-bottom-start" >Start with your farm <ArrowUpRight size={16} className="ml-2" /></Button></div><p className="mt-5 max-w-4xl text-xs leading-5 text-muted-foreground" data-testid="text-ai-disclaimer">Responsible AI: recommendations depend on available inputs and data quality. They are informational guidance only, not a promise of yield or substitute for local agricultural expertise and official notices.</p></section>
  </div>;
}

function HowItWorksPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="overflow-hidden">
      {/* Hero Header */}
      <section className="relative mx-auto max-w-[1240px] px-5 pt-12 pb-10 md:px-8 md:pt-16 md:pb-14">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm">
          <Compass size={14} className="text-[#bd8b3d]" />
          <span>AgriGuide Decision Framework</span>
        </div>
        <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-.06em] sm:text-5xl md:text-6xl" data-testid="text-how-it-works-title">
          How AgriGuide Works
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg" data-testid="text-how-it-works-sub">
          From farm conditions to a smarter crop decision — in a few simple steps.
        </p>
      </section>

      {/* Visual Workflow Pipeline Diagram */}
      <section className="border-y border-border bg-[#ece9db] py-12 md:py-16">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-primary">Pipeline Architecture</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold md:text-3xl">Visual Decision Flow</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">Every farm analysis passes through strict deterministic calculation before optional AI advisory guidance.</p>
          </div>

          {/* Desktop flow grid & Mobile vertical pipeline */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { step: '01', title: 'Farm Details', icon: Sprout, desc: 'Capture baseline field specifications: Soil, Water, Irrigation, Crop History & Season.' },
              { step: '02', title: 'Soil + Location', icon: MapPin, desc: 'Agro-climatic regional mapping & soil texture evaluation.' },
              { step: '03', title: 'Weather + Water', icon: CloudSun, desc: 'Live Open-Meteo current & forecast weather verification with transparent fallbacks.' },
              { step: '04', title: 'Previous Crop + Season', icon: Layers, desc: 'Crop rotation compatibility & seasonal photoperiod alignment.' },
              { step: '05', title: 'Suitability Engine', icon: Cpu, desc: 'Deterministic 0–100 mathematical scoring across catalogued agronomic benchmarks.' },
              { step: '06', title: 'Top 3 Crops', icon: Leaf, desc: 'Clear ranked shortlist presenting highest fit percentages and growth durations.' },
              { step: '07', title: 'Risk Analysis', icon: ShieldCheck, desc: 'Factor-by-factor score breakdown: soil, climate, water & pest vulnerability.' },
              { step: '08', title: 'AI Farm Advisor', icon: Sparkles, desc: 'Gemini-powered advisory synthesizing action plans, sowing tips & water guidance.' },
              { step: '09', title: 'Saved Farm Decision', icon: BookOpen, desc: 'Persisted to Supabase PostgreSQL database for season-by-season tracking.' },
            ].map((node) => {
              const Icon = node.icon;
              return (
                <div key={node.step} className="group relative rounded-2xl border border-border bg-card p-5 transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#bd8b3d]">{node.step}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/40 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Icon size={18} />
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-extrabold">{node.title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7 Detailed Steps */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-24 space-y-16">
        
        {/* STEP 1 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[.9fr_1.1fr] md:items-center md:p-10 shadow-sm" data-testid="step-1">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 1 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Tell Us About Your Farm
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Every trustworthy decision starts with the actual field. The farmer provides 6 fundamental farm parameters that define the land:
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 text-xs font-bold text-foreground">
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 p-3"><MapPin size={16} className="text-primary shrink-0" /> Location</div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 p-3"><Sprout size={16} className="text-primary shrink-0" /> Soil Type</div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 p-3"><Droplets size={16} className="text-primary shrink-0" /> Water Availability</div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 p-3"><Wind size={16} className="text-primary shrink-0" /> Irrigation Source</div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 p-3"><Layers size={16} className="text-primary shrink-0" /> Previous Crop</div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 p-3"><CloudSun size={16} className="text-primary shrink-0" /> Season</div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-[#f6f4ea] p-6 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Field Input Card</span>
              <span className="rounded-full bg-[#dfebd5] px-2.5 py-0.5 text-[11px] font-bold text-[#34663e]">Ready for analysis</span>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60"><span className="text-muted-foreground">Location</span><span className="font-bold">Kadapa, Andhra Pradesh</span></div>
              <div className="flex justify-between py-1.5 border-b border-border/60"><span className="text-muted-foreground">Soil Profile</span><span className="font-bold">Red Soil (Loamy sand)</span></div>
              <div className="flex justify-between py-1.5 border-b border-border/60"><span className="text-muted-foreground">Water Supply</span><span className="font-bold">Moderate (Borewell)</span></div>
              <div className="flex justify-between py-1.5 border-b border-border/60"><span className="text-muted-foreground">Crop History</span><span className="font-bold">Maize (Cereal crop)</span></div>
              <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Target Season</span><span className="font-bold">Kharif Season</span></div>
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[1.1fr_.9fr] md:items-center md:p-10 shadow-sm" data-testid="step-2">
          <div className="order-2 md:order-1 rounded-2xl border border-border bg-[#254a3d] p-6 text-[#f3efd9]">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d8c68f]">Environmental Sensor & Weather Verification</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold">Open-Meteo Integration</h3>
            <p className="mt-2 text-xs leading-5 text-[#c8d4c5]">When coordinates or regional markers are provided, live atmospheric telemetry is checked before calculation.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] text-[#bac7b8]">Temperature</p><p className="mt-1 font-bold text-base">29.4°C</p></div>
              <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] text-[#bac7b8]">Rainfall Sum</p><p className="mt-1 font-bold text-base">42 mm / 7d</p></div>
              <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] text-[#bac7b8]">Humidity</p><p className="mt-1 font-bold text-base">64%</p></div>
              <div className="rounded-xl bg-white/10 p-3"><p className="text-[10px] text-[#bac7b8]">Wind Speed</p><p className="mt-1 font-bold text-base">14 km/h</p></div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 2 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Understand Your Farm Conditions
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              AgriGuide evaluates the provided farm information and obtains current weather information when available. If weather telemetry is unreachable, AgriGuide marks it transparently with a fallback rather than guessing or inventing numbers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Soil', 'Location', 'Weather', 'Water', 'Crop history', 'Season'].map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-bold">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[.9fr_1.1fr] md:items-center md:p-10 shadow-sm" data-testid="step-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 3 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Calculate Crop Suitability
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              AgriGuide uses a deterministic scoring engine to compare crops across agronomic criteria.
            </p>
            <div className="mt-5 rounded-xl border border-primary/20 bg-accent/20 p-4 text-xs leading-6 text-foreground font-medium">
              <strong className="text-primary font-bold">Deterministic Engine:</strong> "The recommendation score is calculated from multiple farm conditions rather than generated randomly."
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-[#f5f2e6] p-6">
            <h3 className="font-display text-lg font-extrabold text-[#234237]">Scoring Factor Weights</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-foreground"><span>Soil Compatibility</span><span>25%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full w-[25%]" /></div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-foreground"><span>Location Compatibility</span><span>20%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full w-[20%]" /></div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-foreground"><span>Weather Compatibility</span><span>20%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full w-[20%]" /></div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-foreground"><span>Water Compatibility</span><span>15%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full w-[15%]" /></div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-foreground"><span>Previous Crop (Rotation)</span><span>10%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full w-[10%]" /></div>
              </div>
              <div>
                <div className="flex justify-between font-bold text-foreground"><span>Season Compatibility</span><span>10%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full bg-primary rounded-full w-[10%]" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[1.1fr_.9fr] md:items-center md:p-10 shadow-sm" data-testid="step-4">
          <div className="order-2 md:order-1 space-y-3">
            <div className="rounded-2xl border border-primary/20 bg-[#254a3d] p-5 text-[#f3efd9]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#d8c68f]">#1 Ranked Crop</span>
                <span className="rounded-full bg-[#d8c68f] px-2.5 py-0.5 text-xs font-extrabold text-[#254a3d]">92% Suitable</span>
              </div>
              <h4 className="mt-2 font-display text-2xl font-extrabold">Groundnut</h4>
              <p className="mt-1 text-xs text-[#c6d2c4]">Optimal soil match for Red Soil and breaks pest cycle after Maize.</p>
            </div>

            <div className="rounded-2xl border border-border bg-[#ebe8dc] p-4 text-foreground">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-muted-foreground">#2 Ranked Crop</span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-extrabold">87% Suitable</span>
              </div>
              <h4 className="mt-1.5 font-display text-xl font-extrabold">Maize</h4>
              <p className="mt-1 text-xs text-muted-foreground">Good moisture fit with moderate fertilizer requirement.</p>
            </div>

            <div className="rounded-2xl border border-border bg-[#ebe8dc] p-4 text-foreground">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-muted-foreground">#3 Ranked Crop</span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-extrabold">81% Suitable</span>
              </div>
              <h4 className="mt-1.5 font-display text-xl font-extrabold">Cotton</h4>
              <p className="mt-1 text-xs text-muted-foreground">Requires consistent irrigation and pest scouting.</p>
            </div>
            <p className="text-[11px] text-muted-foreground italic">*Visual example only. Scores are dynamically computed for your real farm.</p>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 4 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Rank the Best Crops
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              AgriGuide calculates suitability scores across all catalogue crops and presents the top 3 choices with expected water requirements, maturity timelines, and risk assessments.
            </p>
            <div className="mt-6 space-y-2 text-xs font-medium text-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary shrink-0" /> #1 Best Match with highest agronomic compatibility</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary shrink-0" /> #2 Viable Alternative with alternative rotation profile</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary shrink-0" /> #3 Shortlist Backup for market flexibility</div>
            </div>
          </div>
        </div>

        {/* STEP 5 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[.9fr_1.1fr] md:items-center md:p-10 shadow-sm" data-testid="step-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 5 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Understand Why
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A recommendation without reasons cannot be verified. AgriGuide exposes the granular factor score breakdown so you know exactly which farm conditions drove the score.
            </p>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              No black-box opacity: you can immediately see if soil compatibility or rotation benefits elevated a specific crop.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-[#f5f2e6] p-6">
            <h3 className="font-display text-base font-extrabold text-[#234237]">Detailed Factor Breakdown</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-card p-3 border border-border">
                <p className="font-bold text-muted-foreground">Soil Compatibility</p>
                <div className="mt-1 flex items-baseline justify-between"><strong className="text-lg">95/100</strong><span className="text-primary font-bold text-[10px]">High fit</span></div>
              </div>
              <div className="rounded-xl bg-card p-3 border border-border">
                <p className="font-bold text-muted-foreground">Location Match</p>
                <div className="mt-1 flex items-baseline justify-between"><strong className="text-lg">90/100</strong><span className="text-primary font-bold text-[10px]">High fit</span></div>
              </div>
              <div className="rounded-xl bg-card p-3 border border-border">
                <p className="font-bold text-muted-foreground">Weather Compatibility</p>
                <div className="mt-1 flex items-baseline justify-between"><strong className="text-lg">88/100</strong><span className="text-primary font-bold text-[10px]">Moderate</span></div>
              </div>
              <div className="rounded-xl bg-card p-3 border border-border">
                <p className="font-bold text-muted-foreground">Water Compatibility</p>
                <div className="mt-1 flex items-baseline justify-between"><strong className="text-lg">85/100</strong><span className="text-primary font-bold text-[10px]">Moderate</span></div>
              </div>
              <div className="rounded-xl bg-card p-3 border border-border">
                <p className="font-bold text-muted-foreground">Crop Rotation</p>
                <div className="mt-1 flex items-baseline justify-between"><strong className="text-lg">92/100</strong><span className="text-primary font-bold text-[10px]">Legume boost</span></div>
              </div>
              <div className="rounded-xl bg-card p-3 border border-border">
                <p className="font-bold text-muted-foreground">Season Match</p>
                <div className="mt-1 flex items-baseline justify-between"><strong className="text-lg">95/100</strong><span className="text-primary font-bold text-[10px]">Kharif ideal</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 6 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[1.1fr_.9fr] md:items-center md:p-10 shadow-sm" data-testid="step-6">
          <div className="order-2 md:order-1 rounded-2xl border border-primary/20 bg-[#254a3d] p-6 text-[#f3efd9]">
            <div className="flex items-center gap-2 text-[#d8c68f]">
              <Sparkles size={18} />
              <span className="text-xs font-extrabold uppercase tracking-wider">AI Farm Advisor Output</span>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-5">
              <div className="rounded-xl bg-white/10 p-3">
                <strong className="text-[#d8c68f] block mb-1">Executive Summary</strong>
                Groundnut offers high yield stability in red loamy soil following maize with moderate borewell watering.
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <strong className="text-[#d8c68f] block mb-1">Action Plan & Sowing</strong>
                Treat seeds with Trichoderma viride; sow at 30x10 cm spacing; apply gypsum at peg formation stage.
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <strong className="text-[#d8c68f] block mb-1">Water & Risk Mitigation</strong>
                Avoid moisture stress during flowering and pod development; watch for leaf spot (tikka disease).
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 6 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Get AI-Powered Farm Advice
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              AgriGuide's AI Farm Advisor uses the calculated farm information, weather information, crop ranking and risk information to provide actionable guidance.
            </p>
            <div className="mt-5 rounded-2xl border border-border bg-secondary/60 p-4 text-xs leading-5">
              <p className="font-bold text-foreground mb-1 flex items-center gap-1.5"><ShieldAlert size={15} className="text-primary"/> Architectural Rule:</p>
              <p className="text-muted-foreground">Gemini must NOT determine crop ranking. The deterministic scoring engine ranks the crops; Gemini only provides advisory guidance and risk mitigation, called securely from the backend only.</p>
            </div>
          </div>
        </div>

        {/* STEP 7 */}
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-6 md:grid-cols-[.9fr_1.1fr] md:items-center md:p-10 shadow-sm" data-testid="step-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-3 py-1 text-xs font-extrabold text-primary">
              Step 7 of 7
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl">
              Save and Track Your Decisions
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Authenticated farmers can save their farm analyses and review them season after season through their personal AgriGuide dashboard.
            </p>
            <div className="mt-6 space-y-3 text-xs">
              <div className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
                <BarChart3 size={18} className="text-primary shrink-0 mt-0.5" />
                <div><strong className="block text-foreground">Dashboard Overview</strong> Instant view of completed analyses, recent decisions, and latest recommendations.</div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
                <Sprout size={18} className="text-primary shrink-0 mt-0.5" />
                <div><strong className="block text-foreground">Farm Profiles</strong> Save your farm details once and run instant multi-season crop assessments.</div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
                <FileText size={18} className="text-primary shrink-0 mt-0.5" />
                <div><strong className="block text-foreground">Analysis History</strong> Filter by soil, water, season, or crop; sort by date or suitability score.</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-[#ece9db] p-6">
            <h3 className="font-display text-base font-extrabold text-foreground">Season-by-Season History</h3>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border">
                <div><p className="font-bold">Groundnut</p><p className="text-[10px] text-muted-foreground">Kadapa demo farm · Kharif</p></div>
                <span className="font-extrabold text-primary bg-accent/40 rounded-full px-2.5 py-1">92 fit</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border">
                <div><p className="font-bold">Chickpea</p><p className="text-[10px] text-muted-foreground">East Field · Rabi</p></div>
                <span className="font-extrabold text-primary bg-accent/40 rounded-full px-2.5 py-1">89 fit</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border">
                <div><p className="font-bold">Sunflower</p><p className="text-[10px] text-muted-foreground">North Plot · Summer</p></div>
                <span className="font-extrabold text-primary bg-accent/40 rounded-full px-2.5 py-1">84 fit</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* CTA at Bottom */}
      <section className="mx-auto max-w-[1240px] px-5 pb-16 md:px-8 md:pb-24">
        <div className="overflow-hidden rounded-[32px] bg-[#22483b] p-8 text-[#f4f0dc] text-center md:p-14">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#d8c68f]">Start Your Decision</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-[-.05em] sm:text-4xl md:text-5xl">
            Ready to make your next crop decision smarter?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#c7d2c3]">
            Input your soil, water and season details to get deterministic recommendations and tailored AI guidance.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              href={signedIn ? '/analysis' : '/register'}
              variant="outline"
              testId="button-how-it-works-start"
            >
              Start Farm Analysis <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function handleCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          // Wait for onAuthStateChange once if session is not yet loaded from URL hash
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
            if (s?.user) {
              subscription.unsubscribe();
              await syncAndRedirect(s.user);
            }
          });

          setTimeout(() => {
            if (isMounted && processing) {
              subscription.unsubscribe();
              setError('Authentication session could not be retrieved. Please try signing in again.');
              setProcessing(false);
            }
          }, 6000);
          return;
        }

        await syncAndRedirect(session.user);
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Authentication failed. Please try again.');
          setProcessing(false);
        }
      }
    }

    async function syncAndRedirect(user: any) {
      try {
        const res = await fetch('/api/auth/supabase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          }),
        });
        const syncData = await res.json();
        if (!res.ok) throw new Error(syncData.error || 'Failed to sync authentication session.');
        localStorage.setItem(TOKEN_KEY, syncData.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        if (isMounted) {
          setLocation('/dashboard');
        }
      } catch (syncErr: any) {
        if (isMounted) {
          setError(syncErr?.message || 'Failed to complete session setup.');
          setProcessing(false);
        }
      }
    }

    handleCallback();
    return () => { isMounted = false; };
  }, [setLocation]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-68px)] max-w-[500px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="w-full rounded-[28px] border border-border bg-card p-8 shadow-sm">
        {processing ? (
          <div className="space-y-4" data-testid="auth-callback-loading">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <LoaderCircle size={28} className="animate-spin" />
            </div>
            <h2 className="font-display text-2xl font-extrabold">Completing Google Sign In</h2>
            <p className="text-sm text-muted-foreground">Setting up your secure AgriGuide session...</p>
          </div>
        ) : error ? (
          <div className="space-y-4" data-testid="auth-callback-error">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert size={28} />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-destructive">Authentication Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="pt-2">
              <Button href="/login" testId="button-return-login">Return to Sign In</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AuthPanel({ mode }: { mode: 'login' | 'register' }) {
  const labels = translations[useContext(LanguageContext)];
  const [, setLocation] = useLocation();
  const navigateTo = setLocation;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const login = useLoginUser();
  const register = useRegisterUser();
  const pending = login.isPending || register.isPending || googleLoading;

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setGoogleLoading(false);
      setError(err?.message || 'Unable to connect to Google authentication. Please try again.');
    }
  };


  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (mode === 'register' && fields.password !== fields.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    const onSuccess = (result: { token: string }) => {
      localStorage.setItem(TOKEN_KEY, result.token);
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      setLocation('/dashboard');
    };
    const onError = (failure: unknown) => setError(failure instanceof Error ? failure.message : 'Please check your details and try again.');
    if (mode === 'login') {
      login.mutate({ data: { email: String(fields.email), password: String(fields.password) } }, { onSuccess, onError });
    } else {
      register.mutate({ data: { fullName: String(fields.fullName), email: String(fields.email), password: String(fields.password) } }, { onSuccess, onError });
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-68px)] max-w-[1160px] items-center gap-10 px-5 py-10 md:grid-cols-[1fr_.9fr] md:px-8">
      <div className="hidden rounded-[32px] bg-[#264b3e] p-10 text-[#f2edda] md:block">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d7c181] text-[#294b3e]">
          <Sprout size={25} />
        </div>
        <p className="mt-12 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#dac993]">A companion for your field</p>
        <h2 className="mt-4 max-w-md font-display text-5xl font-extrabold leading-[1.02] tracking-[-.06em]">
          {mode === 'login' ? 'Welcome back to your farm.' : 'Start with the land you know.'}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-6 text-[#c7d0c1]">Keep farm profiles and crop decisions together, season after season.</p>
        <div className="mt-14 grid grid-cols-3 gap-2">
          {['Soil', 'Water', 'Season'].map((item) => (
            <span key={item} className="rounded-xl border border-white/15 bg-white/[.06] px-3 py-3 text-xs font-bold">{item}</span>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[460px]">
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary">
          {mode === 'login' ? 'Your farm notebook' : 'A few details to begin'}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em]">
          {mode === 'login' ? labels.loginTitle : labels.registerTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'login' ? 'Pick up where your last season left off.' : 'Your recommendations begin with your farm.'}
        </p>

        {error && <ErrorNotice message={error} />}



        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'register' && (
            <label className="block text-sm font-semibold">
              {labels.fullName}
              <input
                name="fullName"
                type="text"
                required
                minLength={2}
                placeholder="Your name"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                data-testid="input-full-name"
              />
            </label>
          )}
          <label className="block text-sm font-semibold">
            {labels.email}
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              data-testid="input-email"
            />
          </label>
          <label className="block text-sm font-semibold">
            {labels.password}
            <div className="relative mt-1.5">
              <input
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                data-testid="input-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                onClick={() => setPasswordVisible(!passwordVisible)}
                aria-label="Toggle password visibility"
                data-testid="button-toggle-password"
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {mode === 'register' && (
            <label className="block text-sm font-semibold">
              {labels.confirmPassword}
              <input
                name="confirmPassword"
                type={passwordVisible ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Enter your password again"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                data-testid="input-confirm-password"
              />
            </label>
          )}
          {mode === 'register' ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={pending} testId="button-auth-submit">
                {pending && <LoaderCircle size={16} className="mr-2 animate-spin" />}
                {labels.registerSubmit}
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <button
                type="button"
                onClick={() => navigateTo('/demo')}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition duration-200 hover:bg-secondary"
                data-testid="button-show-demo"
              >
                Show Demo
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          ) : (
            <Button type="submit" disabled={pending} testId="button-auth-submit">
              {pending && !googleLoading && <LoaderCircle size={16} className="mr-2 animate-spin" />}
              {labels.loginSubmit}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
        </form>

        {mode === 'login' && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 font-bold text-muted-foreground">OR</span></div>
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={pending}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground shadow-sm transition hover:bg-secondary disabled:opacity-50"
              data-testid="button-google-login"
            >
              {googleLoading ? <LoaderCircle size={18} className="animate-spin text-primary" /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          {mode === 'login' ? 'Don’t have an account?' : 'Already have an account?'}{' '}
          <Link
            href={mode === 'login' ? '/register' : '/login'}
            className="font-bold text-primary underline-offset-4 hover:underline"
            data-testid="link-auth-switch"
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </Link>
        </p>
        <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          Your farming details are used to personalize your crop analysis. Recommendations are advisory and not a guarantee of outcomes.
        </p>
      </div>
    </div>
  );
}

function LoginPage() { return <AuthPanel mode="login" />; }
function RegisterPage() { return <AuthPanel mode="register" />; }

// ─── DEMO PAGE ───────────────────────────────────────────────────────────────
const demoData = {
  farm: {
    location: 'Kadapa, Andhra Pradesh, India',
    soilType: 'Red Soil',
    waterAvailability: 'Moderate',
    previousCrop: 'Maize',
    season: 'Kharif',
  },
  crops: [
    { name: 'Groundnut', score: 92, reasons: ['Red soil is ideal for groundnut', 'Kharif season aligns perfectly', 'Good rotation after Maize'], risk: 'Low' },
    { name: 'Cotton', score: 78, reasons: ['Tolerates moderate water availability', 'Suitable for Kadapa agro-climate', 'High market demand in region'], risk: 'Moderate' },
    { name: 'Sunflower', score: 71, reasons: ['Short duration fits Kharif window', 'Drought-tolerant crop', 'Improves soil structure'], risk: 'Low' },
  ],
  risks: [
    { label: 'Water Requirement', value: 55, status: 'Moderate', note: 'Groundnut needs 450–600 mm. Borewell irrigation recommended in dry spells.' },
    { label: 'Soil Suitability', value: 88, status: 'Good', note: 'Red soil texture and drainage are well-suited for groundnut root development.' },
    { label: 'Weather Risk', value: 40, status: 'Low', note: 'Kadapa receives 600–800 mm annual rainfall; Kharif onset is generally reliable.' },
    { label: 'Pest & Disease', value: 62, status: 'Moderate', note: 'Monitor for leaf miner and early leaf spot; preventive fungicide at pod formation.' },
  ],
  advisory: `Based on your farm conditions in Kadapa with Red Soil and Moderate water availability, Groundnut is the strongest fit for Kharif 2025.

**Sowing window:** Mid-June to first week of July.
**Seed rate:** 80–100 kg/ha of certified Bold variety (TMV-2 or K-6).
**Irrigation:** Apply 3–4 irrigations at critical stages: flowering, pegging, and pod filling.
**Fertiliser:** Basal dose of 20:40:40 NPK kg/ha. Gypsum application at 500 kg/ha at peg formation improves pod yield.
**Crop rotation benefit:** Following Maize, the residual nitrogen and improved soil tilth benefit groundnut establishment.

Monitor closely for early leaf spot from 30 days after sowing. Harvest when 75% of pods show darkened inner shell.`,
};

function DemoPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const steps = ['Farm Details', 'Farm Analysis', 'Crop Recommendations', 'Risk Analysis', 'AI Farm Advisor'];

  const barColor = (status: string) =>
    status === 'Good' || status === 'Low' ? 'bg-primary' : status === 'Moderate' ? 'bg-[#bd8b3d]' : 'bg-destructive';

  return (
    <div className="mx-auto min-h-[calc(100dvh-68px)] max-w-[1160px] px-5 py-8 md:px-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-[#bd8b3d]">
          <span className="h-2 w-2 rounded-full bg-[#bd8b3d]" />
          Demo Mode — Example Data Only
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-.05em] md:text-4xl" data-testid="demo-title">See AgriGuide in Action</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">This is a walkthrough using static example data. No real farm data, no API calls, no login required.</p>
      </div>

      {/* Step nav */}
      <div className="mb-8 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              step === i ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:bg-secondary'
            }`}
            data-testid={`demo-step-${i}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Step 0 — Farm Details */}
      {step === 0 && (
        <div className="enter">
          <div className="rounded-[28px] border border-border bg-card p-6 md:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary mb-2">Step 1 — Example Farm</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight mb-6">Farm Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(demoData.farm).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="mt-1 font-bold text-foreground">{val}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-xl bg-accent/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
              <span className="font-bold">Example only.</span> In a real analysis, you enter your own farm's soil type, water source, season and location. AgriGuide uses these to compute crop suitability scores.
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setStep(1)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg" data-testid="demo-next-0">
              Next: Farm Analysis <ArrowRight size={15} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — Farm Analysis */}
      {step === 1 && (
        <div className="enter">
          <div className="rounded-[28px] border border-border bg-card p-6 md:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary mb-2">Step 2 — Example Analysis</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight mb-4">Farm Analysis</h2>
            <p className="text-sm leading-6 text-muted-foreground mb-6 max-w-xl">AgriGuide cross-references your farm inputs against a curated crop database using a deterministic suitability engine — no guessing, no black boxes.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[['🌱', 'Soil Evaluation', 'Red Soil matched against 47 crop benchmarks for texture, drainage and pH compatibility.'],
                ['💧', 'Water & Irrigation', 'Moderate availability with Borewell source assessed against each crop\'s seasonal water budget.'],
                ['🌦️', 'Season & Rotation', 'Kharif season timing and post-Maize rotation impact computed for each candidate crop.']
              ].map(([icon, title, desc]) => (
                <div key={title as string} className="rounded-2xl border border-border bg-background p-5">
                  <span className="text-2xl">{icon}</span>
                  <p className="mt-3 font-bold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(0)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-secondary"><ArrowLeft size={15} className="mr-2" /> Back</button>
            <button onClick={() => setStep(2)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg" data-testid="demo-next-1">Next: Crop Recommendations <ArrowRight size={15} className="ml-2" /></button>
          </div>
        </div>
      )}

      {/* Step 2 — Crop Recommendations */}
      {step === 2 && (
        <div className="enter">
          <div className="rounded-[28px] border border-border bg-card p-6 md:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary mb-2">Step 3 — Example Recommendations</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight mb-6">Top Crop Recommendations</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {demoData.crops.map((crop, idx) => (
                <div key={crop.name} className={`rounded-2xl border p-5 ${idx === 0 ? 'border-primary/40 bg-accent/20' : 'border-border bg-background'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">#{idx + 1} Recommended</p>
                      <p className="mt-1 font-display text-xl font-extrabold">{crop.name}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      crop.risk === 'Low' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>{crop.risk} Risk</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold mb-1.5"><span>Suitability</span><span>{crop.score} / 100</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${crop.score}%` }} />
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {crop.reasons.map(r => (
                      <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-accent/30 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-bold">Example only.</span> Your real results will reflect your actual farm profile and current conditions.
            </p>
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-secondary"><ArrowLeft size={15} className="mr-2" /> Back</button>
            <button onClick={() => setStep(3)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg" data-testid="demo-next-2">Next: Risk Analysis <ArrowRight size={15} className="ml-2" /></button>
          </div>
        </div>
      )}

      {/* Step 3 — Risk Analysis */}
      {step === 3 && (
        <div className="enter">
          <div className="rounded-[28px] border border-border bg-card p-6 md:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary mb-2">Step 4 — Example Risk Analysis</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight mb-6">Risk Breakdown — Groundnut</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {demoData.risks.map(r => (
                <div key={r.label} className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm">{r.label}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      r.status === 'Good' || r.status === 'Low' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>{r.status}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary mb-3">
                    <div className={`h-full rounded-full ${barColor(r.status)} transition-all`} style={{ width: `${r.value}%` }} />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-accent/30 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-bold">Example only.</span> Risk scores are computed deterministically for each crop based on your real farm inputs.
            </p>
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(2)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-secondary"><ArrowLeft size={15} className="mr-2" /> Back</button>
            <button onClick={() => setStep(4)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg" data-testid="demo-next-3">Next: AI Advisor <ArrowRight size={15} className="ml-2" /></button>
          </div>
        </div>
      )}

      {/* Step 4 — AI Farm Advisor */}
      {step === 4 && (
        <div className="enter">
          <div className="rounded-[28px] border border-border bg-card p-6 md:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary mb-2">Step 5 — Example AI Advisory</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight mb-2">AI Farm Advisor</h2>
            <p className="text-sm text-muted-foreground mb-6">Powered by Gemini AI — synthesises your farm profile into a personalised action plan.</p>
            <div className="rounded-2xl border border-border bg-background p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">Example Advisory Response</p>
                <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Demo — Not a real recommendation</span>
              </div>
              <div className="prose prose-sm max-w-none text-sm leading-6 text-foreground whitespace-pre-line">{demoData.advisory}</div>
            </div>
            <p className="mt-5 rounded-xl bg-accent/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
              <span className="font-bold">Important:</span> This is example content. Your real advisory is generated by Gemini AI using your actual farm profile. AI guidance supports your judgement — it does not replace agronomists or official advisories.
            </p>
          </div>

          {/* Final CTA */}
          <div className="mt-6 overflow-hidden rounded-[28px] bg-[#274c3f] p-8 text-[#f4f0dc] text-center md:p-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#d8c68f]">Ready to use your own farm data?</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-.04em] md:text-3xl">Get personalised crop recommendations for your field.</h2>
            <p className="mt-3 text-sm leading-6 text-[#c7d2c3]">Create a free account to run a real analysis with your soil, water, and location.</p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => setLocation('/register')}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d8c68f] px-6 text-sm font-bold text-[#274c3f] transition hover:-translate-y-0.5 hover:shadow-lg"
                data-testid="demo-cta-register"
              >
                Create your account <ArrowRight size={15} className="ml-2" />
              </button>
              <button
                onClick={() => setStep(0)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-bold text-[#f4f0dc] transition hover:bg-white/10"
                data-testid="demo-restart"
              >
                Restart demo
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-start">
            <button onClick={() => setStep(3)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-secondary"><ArrowLeft size={15} className="mr-2" /> Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const labels = translations[useContext(LanguageContext)];
  const dashboard = useGetDashboard();
  const profile = useGetProfile();
  const farms = useListFarms();
  const [location, setLocation] = useLocation();
  const startDemo = () => setLocation('/analysis?demo=1');
  if (dashboard.isLoading || farms.isLoading || profile.isLoading) return <PageWrap><LoadingRows /></PageWrap>;
  return <PageWrap>
    <PageTitle eyebrow="Your farm, at a glance" title={`${labels.dashboardTitle}${profile.data?.fullName ? `, ${profile.data.fullName.split(' ')[0]}` : ''}.`} sub={labels.dashboardSubtitle} action={<div className="flex flex-wrap gap-2"><Button onClick={startDemo} variant="outline" testId="button-demo-farm">{labels.tryDemo}</Button><Button href="/analysis" testId="button-new-analysis"><Plus size={16} className="mr-2"/>{labels.newAnalysis}</Button></div>} />
    {(dashboard.error || farms.error || profile.error) && <ErrorNotice message="Your overview could not be loaded. Check your connection and retry." retry={() => { dashboard.refetch(); farms.refetch(); profile.refetch(); }} />}
    <div className="grid gap-4 md:grid-cols-[1.35fr_.65fr]">
      <section className="overflow-hidden rounded-[28px] bg-[#254a3d] p-6 text-[#f3efd9] md:p-8" data-testid="card-latest-analysis">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#d5c38d]">Most recent recommendation</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.05em]">{dashboard.data?.latest?.topCrop || 'Your next crop, thoughtfully chosen.'}</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Leaf size={21}/></span></div>
         {dashboard.data?.latest ? <><p className="mt-2 text-sm text-[#c6d2c6]">{dashboard.data.latest.farm.farmName || dashboard.data.latest.farm.village || 'Farm'} · {dashboard.data.latest.farm.season} season</p><div className="mt-7 flex items-end justify-between border-t border-white/15 pt-5"><div><span className="text-4xl font-extrabold tracking-[-.06em]">{dashboard.data.latest.topScore}</span><span className="ml-1 text-sm text-[#bac9b9]">/ 100 fit</span></div><Button href={`/analysis/${dashboard.data.latest.id}`} variant="outline" testId="button-view-latest">View result <ArrowRight size={15} className="ml-2"/></Button></div></> : <><p className="mt-3 max-w-md text-sm leading-6 text-[#c6d2c6]">Start with a farm profile or use a demo field to see what a crop decision can look like.</p><div className="mt-6 flex flex-wrap gap-3"><Button href="/analysis" variant="outline" testId="button-first-analysis">Start analysis <ArrowRight size={15} className="ml-2"/></Button><Button onClick={startDemo} variant="quiet" testId="button-demo-farm">Try Demo Farm <ArrowRight size={15} className="ml-2"/></Button></div></>}
      </section>
      <section className="flex flex-col justify-between rounded-[28px] border border-border bg-card p-6 md:p-7" data-testid="card-analysis-count"><div><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/50 text-primary"><BarChart3 size={20}/></span><p className="mt-5 text-sm font-semibold text-muted-foreground">Analyses completed</p><p className="mt-1 font-display text-5xl font-extrabold tracking-[-.07em]">{dashboard.data?.totalAnalyses ?? '—'}</p></div><Link href="/history" className="mt-8 flex items-center justify-between border-t border-border pt-4 text-sm font-bold" data-testid="link-analysis-history">Review your history <ArrowUpRight size={16}/></Link></section>
    </div>
    <section className="mt-8 grid gap-5 md:grid-cols-[1fr_.82fr]">
      <div className="rounded-[26px] border border-border bg-card p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold">Recent decisions</h2><p className="mt-1 text-xs text-muted-foreground">Your last crop matches, in order.</p></div><Link href="/history" className="text-xs font-bold text-primary" data-testid="link-all-history">See all</Link></div>
        {(dashboard.data?.recent?.length ?? 0) > 0 ? <div className="mt-4 divide-y divide-border">{dashboard.data?.recent.map((item) => <AnalysisRow key={item.id} item={item} />)}</div> : <div className="mt-4 rounded-2xl bg-secondary/60 px-4 py-5 text-sm text-muted-foreground" data-testid="state-recent-empty">No recommendations yet. Your first analysis will appear here.</div>}
      </div>
      <div className="rounded-[26px] border border-border bg-[#ebe9db] p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold">Your farms</h2><p className="mt-1 text-xs text-muted-foreground">Profiles used in crop analysis.</p></div><Link href="/farms" className="text-xs font-bold text-primary" data-testid="link-manage-farms">Manage farms</Link></div>
        {farms.data?.length ? <div className="mt-4 space-y-2">{farms.data.slice(0,3).map((farm) => <div key={farm.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3" data-testid={`farm-summary-${farm.id}`}><div><p className="text-sm font-bold">{farm.farmName || farm.village || 'Untitled farm'}</p><p className="mt-0.5 text-xs text-muted-foreground">{[farm.district, farm.state].filter(Boolean).join(', ') || farm.country}</p></div><span className="text-xs font-semibold text-primary">{farm.soilType}</span></div>)}</div> : <div className="mt-4 rounded-2xl bg-card/70 px-4 py-5"><p className="text-sm font-bold">No farm profile saved</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Save field details once and reuse them in future analyses.</p><Button href="/farms" variant="outline" testId="button-add-first-farm" >Add a farm <Plus size={15} className="ml-2"/></Button></div>}
      </div>
    </section>
    <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-muted-foreground" data-testid="text-advisory-note"><ShieldAlert size={15} className="mt-0.5 shrink-0"/>AgriGuide recommendations are decision support, not guarantees. Confirm with local agricultural experts and official advisories.</p>
  </PageWrap>;
}

function AnalysisRow({ item }: { item: Analysis }) {
  return <Link href={`/analysis/${item.id}`} className="flex items-center justify-between gap-4 py-3.5 hover:text-primary" data-testid={`row-analysis-${item.id}`}><div className="min-w-0"><p className="truncate text-sm font-bold">{item.topCrop}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.farm.farmName || item.farm.village || 'Farm'} · {new Date(item.createdAt).toLocaleDateString()}</p></div><span className="shrink-0 rounded-full bg-[#e7ecd9] px-3 py-1.5 text-xs font-extrabold text-primary">{item.topScore} fit</span></Link>;
}

function AnalysisPage({ lang: _lang }: { lang: Lang }) {
  const labels = translations[_lang];
  const preselected = new URLSearchParams(window.location.search).get('farm') || '';
  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
  const farms = useListFarms();
  const crops = useListCrops();
  const create = useCreateAnalysis();
  const [farmId, setFarmId] = useState(preselected);
  const selectedFarm = useGetFarm(farmId, { query: { enabled: !!farmId, queryKey: getGetFarmQueryKey(farmId), retry: false } });
  const [details, setDetails] = useState<FarmInput>(isDemo ? demoFarm : initialFarm);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const lat = Number(details.latitude);
  const lon = Number(details.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon) && details.latitude !== null && details.longitude !== null && details.latitude !== undefined && details.longitude !== undefined;
  const weatherParams = { latitude: hasCoords ? lat : 0, longitude: hasCoords ? lon : 0 };
  const weatherQuery = useGetWeather(weatherParams, { query: { enabled: hasCoords, queryKey: getGetWeatherQueryKey(weatherParams), retry: false } });
  const update = (name: keyof FarmInput, next: string) => setDetails((prior) => ({ ...prior, [name]: ['latitude','longitude'].includes(name) ? next === '' ? null : Number(next) : next }));
  useEffect(() => { if (selectedFarm.data) setDetails(adaptFarm(selectedFarm.data)); }, [selectedFarm.data]);
  const weatherReady = !hasCoords || !weatherQuery.isLoading;
  const submit = () => {
    setError('');
    if (!weatherReady) return;
    const weather: Weather = weatherQuery.data ? weatherQuery.data : {
      temperatureC: null, rainfallMm: null, humidityPercent: null, windKmh: null,
      condition: 'Weather lookup unavailable', source: 'unavailable', fallback: true,
    };
    create.mutate({ data: { ...farmPayload(details), ...(farmId ? { farmProfileId: farmId } : {}), weather } }, {
      onSuccess: (analysis) => { setResult(analysis); setStep(4); },
      onError: (failure) => setError(failure instanceof Error ? failure.message : 'The analysis could not be completed.'),
    });
  };
  if (result) return <Results analysis={result} weatherFallback={result.weather.fallback} onReset={() => { setResult(null); setStep(1); }} />;
  const stepLabels = [labels.stepLand,labels.stepWater,labels.stepLocation,labels.stepReview];
  return <PageWrap className="max-w-[960px]">
    <PageTitle eyebrow={labels.analysis} title={labels.analysisTitle} sub={labels.analysisSubtitle} action={<Link href="/farms" className="text-sm font-bold text-primary underline-offset-4 hover:underline" data-testid="link-farm-profiles">{labels.farms} <ArrowUpRight size={14} className="ml-1 inline"/></Link>} />
    {error && <ErrorNotice message={error} />}
    {farms.isLoading && <div className="mb-5 h-10 animate-pulse rounded-xl bg-secondary" />}
    {farms.data && farms.data.length > 0 && <div className="mb-6 rounded-2xl border border-border bg-[#ecebdd] p-4"><label className="mb-2 block text-sm font-bold" htmlFor="saved-farm">Use a saved farm profile</label><div className="flex flex-col gap-3 sm:flex-row"><select id="saved-farm" value={farmId} onChange={(e) => { setFarmId(e.target.value); if (!e.target.value) setDetails(initialFarm); }} className="h-11 flex-1 rounded-xl border border-input bg-card px-3 text-sm" data-testid="select-saved-farm"><option value="">Enter details manually</option>{farms.data.map((farm) => <option key={farm.id} value={farm.id}>{farm.farmName || farm.village || 'Farm'}{farm.state ? ` · ${farm.state}` : ''}</option>)}</select><Button href="/farms" variant="outline" testId="button-create-farm-from-analysis"><Plus size={15} className="mr-2"/>Add farm</Button></div></div>}
    {crops.error && <p className="mb-4 text-xs text-muted-foreground" data-testid="status-crop-catalog">Crop catalogue is unavailable. The server will still assess your farm inputs.</p>}
    {crops.isLoading && <span className="sr-only" data-testid="status-crops-loading">Loading crop catalogue</span>}
    <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-2" data-testid="analysis-stepper">{stepLabels.map((label, i) => <div key={label} className="flex shrink-0 items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold ${step > i + 1 ? 'bg-primary text-primary-foreground' : step === i + 1 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>{step > i + 1 ? <Check size={15}/> : i + 1}</span><span className={`text-xs font-bold ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>{i < 3 && <span className="mx-1 h-px w-5 bg-border sm:w-10"/>}</div>)}</div>
    <form onSubmit={(e) => { e.preventDefault(); if (step < 3) setStep(step + 1); else submit(); }} className="rounded-[28px] border border-border bg-card p-5 shadow-sm md:p-8">
      {step === 1 && <><h2 className="font-display text-2xl font-extrabold tracking-[-.04em]">First, the field itself.</h2><p className="mb-6 mt-1 text-sm text-muted-foreground">Start with soil and what you grew last season.</p><FieldGrid value={details} onChange={update} previousCropOptions={crops.data?.map((crop) => crop.name) ?? []} /></>}
      {step === 2 && <><h2 className="font-display text-2xl font-extrabold tracking-[-.04em]">Water and season.</h2><p className="mb-6 mt-1 text-sm text-muted-foreground">These shape what is practical to grow now.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Water availability" name="waterAvailability" value={details.waterAvailability} onChange={(v)=>update('waterAvailability',v)} options={['Very Low','Low','Moderate','High','Very High']} required/><Field label="Irrigation source" name="irrigationSource" value={details.irrigationSource} onChange={(v)=>update('irrigationSource',v)} options={['Rain-fed','Borewell','Canal','Well','River','Drip','Sprinkler']} required/><Field label="Previous crop" name="previousCrop" value={details.previousCrop} onChange={(v)=>update('previousCrop',v)} placeholder="e.g. Cotton" required/><Field label="Season" name="season" value={details.season} onChange={(v)=>update('season',v)} options={['Kharif','Rabi','Summer']} required/></div></>}
      {step === 3 && <><h2 className="font-display text-2xl font-extrabold tracking-[-.04em]">Place your field on the map.</h2><p className="mb-6 mt-1 text-sm text-muted-foreground">Location helps us add weather context. Coordinates are optional.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Country" name="country" value={details.country} onChange={(v)=>update('country',v)} required/><Field label="State" name="state" value={details.state} onChange={(v)=>update('state',v)} placeholder="Andhra Pradesh"/><Field label="District" name="district" value={details.district} onChange={(v)=>update('district',v)} placeholder="District"/><Field label="Village" name="village" value={details.village} onChange={(v)=>update('village',v)} placeholder="Village or mandal"/><Field label="Latitude (optional)" name="latitude" type="number" min="-90" max="90" step="any" value={details.latitude} onChange={(v)=>update('latitude',v)} placeholder="17.3850"/><Field label="Longitude (optional)" name="longitude" type="number" min="-180" max="180" step="any" value={details.longitude} onChange={(v)=>update('longitude',v)} placeholder="78.4867"/></div><div className="mt-5 flex items-start gap-3 rounded-xl bg-secondary/60 p-4 text-xs leading-5 text-muted-foreground"><MapPin size={16} className="mt-0.5 shrink-0 text-primary"/><span>{hasCoords ? 'Coordinates added. We’ll try to retrieve weather for this location.' : 'No coordinates? No problem. Weather context will be marked unavailable rather than estimated.'}</span></div></>}
      {step === 4 && <div/>}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">{step > 1 ? <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary" data-testid="button-analysis-back"><ArrowLeft size={16}/>Back</button> : <span className="text-xs text-muted-foreground">Step 1 of 3</span>}
        {step < 3 ? <Button type="submit" testId="button-analysis-next">{labels.continue} <ArrowRight size={16} className="ml-2"/></Button> : <Button type="submit" disabled={create.isPending || (hasCoords && weatherQuery.isLoading)} testId="button-run-analysis">{create.isPending ? <><LoaderCircle size={16} className="mr-2 animate-spin"/>Calculating…</> : hasCoords && weatherQuery.isLoading ? 'Checking local weather…' : <>{labels.calculate} <ArrowRight size={16} className="ml-2"/></>}</Button>}
      </div>
    </form>
    {hasCoords && weatherQuery.error && <div className="mt-4"><ErrorNotice message="Weather lookup failed. The analysis can continue with weather clearly marked unavailable." retry={() => weatherQuery.refetch()} /></div>}
    <p className="mt-5 text-xs leading-5 text-muted-foreground" data-testid="text-analysis-ai-disclaimer"><ShieldAlert size={14} className="mr-1 inline"/>Crop suggestions are advisory, based on the information provided and available data. Discuss important decisions with a local agricultural officer.</p>
  </PageWrap>;
}

function Results({ analysis, weatherFallback, onReset }: { analysis: Analysis; weatherFallback: boolean; onReset: () => void }) {
  const advice = useGetAiAdvice();
  const [adviceResult, setAdviceResult] = useState<import('@workspace/api-client-react').Advice | null>(null);
  const [adviceError, setAdviceError] = useState('');
  const getAdvice = () => { setAdviceError(''); advice.mutate({ data: { analysisId: analysis.id } }, { onSuccess: setAdviceResult, onError: (e) => setAdviceError(e instanceof Error ? e.message : 'Advice is unavailable at the moment.') }); };
  return <PageWrap className="max-w-[1000px] enter">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary">Your field report · {analysis.farm.season}</p><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em] md:text-5xl">A clear place to start.</h1><p className="mt-2 text-sm text-muted-foreground">{analysis.farm.farmName || analysis.farm.village || 'Your farm'} · {analysis.farm.soilType} · saved {new Date(analysis.createdAt).toLocaleDateString()}</p></div><div className="flex gap-2"><Button onClick={onReset} variant="outline" testId="button-another-analysis">New analysis</Button><Button href="/history" variant="quiet" testId="button-results-history">History <ArrowUpRight size={15} className="ml-2"/></Button></div></div>
    <div className="grid gap-4 md:grid-cols-[1.12fr_.88fr]">
      <section className="rounded-[28px] bg-[#254a3d] p-6 text-[#f4f0dc] md:p-8" data-testid="card-top-recommendation"><div className="flex justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#d8c68f]">Best fit in this analysis</p><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Leaf size={22}/></span></div><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.06em]">{analysis.topCrop}</h2><div className="mt-5 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-[-.08em]">{analysis.topScore}</span><span className="mb-2 text-sm text-[#c8d2c3]">out of 100 fit</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d8c68f]" style={{ width: `${Math.max(0,Math.min(100,analysis.topScore))}%` }}/></div><p className="mt-5 text-sm leading-6 text-[#c8d2c3]">{analysis.recommendations[0]?.why || 'The server has ranked this crop based on your farm profile.'}</p></section>
      <section className="rounded-[28px] border border-border bg-card p-6 md:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e2e8d8] text-primary"><CloudSun size={20}/></span><div><h3 className="font-display text-lg font-extrabold">Weather context</h3><p className="text-xs text-muted-foreground">{analysis.weather.source || 'Weather service'}</p></div></div>{weatherFallback && <p className="mt-4 rounded-xl bg-[#f3e9ce] p-3 text-xs leading-5 text-[#745b2b]" data-testid="status-weather-fallback">Weather lookup was unavailable. This recommendation does not include live local weather conditions.</p>}<div className="mt-5 grid grid-cols-2 gap-3">{[[<CloudSun size={15}/>,'Temperature',analysis.weather.temperatureC == null ? '—' : `${analysis.weather.temperatureC}°C`],[<Droplets size={15}/>,'Rainfall',analysis.weather.rainfallMm == null ? '—' : `${analysis.weather.rainfallMm} mm`],[<Droplets size={15}/>,'Humidity',analysis.weather.humidityPercent == null ? '—' : `${analysis.weather.humidityPercent}%`],[<Wind size={15}/>,'Wind',analysis.weather.windKmh == null ? '—' : `${analysis.weather.windKmh} km/h`]].map(([icon,label,value])=><div key={String(label)} className="rounded-xl bg-secondary/65 p-3"><div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">{icon}{label}</div><p className="mt-2 text-lg font-extrabold">{value}</p></div>)}</div></section>
    </div>
    <section className="mt-7"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-primary">Your shortlist</p><h2 className="mt-1 font-display text-2xl font-extrabold">Other crops worth a look</h2></div><span className="text-xs text-muted-foreground">{analysis.recommendations.length} matches</span></div><div className="grid gap-3">{analysis.recommendations.map((recommendation) => <article key={`${recommendation.rank}-${recommendation.crop}`} className="rounded-2xl border border-border bg-card p-5" data-testid={`card-recommendation-${recommendation.rank}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/55 font-extrabold text-primary">0{recommendation.rank}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-xl font-extrabold">{recommendation.crop}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${recommendation.riskLevel === 'Low' ? 'bg-[#e3eddb] text-[#416c4a]' : recommendation.riskLevel === 'High' ? 'bg-[#f5dfd9] text-[#99483b]' : 'bg-[#f2e9d1] text-[#81632e]'}`}>{recommendation.riskLevel} risk</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.why}</p><div className="mt-4 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-secondary px-3 py-1.5 font-semibold">Water: {recommendation.waterRequirement}</span><span className="rounded-full bg-secondary px-3 py-1.5 font-semibold">Growth: {recommendation.growthDuration}</span>{recommendation.seasons.map((s)=><span key={s} className="rounded-full bg-secondary px-3 py-1.5 font-semibold">{s}</span>)}</div>{recommendation.risks?.length > 0 && <p className="mt-3 text-xs leading-5 text-[#875c37]">Consider: {recommendation.risks.join(' · ')}</p>}<div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">{Object.entries(recommendation.factors).map(([factor, score])=><div key={factor}><div className="mb-1 flex justify-between text-[9px] font-bold capitalize text-muted-foreground"><span>{factor}</span><span>{score}</span></div><div className="h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{width:`${Math.max(0,Math.min(100,score))}%`}}/></div></div>)}</div></div><div className="shrink-0 text-right"><p className="text-2xl font-extrabold">{recommendation.score}</p><p className="text-[10px] text-muted-foreground">fit score</p></div></div></article>)}</div></section>
    <section className="mt-7 rounded-[26px] border border-border bg-[#ebe9db] p-5 md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-display text-xl font-extrabold">Want a practical action plan?</h2><p className="mt-1 text-sm text-muted-foreground">Ask for an additional AI summary based on this saved analysis.</p></div><Button onClick={getAdvice} disabled={advice.isPending} testId="button-get-advice">{advice.isPending ? 'Preparing advice…' : adviceResult ? 'Refresh advice' : 'Get field advice'} <ArrowRight size={15} className="ml-2"/></Button></div>{adviceError && <ErrorNotice message={adviceError}/ >}{adviceResult && <div className="mt-5 grid gap-4 rounded-2xl bg-card p-5 md:grid-cols-2" data-testid="panel-ai-advice"><div className="md:col-span-2"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-primary">AI advisory summary</p><p className="mt-2 text-sm leading-6">{adviceResult.summary}</p></div>{[['Reasons',adviceResult.reasons],['Action plan',adviceResult.actionPlan],['Risks',adviceResult.risks]].map(([heading,items])=><div key={String(heading)}><h3 className="text-sm font-extrabold">{heading}</h3><ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">{(items as string[]).map((item)=><li key={item}>• {item}</li>)}</ul></div>)}<div><h3 className="text-sm font-extrabold">Water & weather</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{adviceResult.waterAdvice}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{adviceResult.weatherAdvice}</p></div><p className="md:col-span-2 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">AI advice is informational and may not account for every local condition. Confirm with a qualified local source before acting.</p></div>}</section>
  </PageWrap>;
}

function AnalysisDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const query = useGetAnalysis(id, { query: { enabled: !!id, queryKey: getGetAnalysisQueryKey(id), retry: false } });
  if (query.isLoading) return <PageWrap><LoadingRows/></PageWrap>;
  if (query.error) return <PageWrap><ErrorNotice message="This analysis could not be loaded." retry={() => query.refetch()}/><Button href="/history" variant="outline" testId="button-back-history"><ArrowLeft size={15} className="mr-2"/>Back to history</Button></PageWrap>;
  return query.data ? <Results analysis={query.data} weatherFallback={query.data.weather.fallback} onReset={() => { setLocation('/analysis'); }} /> : null;
}

function FarmsPage() {
  const labels = translations[useContext(LanguageContext)];
  const queryClient = useQueryClient();
  const farms = useListFarms();
  const cropCatalogue = useListCrops();
  const create = useCreateFarm();
  const updateFarmMutation = useUpdateFarm();
  const deleteFarmMutation = useDeleteFarm();
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [value, setValue] = useState<FarmInput>(initialFarm);
  const [error, setError] = useState('');
  const detail = useGetFarm(editing || '', { query: { enabled: !!editing, queryKey: getGetFarmQueryKey(editing || ''), retry: false } });
  useEffect(() => { if (detail.data) setValue(adaptFarm(detail.data)); }, [detail.data]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
  const save = (event: FormEvent) => {
    event.preventDefault(); setError('');
    const onSuccess = () => { invalidate(); setFormOpen(false); setEditing(null); setValue(initialFarm); };
    const onError = (failure: unknown) => setError(failure instanceof Error ? failure.message : 'Unable to save farm details.');
    if (editing) updateFarmMutation.mutate({ id: editing, data: farmPayload(value) as FarmUpdate }, { onSuccess, onError });
    else create.mutate({ data: farmPayload(value) }, { onSuccess, onError });
  };
  const startEdit = (farm: Farm) => { setEditing(farm.id); setValue(adaptFarm(farm)); setFormOpen(true); };
  const remove = (farm: Farm) => { if (window.confirm(`Delete ${farm.farmName || 'this farm'}? Existing analysis history will remain.`)) deleteFarmMutation.mutate({ id: farm.id }, { onSuccess: invalidate, onError: (e) => setError(e instanceof Error ? e.message : 'Unable to delete this farm.') }); };
  return <PageWrap>
    <PageTitle eyebrow={labels.farms} title={labels.farmsTitle} sub="Keep your field details in one place and reuse them whenever you assess a crop." action={<Button onClick={() => {setEditing(null);setValue(initialFarm);setFormOpen(true);}} testId="button-add-farm"><Plus size={16} className="mr-2"/>{labels.addFarm}</Button>} />
    {error && <ErrorNotice message={error}/>}
    {formOpen && <div className="mb-7 rounded-[26px] border border-border bg-card p-5 md:p-7"><div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-primary">{editing ? 'Edit profile' : 'New profile'}</p><h2 className="mt-1 font-display text-2xl font-extrabold">{editing ? 'Update farm details' : 'Add a farm'}</h2></div><button onClick={()=>{setFormOpen(false);setEditing(null);}} className="rounded-full p-2 hover:bg-secondary" aria-label="Close form" data-testid="button-close-farm-form"><X size={18}/></button></div><form onSubmit={save}><FieldGrid value={value} onChange={(name,next)=>setValue((prev)=>({...prev,[name]:['latitude','longitude'].includes(name)?next===''?null:Number(next):next}))} previousCropOptions={cropCatalogue.data?.map((crop)=>crop.name) ?? []}/><div className="mt-6 flex justify-end gap-2"><Button variant="quiet" onClick={()=>setFormOpen(false)} testId="button-cancel-farm">Cancel</Button><Button type="submit" disabled={create.isPending||updateFarmMutation.isPending} testId="button-save-farm">{create.isPending||updateFarmMutation.isPending?'Saving…':'Save farm'}</Button></div></form></div>}
    {farms.isLoading ? <LoadingRows/> : farms.error ? <ErrorNotice message="Farm profiles could not be loaded." retry={()=>farms.refetch()}/> : farms.data?.length ? <div className="grid gap-4 md:grid-cols-2">{farms.data.map((farm)=><article key={farm.id} className="rounded-[24px] border border-border bg-card p-5 md:p-6" data-testid={`card-farm-${farm.id}`}><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4e8d8] text-primary"><Sprout size={21}/></span><div className="flex gap-1"><button onClick={()=>startEdit(farm)} className="rounded-full px-3 py-2 text-xs font-bold hover:bg-secondary" data-testid={`button-edit-farm-${farm.id}`}>Edit</button><button onClick={()=>remove(farm)} disabled={deleteFarmMutation.isPending} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete farm" data-testid={`button-delete-farm-${farm.id}`}><Trash2 size={16}/></button></div></div><h2 className="mt-4 font-display text-xl font-extrabold">{farm.farmName || farm.village || 'Untitled farm'}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={13}/>{[farm.village,farm.district,farm.state,farm.country].filter(Boolean).join(', ')}</p><div className="mt-5 grid grid-cols-2 gap-2">{[['Soil',farm.soilType],['Water',farm.waterAvailability],['Last crop',farm.previousCrop],['Season',farm.season]].map(([label,val])=><div key={label} className="rounded-xl bg-secondary/65 p-3"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-bold">{val}</p></div>)}</div><Link href={`/analysis?farm=${farm.id}`} className="mt-4 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid={`link-analyze-farm-${farm.id}`}>Analyze crops for this farm <ArrowRight size={15}/></Link></article>)}</div> : <EmptyState title="No farm profiles yet" detail="Add a farm profile once; soil, water and rotation details are ready when you need your next crop recommendation." action={<Button onClick={()=>setFormOpen(true)} testId="button-empty-add-farm"><Plus size={15} className="mr-2"/>Add your first farm</Button>}/>}
    {detail.error && editing && <ErrorNotice message="Farm details could not be refreshed. You can still edit the values shown."/>}
  </PageWrap>;
}

function HistoryPage() {
  const labels = translations[useContext(LanguageContext)];
  const queryClient = useQueryClient();
  const analyses = useListAnalyses();
  const farms = useListFarms();
  const deleteAnalysis = useDeleteAnalysis();
  const [search, setSearch] = useState('');
  const [season, setSeason] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [soilFilter, setSoilFilter] = useState('all');
  const [waterFilter, setWaterFilter] = useState('all');
  const [sort, setSort] = useState<'newest'|'oldest'|'highest'|'lowest'>('newest');
  const [error, setError] = useState('');
  const rows = useMemo(() => {
    const list = (analyses.data || []).filter((entry) =>
      `${entry.topCrop} ${entry.farm.farmName || ''} ${entry.farm.village || ''} ${entry.farm.district || ''} ${entry.farm.state || ''} ${entry.farm.country}`
        .toLowerCase().includes(search.toLowerCase()) &&
      (season === 'all' || entry.farm.season === season) &&
      (cropFilter === 'all' || entry.topCrop === cropFilter) &&
      (soilFilter === 'all' || entry.farm.soilType === soilFilter) &&
      (waterFilter === 'all' || entry.farm.waterAvailability === waterFilter),
    );
    return list.sort((a,b) =>
      sort === 'highest' ? b.topScore - a.topScore :
      sort === 'lowest' ? a.topScore - b.topScore :
      sort === 'newest' ? new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime() :
      new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime(),
    );
  }, [analyses.data, search, season, cropFilter, soilFilter, waterFilter, sort]);
  const cropOptions = Array.from(new Set((analyses.data ?? []).map((entry) => entry.topCrop))).sort();
  const hasFilters = Boolean(search) || season !== 'all' || cropFilter !== 'all' || soilFilter !== 'all' || waterFilter !== 'all';
  const remove = (analysis: Analysis) => { if (window.confirm(`Delete the ${analysis.topCrop} analysis? This cannot be undone.`)) deleteAnalysis.mutate({ id: analysis.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); }, onError: (e) => setError(e instanceof Error ? e.message : 'Could not delete analysis.') }); };
  return <PageWrap>
    <PageTitle eyebrow={labels.history} title={labels.historyTitle} sub={labels.historySubtitle} action={<Button href="/analysis" testId="button-history-new-analysis"><Plus size={16} className="mr-2"/>{labels.newAnalysis}</Button>}/>
    {error && <ErrorNotice message={error}/>}
    <div className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="relative"><Search size={17} className="absolute left-3 top-3 text-muted-foreground"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={labels.searchHistory} className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-history-search"/></label>
      <label><span className="sr-only">Filter by crop</span><select value={cropFilter} onChange={(e)=>setCropFilter(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-history-crop"><option value="all">{labels.allCrops}</option>{cropOptions.map((crop)=><option key={crop}>{crop}</option>)}</select></label>
      <label><span className="sr-only">Filter by soil</span><select value={soilFilter} onChange={(e)=>setSoilFilter(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-history-soil"><option value="all">{labels.allSoils}</option>{['Black Soil','Red Soil','Alluvial Soil','Sandy Soil','Loamy Soil','Clay Soil','Laterite Soil'].map((soil)=><option key={soil}>{soil}</option>)}</select></label>
      <label><span className="sr-only">Filter by water availability</span><select value={waterFilter} onChange={(e)=>setWaterFilter(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-history-water"><option value="all">{labels.allWater}</option>{['Very Low','Low','Moderate','High','Very High'].map((water)=><option key={water}>{water}</option>)}</select></label>
      <label><span className="sr-only">Filter by season</span><select value={season} onChange={(e)=>setSeason(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-history-season"><option value="all">{labels.allSeasons}</option><option>Kharif</option><option>Rabi</option><option>Summer</option></select></label>
      <label><span className="sr-only">Sort analyses</span><select value={sort} onChange={(e)=>setSort(e.target.value as 'newest'|'oldest'|'highest'|'lowest')} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" data-testid="select-history-sort"><option value="newest">{labels.newest}</option><option value="oldest">{labels.oldest}</option><option value="highest">{labels.highest}</option><option value="lowest">{labels.lowest}</option></select></label>
    </div>
    {analyses.isLoading || farms.isLoading ? <LoadingRows/> : analyses.error || farms.error ? <ErrorNotice message="Analysis history could not be loaded." retry={()=>{analyses.refetch();farms.refetch();}}/> : rows.length ? <div className="space-y-3">{rows.map((analysis)=><article key={analysis.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5" data-testid={`row-history-${analysis.id}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e1e8d8] text-primary"><FileText size={20}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-extrabold">{analysis.topCrop}</h2><span className="rounded-full bg-accent/50 px-2.5 py-1 text-[10px] font-extrabold">{analysis.farm.season}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{analysis.farm.farmName || analysis.farm.village || 'Farm'} · {[analysis.farm.district,analysis.farm.state].filter(Boolean).join(', ') || analysis.farm.country} · {new Date(analysis.createdAt).toLocaleDateString()}</p><p className="mt-1 text-[11px] text-muted-foreground">Soil: {analysis.farm.soilType} · Water: {analysis.farm.waterAvailability}</p></div><div className="flex items-center gap-2"><span className="mr-2 text-right"><strong className="block text-lg">{analysis.topScore}</strong><small className="text-[10px] text-muted-foreground">fit score</small></span><Button href={`/analysis/${analysis.id}`} variant="outline" testId={`button-view-analysis-${analysis.id}`}>View</Button><button onClick={()=>remove(analysis)} disabled={deleteAnalysis.isPending} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete analysis" data-testid={`button-delete-analysis-${analysis.id}`}><Trash2 size={16}/></button></div></article>)}</div> : <EmptyState icon={Search} title={hasFilters ? 'No matching analyses' : 'No saved analyses yet'} detail={hasFilters ? 'Try different crop, soil, water, location or season filters.' : 'When you complete a crop analysis, your result will be saved here.'} action={hasFilters ? <Button variant="outline" onClick={()=>{setSearch('');setSeason('all');setCropFilter('all');setSoilFilter('all');setWaterFilter('all');}} testId="button-clear-filters">Clear filters</Button> : <Button href="/analysis" testId="button-empty-history-analysis">Start an analysis <ArrowRight size={15} className="ml-2"/></Button>}/>}
    <p className="mt-4 text-xs text-muted-foreground">{rows.length} {rows.length === 1 ? 'analysis' : 'analyses'} shown</p>
  </PageWrap>;
}

function ProfilePage() {
  const labels = translations[useContext(LanguageContext)];
  const queryClient = useQueryClient();
  const profile = useGetProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(()=>{ if(profile.data) setName(profile.data.fullName); },[profile.data]);
  const save = (event: FormEvent) => {
    event.preventDefault(); setNotice(''); setError('');
    if (newPassword && (!currentPassword || newPassword.length < 8)) {
      setError(!currentPassword ? 'Enter your current password to set a new one.' : 'A new password must be at least 8 characters.');
      return;
    }
    const data: {fullName?:string;currentPassword?:string;newPassword?:string} = {};
    if(name.trim() && name.trim() !== profile.data?.fullName) data.fullName = name.trim();
    if(newPassword) { data.currentPassword = currentPassword; data.newPassword = newPassword; }
    if(!Object.keys(data).length) { setNotice('Nothing has changed yet.'); return; }
    updateProfile.mutate({data}, {onSuccess:(user)=>{setName(user.fullName);setCurrentPassword('');setNewPassword('');setNotice('Your profile has been updated.');queryClient.invalidateQueries({queryKey:getGetProfileQueryKey()});queryClient.invalidateQueries({queryKey:getGetCurrentUserQueryKey()});},onError:(e)=>setError(e instanceof Error?e.message:'Unable to update your profile.')});
  };
  return <PageWrap className="max-w-[900px]">
    <PageTitle eyebrow={labels.profile} title={labels.profileTitle} sub="Keep your account details current and protect access to your farm records."/>
    {profile.isLoading ? <LoadingRows/> : profile.error ? <ErrorNotice message="Your profile could not be loaded." retry={()=>profile.refetch()}/> : <div className="grid gap-5 md:grid-cols-[.72fr_1.28fr]"><aside className="rounded-[26px] bg-[#254a3d] p-6 text-[#f3efd9]"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#d9c88d] font-display text-2xl font-extrabold text-[#254a3d]">{profile.data?.fullName.slice(0,1).toUpperCase()}</span><h2 className="mt-5 font-display text-2xl font-extrabold">{profile.data?.fullName}</h2><p className="mt-1 break-all text-sm text-[#c7d1c2]">{profile.data?.email}</p><p className="mt-8 border-t border-white/15 pt-4 text-xs leading-5 text-[#c7d1c2]">Account opened {profile.data?.createdAt ? new Date(profile.data.createdAt).toLocaleDateString() : '—'}</p></aside><form onSubmit={save} className="rounded-[26px] border border-border bg-card p-5 md:p-7"><h2 className="font-display text-xl font-extrabold">Personal details</h2><p className="mt-1 text-xs text-muted-foreground">Update your name or change your password.</p>{error&&<ErrorNotice message={error}/ >}{notice&&<p className="mt-4 rounded-xl bg-[#e1ecd9] p-3 text-sm font-semibold text-primary" role="status" data-testid="status-profile-success">{notice}</p>}<div className="mt-5 space-y-4"><Field label="Full name" name="fullName" value={name} onChange={setName} required testId="input-profile-name"/><label className="block text-sm font-semibold">Email address<input name="email" value={profile.data?.email || ''} readOnly className="mt-1.5 h-11 w-full cursor-not-allowed rounded-xl border border-input bg-secondary/50 px-3.5 text-sm text-muted-foreground" data-testid="input-profile-email"/></label><div className="my-5 border-t border-border pt-5"><p className="text-sm font-extrabold">Change password</p><p className="mt-1 text-xs text-muted-foreground">Leave blank to keep your current password.</p></div><Field label="Current password" name="currentPassword" type="password" value={currentPassword} onChange={setCurrentPassword} testId="input-current-password"/><Field label="New password" name="newPassword" type="password" value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" testId="input-new-password"/></div><div className="mt-6 flex justify-end"><Button type="submit" disabled={updateProfile.isPending} testId="button-save-profile">{updateProfile.isPending?'Saving…':'Save changes'} <CheckCircle2 size={16} className="ml-2"/></Button></div></form></div>}
  </PageWrap>;
}

function SystemStatusPage() {
  const [health, setHealth] = useState<{ backend?: string; database?: string; loading: boolean; error?: string }>({
    loading: true,
  });

  const checkStatus = async () => {
    setHealth({ loading: true });
    try {
      const [backendRes, dbRes] = await Promise.all([
        fetch('/api/health').then((r) => r.json()).catch(() => ({ success: false, backend: 'disconnected' })),
        fetch('/api/health/db').then((r) => r.json()).catch(() => ({ success: false, database: 'disconnected' })),
      ]);
      setHealth({
        backend: backendRes.backend === 'connected' ? 'Connected' : 'Disconnected',
        database: dbRes.database === 'connected' ? 'Connected' : 'Disconnected',
        loading: false,
      });
    } catch (e: any) {
      setHealth({
        backend: 'Disconnected',
        database: 'Disconnected',
        loading: false,
        error: e.message,
      });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <PageWrap className="max-w-[700px]">
      <PageTitle
        eyebrow="System Health"
        title="Backend & Database Status"
        sub="Live connection status for development and system health monitoring."
      />
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className={`h-3.5 w-3.5 rounded-full ${health.backend === 'Connected' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-destructive'}`} />
            <div>
              <p className="text-sm font-bold text-foreground">Express API Backend</p>
              <p className="text-xs text-muted-foreground">HTTP API Services</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${health.backend === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {health.loading ? 'Checking…' : health.backend || 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <span className={`h-3.5 w-3.5 rounded-full ${health.database === 'Connected' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-destructive'}`} />
            <div>
              <p className="text-sm font-bold text-foreground">Supabase PostgreSQL</p>
              <p className="text-xs text-muted-foreground">Persistent Database</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${health.database === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {health.loading ? 'Checking…' : health.database || 'Disconnected'}
          </span>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={checkStatus} disabled={health.loading} variant="outline" testId="button-refresh-status">
            {health.loading ? 'Checking…' : 'Refresh status'}
          </Button>
        </div>
      </div>
    </PageWrap>
  );
}

export default App;
